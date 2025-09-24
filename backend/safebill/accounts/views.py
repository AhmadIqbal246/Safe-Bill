from rest_framework import status
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.conf import settings
from .serializers import (
    SellerRegistrationSerializer, UserTokenObtainPairSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
     BankAccountSerializer,
    UserProfileSerializer, BuyerRegistrationSerializer, SellerRatingSerializer
)
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import BankAccount, BusinessDetail
from rest_framework.decorators import api_view, permission_classes

import re
import unicodedata
from rest_framework.generics import CreateAPIView
from rest_framework.pagination import PageNumberPagination
from .models import SellerRating
from projects.models import Project
from django.db import transaction
from hubspot.tasks import sync_contact_task

logger = logging.getLogger(__name__)

# Import Celery tasks
from .tasks import (
    send_verification_email_task,
    send_welcome_email_task,
    send_password_reset_email_task
)

# Region to departments mapping (duplicate of frontend; backend needs minimal map)
REGION_TO_DEPARTMENTS = {
    'auvergne_rhone_alpes': [
        'ain_01','allier_03','ardeche_07','cantal_15','drome_26','isere_38','loire_42','haute_loire_43','puy_de_dome_63','rhone_69','savoie_73','haute_savoie_74'
    ],
    'bourgogne_franche_comte': [
        "cote_d_or_21","doubs_25","jura_39","nievre_58","haute_saone_70","saone_et_loire_71","yonne_89","territoire_de_belfort_90"
    ],
    'bretagne': ["cotes_d_armor_22","finistere_29","ille_et_vilaine_35","morbihan_56"],
    'centre_val_de_loire': ["cher_18","eure_et_loir_28","indre_36","indre_et_loire_37","loir_et_cher_41","loiret_45"],
    'corse': ["corse_du_sud_2a","haute_corse_2b"],
    'grand_est': ["marne_51","haute_marne_52","meurthe_et_moselle_54","meuse_55","moselle_57","bas_rhin_67","haut_rhin_68","vosges_88"],
    'hauts_de_france': ["aisne_02","nord_59","oise_60","pas_de_calais_62","somme_80"],
    'normandie': ["calvados_14","eure_27","manche_50","orne_61","seine_maritime_76"],
    'nouvelle_aquitaine': ["charente_16","charente_maritime_17","correze_19","creuse_23","dordogne_24","gironde_33","landes_40","lot_et_garonne_47","pyrenees_atlantiques_64","deux_sevres_79","vienne_86","haute_vienne_87"],
    'occitanie': ["ariege_09","aude_11","aveyron_12","gard_30","haute_garonne_31","gers_32","herault_34","lot_46","lozere_48","hautes_pyrenees_65","pyrenees_orientales_66","tarn_81","tarn_et_garonne_82"],
    'pays_de_la_loire': ["loire_atlantique_44","maine_et_loire_49","mayenne_53","sarthe_72","vendee_85"],
    'provence_alpes_cote_d_azur': ["alpes_de_haute_provence_04","hautes_alpes_05","alpes_maritimes_06","bouches_du_rhone_13","var_83","vaucluse_84"],
    'ile_de_france': ["paris_75","seine_et_marne_77","yvelines_78","essonne_91","hauts_de_seine_92","seine_saint_denis_93","val_de_marne_94","val_d_oise_95"],
    'outre_mer': ["guadeloupe_971","martinique_972","guyane_973","la_reunion_974","mayotte_976"],
}


def _get_seller_data(seller):
    """Helper function to standardize seller data response"""
    return {
        'id': seller.user.id,
        'name': seller.user.username,
        'email': seller.user.email,  # Add email for quote requests
        'business_type': seller.type_of_activity,
        'about': seller.user.about,
        'profile_pic': seller.user.profile_pic.url if seller.user.profile_pic else None,
        'selected_service_areas': seller.selected_service_areas,
        'full_address': seller.full_address,
        'company_name': seller.company_name,
        'categories': seller.selected_categories,
        'subcategories': seller.selected_subcategories,
        'average_rating': float(seller.user.average_rating),
        'rating_count': seller.user.rating_count,
    }

User = get_user_model()



# if we do not make this class, we will only get the token, not the user data
class UserTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer


class LogoutView(APIView):
    """Logout view that blacklists the refresh token"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response(
                    {"detail": "Successfully logged out."}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"detail": "Refresh token is required."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {"detail": "Invalid token."}, 
                status=status.HTTP_400_BAD_REQUEST
            )


#following view is being used to register both sellers and professional buyers, name is such because we got the requirement from the client way after the development
class SellerRegisterView(APIView):
    def post(self, request):
        serializer = SellerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Enqueue HubSpot sync after commit
            transaction.on_commit(lambda: sync_contact_task.delay(user.id))
            
            # Generate verification token and URL
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            front_base_url = settings.FRONTEND_URL
            verification_url = f"{front_base_url}email-verification/?uid={uid}&token={token}"
            
            # Determine user type
            role = getattr(user, 'role', 'seller')
            user_type = 'Professional Buyer' if role == 'professional-buyer' else 'Seller'
            
            # Extract language from request headers
            preferred_lang = request.headers.get("X-User-Language") or request.META.get("HTTP_ACCEPT_LANGUAGE", "fr")
            language = preferred_lang.split(",")[0][:2] if preferred_lang else "fr"
            
            # Send verification email asynchronously
            send_verification_email_task.delay(
                user_id=user.id,
                verification_url=verification_url,
                user_type=user_type,
                language=language
            )
            
            return Response(
                {'detail': 'Registration successful. Please check your email to verify your account.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BuyerRegistrationView(APIView):
    def post(self, request):
        serializer = BuyerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Enqueue HubSpot sync after commit
            transaction.on_commit(lambda: sync_contact_task.delay(user.id))
            # Send verification email using the new email service
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            front_base_url = settings.FRONTEND_URL
            verification_url = f"{front_base_url}email-verification/?uid={uid}&token={token}"
            
            # Get user name for email
            user_name = user.get_full_name() or user.username or user.email.split('@')[0]
            
            # Extract language from request headers
            preferred_lang = request.headers.get("X-User-Language") or request.META.get("HTTP_ACCEPT_LANGUAGE", "fr")
            language = preferred_lang.split(",")[0][:2] if preferred_lang else "fr"
            
            # Send verification email asynchronously via Celery
            send_verification_email_task.delay(
                user_id=user.id,
                verification_url=verification_url,
                user_type="buyer",
                language=language
            )
            
            return Response({'detail': 'Registration successful. Please check your email to verify your account.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    def get(self, request):
        uid = request.GET.get('uid')
        token = request.GET.get('token')
        try:
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        if user and default_token_generator.check_token(user, token):
            user.is_active = True
            user.is_email_verified = True
            user.save()
            
            # Sync with HubSpot after email verification
            def _on_transaction_commit():
                logger.info("HubSpot enqueue: email verified for user_id=%s", user.id)
                sync_contact_task.delay(user.id)
            transaction.on_commit(_on_transaction_commit)
            
            # Extract language from request headers
            preferred_lang = request.headers.get("X-User-Language") or request.META.get("HTTP_ACCEPT_LANGUAGE", "fr")
            language = preferred_lang.split(",")[0][:2] if preferred_lang else "fr"
            
            # Send welcome email asynchronously
            send_welcome_email_task.delay(
                user_id=user.id,
                user_type=user.role,
                language=language
            )
            
            return Response(
                {'detail': 'Email verified successfully.'},
                status=status.HTTP_200_OK
            )
        return Response(
            {'detail': 'Invalid or expired token.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def post(self, request):
        """Verify email with token from form input"""
        token = request.data.get('token')
        if not token:
            return Response(
                {'detail': 'Verification token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to find user by token (assuming token contains user info)
        # For now, we'll use a simple approach - in production, you might want to store tokens in database
        try:
            # Parse token to extract user info
            # This is a simplified approach - you might want to implement a more secure token system
            import base64
            import json
            
            # Decode the token (assuming it's base64 encoded JSON with user info)
            try:
                decoded_token = base64.b64decode(token).decode('utf-8')
                token_data = json.loads(decoded_token)
                user_id = token_data.get('user_id')
                token_value = token_data.get('token')
            except:
                # Fallback: try to find user by checking all unverified users
                unverified_users = User.objects.filter(is_email_verified=False, is_active=False)
                user = None
                for u in unverified_users:
                    if default_token_generator.check_token(u, token):
                        user = u
                        break
            else:
                # Use the decoded token data
                try:
                    user = User.objects.get(pk=user_id)
                    if not default_token_generator.check_token(user, token_value):
                        user = None
                except User.DoesNotExist:
                    user = None
            
            if user and not user.is_email_verified:
                user.is_active = True
                user.is_email_verified = True
                user.save()
                
                # Sync with HubSpot after email verification (POST flow)
                def _on_transaction_commit():
                    logger.info("HubSpot enqueue: email verified (POST) for user_id=%s", user.id)
                    sync_contact_task.delay(user.id)
                transaction.on_commit(_on_transaction_commit)
                
                # Extract language from request headers
                preferred_lang = request.headers.get("X-User-Language") or request.META.get("HTTP_ACCEPT_LANGUAGE", "fr")
                language = preferred_lang.split(",")[0][:2] if preferred_lang else "fr"
                
                # Send welcome email asynchronously via Celery
                send_welcome_email_task.delay(
                    user_id=user.id,
                    user_type=user.role,
                    language=language
                )
                
                return Response(
                    {'detail': 'Email verified successfully. Welcome to Safe Bill!'},
                    status=status.HTTP_200_OK
                )
            elif user and user.is_email_verified:
                return Response(
                    {'detail': 'Email is already verified.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'detail': 'Invalid or expired verification token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'detail': 'Invalid verification token format.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ResendVerificationView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'detail': 'Email address is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'No account found with this email address.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if email is already verified
        if user.is_email_verified:
            return Response(
                {'detail': 'Email is already verified.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is already active (shouldn't happen but safety check)
        if user.is_active:
            return Response(
                {'detail': 'Account is already active.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate new verification token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        front_base_url = settings.FRONTEND_URL
        verification_url = f"{front_base_url}email-verification/?uid={uid}&token={token}"
        
        # Extract language from request headers
        preferred_lang = request.headers.get("X-User-Language") or request.META.get("HTTP_ACCEPT_LANGUAGE", "fr")
        language = preferred_lang.split(",")[0][:2] if preferred_lang else "fr"
        
        # Send verification email asynchronously via Celery
        send_verification_email_task.delay(
            user_id=user.id,
            verification_url=verification_url,
            user_type=user.role,
            language=language
        )
        
        return Response(
            {'detail': 'Verification email sent successfully. Please check your inbox.'},
            status=status.HTTP_200_OK
        )



class OnboardingStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'onboarding_complete': request.user.onboarding_complete
        })

    def patch(self, request):
        onboarding_complete = request.data.get('onboarding_complete')
        if onboarding_complete is not None:
            request.user.onboarding_complete = onboarding_complete
            request.user.save()
            
            # Sync with HubSpot after onboarding status update
            def _on_transaction_commit():
                sync_contact_task.delay(request.user.id)
            transaction.on_commit(_on_transaction_commit)
            
            return Response({'onboarding_complete': request.user.onboarding_complete})
        return Response({'detail': 'Missing onboarding_complete field.'}, status=400)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'onboarding_complete': user.onboarding_complete,
            'is_email_verified': user.is_email_verified,
        })


class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {'detail': 'If the email exists, a reset link will be sent.'},
                    status=200
                )
        
            # Generate reset token and URL
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            front_base_url = settings.FRONTEND_URL
            reset_url = f"{front_base_url}password-reset/?uid={uid}&token={token}"
            
            # Extract language from request headers
            preferred_lang = request.headers.get("X-User-Language") or request.META.get("HTTP_ACCEPT_LANGUAGE", "fr")
            language = preferred_lang.split(",")[0][:2] if preferred_lang else "fr"
            
            # Send password reset email asynchronously
            send_password_reset_email_task.delay(
                user_id=user.id,
                reset_url=reset_url,
                language=language
            )
            
            return Response(
                {'detail': 'If the email exists, a reset link will be sent.'},
                status=200
            )
        return Response(serializer.errors, status=400)


class PasswordResetConfirmView(APIView):
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            uid = serializer.validated_data['uid']
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            try:
                uid = force_str(urlsafe_base64_decode(uid))
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({'detail': 'Invalid link.'}, status=400)
            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({'detail': 'Password has been reset.'}, status=200)
            return Response({'detail': 'Invalid or expired token.'}, status=400)
        return Response(serializer.errors, status=400)


class BankAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BankAccountSerializer(data=request.data)
        if serializer.is_valid():
            # If the user already has a bank account, update it
            bank_account, created = BankAccount.objects.update_or_create(
                user=request.user,
                defaults=serializer.validated_data
            )

            return Response(
                {'detail': 'Bank Details saved successfully.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=400)

    def get(self, request):
        try:
            bank_account = request.user.bank_account
            return Response(BankAccountSerializer(bank_account).data)
        except BankAccount.DoesNotExist:
            return Response({'detail': 'No bank account found.'}, status=404)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def filter_sellers_by_service_type(request):
    service_type = request.GET.get('service_type')
    min_rating = request.GET.get('min_rating')
    
    if not service_type:
        return Response(
            {'detail': 'service_type query param is required.'},
            status=400
        )
    
    sellers = BusinessDetail.objects.filter(
        type_of_activity__iexact=service_type,
        user__role='seller'
    )
    
    # Apply rating filter if provided
    if min_rating:
        try:
            min_rating_float = float(min_rating)
            sellers = sellers.filter(user__average_rating__gte=min_rating_float)
        except ValueError:
            return Response(
                {'detail': 'min_rating must be a valid number.'},
                status=400
            )
    
    # Order by rating (highest first), then by name
    sellers = sellers.order_by('-user__average_rating', 'user__username')
    
    data = [_get_seller_data(seller) for seller in sellers]
    return Response(data)


@api_view(['GET'])
def filter_sellers_by_service_area(request):
    service_area = request.GET.get('service_area')
    min_rating = request.GET.get('min_rating')
    
    if not service_area:
        return Response(
            {'detail': 'service_area query param is required.'},
            status=400
        )
    
    sellers = BusinessDetail.objects.filter(
        selected_service_areas__contains=[service_area],
        user__role='seller'
    )
    
    # Apply rating filter if provided
    if min_rating:
        try:
            min_rating_float = float(min_rating)
            sellers = sellers.filter(user__average_rating__gte=min_rating_float)
        except ValueError:
            return Response(
                {'detail': 'min_rating must be a valid number.'},
                status=400
            )
    
    # Order by rating (highest first), then by name
    sellers = sellers.order_by('-user__average_rating', 'user__username')
    
    data = [_get_seller_data(seller) for seller in sellers]
    return Response(data)


@api_view(['GET'])
def filter_sellers_by_type_and_area(request):
    service_type = request.GET.get('service_type')
    service_area = request.GET.get('service_area')
    min_rating = request.GET.get('min_rating')
    
    if not service_type or not service_area:
        return Response(
            {'detail': 'Both service_type and service_area query params are required.'},
            status=400
        )
    
    sellers = BusinessDetail.objects.filter(
        type_of_activity__iexact=service_type,
        selected_service_areas__contains=[service_area],
        user__role='seller'
    )
    
    # Apply rating filter if provided
    if min_rating:
        try:
            min_rating_float = float(min_rating)
            sellers = sellers.filter(user__average_rating__gte=min_rating_float)
        except ValueError:
            return Response(
                {'detail': 'min_rating must be a valid number.'},
                status=400
            )
    
    # Order by rating (highest first), then by name
    sellers = sellers.order_by('-user__average_rating', 'user__username')
    
    data = [_get_seller_data(seller) for seller in sellers]
    return Response(data)

@api_view(['GET'])
def filter_sellers_by_type_area_and_skills(request):
    service_type = request.GET.get('service_type')
    service_area = request.GET.get('service_area')
    min_rating = request.GET.get('min_rating')
    
    if not service_type or not service_area:
        return Response(
            {'detail': 'Both service_type and service_area query params are required.'},
            status=400
        )
    
    # Build the base query
    sellers = BusinessDetail.objects.filter(
        type_of_activity__iexact=service_type,
        selected_service_areas__contains=[service_area],
        user__role='seller'
    )
    
    # Apply rating filter if provided
    if min_rating:
        try:
            min_rating_float = float(min_rating)
            sellers = sellers.filter(user__average_rating__gte=min_rating_float)
        except ValueError:
            return Response(
                {'detail': 'min_rating must be a valid number.'},
                status=400
            )
    
    # Order by rating (highest first), then by name
    sellers = sellers.order_by('-user__average_rating', 'user__username')
    
    data = [_get_seller_data(seller) for seller in sellers]
    return Response(data)


class SellerPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50

@api_view(['GET'])
def list_all_sellers(request):
    """List all sellers with pagination and optional filtering"""
    paginator = SellerPagination()
    min_rating = request.GET.get('min_rating')
    
    # Base queryset
    sellers = BusinessDetail.objects.filter(user__role='seller').select_related('user')

    # Apply rating filter if provided
    if min_rating:
        try:
            min_rating_float = float(min_rating)
            sellers = sellers.filter(user__average_rating__gte=min_rating_float)
        except ValueError:
            return Response(
                {'detail': 'min_rating must be a valid number.'},
                status=400
            )

    # Order by rating (highest first), then by name
    sellers = sellers.order_by('-user__average_rating', 'user__username')
    
    # Apply pagination
    paginated_sellers = paginator.paginate_queryset(sellers, request)
    data = [_get_seller_data(seller) for seller in paginated_sellers]
    
    return paginator.get_paginated_response(data)


@api_view(['GET'])
def get_seller_details(request, seller_id):
    """Get detailed information for a specific seller"""
    try:
        seller = BusinessDetail.objects.get(user__id=seller_id, user__role='seller')
        data = _get_seller_data(seller)
        return Response(data)
    except BusinessDetail.DoesNotExist:
        return Response(
            {'detail': 'Seller not found.'},
            status=404
        )


class SellerRatingCreateView(CreateAPIView):
    serializer_class = SellerRatingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SellerRating.objects.all()


class EligibleProjectsForRating(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, seller_id):
        """Return buyer's projects with this seller that are eligible for rating.
        Eligible statuses: in_progress, completed. Excludes projects already rated.
        """
        buyer = request.user
        # Only buyers can request
        if getattr(buyer, 'role', None) not in ['buyer', 'professional-buyer']:
            return Response({'detail': 'Only buyers can rate.'}, status=403)

        projects = Project.objects.filter(
            user_id=seller_id,
            client=buyer,
            status__in=['in_progress', 'completed']
        ).order_by('-id')

        data = []
        for p in projects:
            already_rated = SellerRating.objects.filter(
                seller_id=seller_id, buyer=buyer, project=p
            ).exists()
            if not already_rated:
                # Get reference number from the related quote
                reference_number = getattr(p.quote, 'reference_number', None) if hasattr(p, 'quote') else None
                data.append({
                    'id': p.id,
                    'name': p.name,
                    'status': p.status,
                    'reference_number': reference_number,
                })

        return Response(data)



def _normalize_label(text: str) -> str:
    if not text:
        return ''
    # Remove accents, lowercase, replace non-alphanum with underscores, collapse repeats
    text = unicodedata.normalize('NFD', text)
    text = ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn')
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text).strip('_')
    return text


@api_view(['GET'])
def filter_sellers_by_location(request):
    """
    Flexible location-based filtering using map selection details.

    Query params (all optional but at least one of city/postal_code/address is recommended):
      - city
      - postal_code
      - address (formatted)
      - lat
      - lng
      - min_rating

    Strategy:
      1) If city and postal_code are provided, build a candidate service-area value
         (e.g., "le_mans_72100") and match against selected_service_areas.
      2) Fallback: Match full_address icontains city or postal_code
    """
    city = (request.GET.get('city') or '').strip()
    postal_code = (request.GET.get('postal_code') or '').strip()
    address = (request.GET.get('address') or '').strip()
    min_rating = request.GET.get('min_rating')

    # Base queryset: sellers only
    qs = BusinessDetail.objects.filter(user__role='seller')

    # Apply rating filter if provided
    if min_rating:
        try:
            min_rating_float = float(min_rating)
            qs = qs.filter(user__average_rating__gte=min_rating_float)
        except ValueError:
            return Response(
                {'detail': 'min_rating must be a valid number.'},
                status=400
            )

    # Attempt 1: service area value derived from city + postal
    matched = None
    if city and postal_code and postal_code.isdigit():
        candidate_value = f"{_normalize_label(city)}_{postal_code}"
        direct = qs.filter(selected_service_areas__contains=[candidate_value])
        if direct.exists():
            matched = direct

    # Attempt 2: by full address icontains city or postal code
    if matched is None and (city or postal_code or address):
        addr_qs = qs
        if city:
            addr_qs = addr_qs.filter(full_address__icontains=city)
        if postal_code:
            addr_qs = addr_qs | qs.filter(full_address__icontains=postal_code)
        if address:
            addr_qs = addr_qs | qs.filter(full_address__icontains=address)
        addr_qs = addr_qs.distinct()
        if addr_qs.exists():
            matched = addr_qs

    sellers = matched if matched is not None else qs.none()
    
    # Order by rating (highest first), then by name
    sellers = sellers.order_by('-user__average_rating', 'user__username')
    
    data = [_get_seller_data(seller) for seller in sellers]
    return Response(data)


@api_view(['GET'])
def filter_sellers_by_region(request):
    region_key = (request.GET.get('region') or '').strip()
    if not region_key:
        return Response({'detail': 'region query param is required.'}, status=400)
    departments = REGION_TO_DEPARTMENTS.get(region_key)
    if not departments:
        return Response({'detail': 'Unknown region key.'}, status=400)
    # Filter sellers that have selected_service_areas containing ANY of the department values
    sellers = BusinessDetail.objects.filter(
        user__role='seller',
        selected_service_areas__overlap=departments
    ).select_related('user').order_by('-user__average_rating', 'user__username')
    data = [_get_seller_data(seller) for seller in sellers]
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_siret_api(request):
    siret = request.data.get('siret')
    if not siret or not siret.isdigit() or len(siret) != 14:
        return Response({'detail': 'SIRET must be exactly 14 digits.'}, status=400)
    
    # Check if SIRET already exists in our database
    from .models import BusinessDetail
    existing_siret = BusinessDetail.objects.filter(siret_number=siret).first()
    if existing_siret:
        return Response({
            'valid': False, 
            'detail': 'SIRET is verified but it is already in use.',
            'already_in_use': True,
            'error_key': 'siret_already_in_use'
        }, status=409)  # 409 Conflict status code
    
    import requests
    from django.conf import settings
    print(settings.SIRET_VALIDATION_ACCESS_TOKEN)
    print(siret)
    url = (
        f'https://api.insee.fr/api-sirene/3.11/siret/{siret}'
    )
    headers = {
        'Accept': 'application/json',
        'X-INSEE-Api-Key-Integration': settings.SIRET_VALIDATION_ACCESS_TOKEN,
    }
    resp = requests.get(url, headers=headers)

    print(resp.status_code)
    print(resp.text)
    if resp.status_code == 200:
        data = resp.json()
        etab = data.get('etablissement', {})
        unite_legale = etab.get('uniteLegale', {})
        adresse = etab.get('adresseEtablissement', {})
        address = (
            f"{adresse.get('numeroVoieEtablissement', '')} "
            f"{adresse.get('typeVoieEtablissement', '')} "
            f"{adresse.get('libelleVoieEtablissement', '')}, "
            f"{adresse.get('codePostalEtablissement', '')} "
            f"{adresse.get('libelleCommuneEtablissement', '')}"
        ).strip()
        
        # Parse address components
        postal_code = adresse.get('codePostalEtablissement', '')
        region = adresse.get('libelleCommuneEtablissement', '')
        
        # Build street address (number + type + street name)
        street_address = (
            f"{adresse.get('numeroVoieEtablissement', '')} "
            f"{adresse.get('typeVoieEtablissement', '')} "
            f"{adresse.get('libelleVoieEtablissement', '')}"
        ).strip()
        
        return Response({
            'valid': True,
            'company_name': unite_legale.get('denominationUniteLegale') or unite_legale.get('nomUniteLegale'),
            'address': address,
            'street_address': street_address,
            'postal_code': postal_code,
            'region': region,
            'raw': data
        })
    else:
        return Response(
            {'valid': False, 'detail': 'SIRET not found or invalid.'}, 
            status=404
        )

