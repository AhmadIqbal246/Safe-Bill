from rest_framework import status
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
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import BankAccount, BusinessDetail
from rest_framework.decorators import api_view, permission_classes
from utils.email_service import EmailService
import re
import unicodedata
from rest_framework.generics import CreateAPIView
from rest_framework.pagination import PageNumberPagination
from django.db import models
from .models import SellerRating
from projects.models import Project


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


#following view is being used to register both sellers and professional buyers, name is such because we got the requirement from the client way after the development
class SellerRegisterView(APIView):
    def post(self, request):
        serializer = SellerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Send verification email using the new email service
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            front_base_url = settings.FRONTEND_URL
            verification_url = f"{front_base_url}email-verification/?uid={uid}&token={token}"
            
            # Get user name for email
            user_name = user.get_full_name() or user.username or \
                user.email.split('@')[0]

            # Determine user_type based on user's role
            role = getattr(user, 'role', 'seller')
            user_type = 'Professional Buyer' if role == 'professional-buyer' \
                else 'Seller'
            
            # Send verification email
            EmailService.send_verification_email(
                user_email=user.email,
                user_name=user_name,
                verification_url=verification_url,
                user_type=user_type,
                verification_code=token
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
            # Send verification email using the new email service
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            front_base_url = settings.FRONTEND_URL
            verification_url = f"{front_base_url}email-verification/?uid={uid}&token={token}"
            
            # Get user name for email
            user_name = user.get_full_name() or user.username or user.email.split('@')[0]
            
            # Send verification email
            EmailService.send_verification_email(
                user_email=user.email,
                user_name=user_name,
                verification_url=verification_url,
                user_type="buyer",
                verification_code=token
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
            
            # Send welcome email after successful verification
            user_name = user.get_full_name() or user.username or user.email.split('@')[0]
            EmailService.send_welcome_email(
                user_email=user.email,
                user_name=user_name,
                user_type=user.role
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
                
                # Send welcome email after successful verification
                user_name = user.get_full_name() or user.username or user.email.split('@')[0]
                EmailService.send_welcome_email(
                    user_email=user.email,
                    user_name=user_name,
                    user_type=user.role
                )
                
                return Response(
                    {'detail': 'Email verified successfully. Welcome to SafeBill!'},
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
        
        # Get user name for email
        user_name = user.get_full_name() or user.username or user.email.split('@')[0]
        
        # Send verification email
        EmailService.send_verification_email(
            user_email=user.email,
            user_name=user_name,
            verification_url=verification_url,
            user_type=user.role,
            verification_code=token
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
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            front_base_url = settings.FRONTEND_URL
            reset_url = f"{front_base_url}password-reset/?uid={uid}&token={token}"
            
            # Get user name for email
            user_name = user.get_full_name() or user.username or user.email.split('@')[0]
            
            # Send password reset email using the new email service
            EmailService.send_password_reset_email(
                user_email=user.email,
                user_name=user_name,
                reset_url=reset_url,
                reset_code=token
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
    if not service_type:
        return Response(
            {'detail': 'service_type query param is required.'},
            status=400
        )
    sellers = BusinessDetail.objects.filter(
        type_of_activity__iexact=service_type,
        user__role='seller'
    )
    data = [_get_seller_data(seller) for seller in sellers]
    return Response(data)


@api_view(['GET'])
def filter_sellers_by_service_area(request):
    service_area = request.GET.get('service_area')
    if not service_area:
        return Response(
            {'detail': 'service_area query param is required.'},
            status=400
        )
    sellers = BusinessDetail.objects.filter(
        selected_service_areas__contains=[service_area],
        user__role='seller'
    )
    data = [_get_seller_data(seller) for seller in sellers]
    return Response(data)


@api_view(['GET'])
def filter_sellers_by_type_and_area(request):
    service_type = request.GET.get('service_type')
    service_area = request.GET.get('service_area')
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
    data = [_get_seller_data(seller) for seller in sellers]
    return Response(data)

@api_view(['GET'])
def filter_sellers_by_type_area_and_skills(request):
    service_type = request.GET.get('service_type')
    service_area = request.GET.get('service_area')
    
    if not service_type or not service_area:
        return Response(
            {'detail': 'Both service_type and service_area query params are required.'},
            status=400
        )
    
    # Build the base query
    query = BusinessDetail.objects.filter(
        type_of_activity__iexact=service_type,
        selected_service_areas__contains=[service_area],
        user__role='seller'
    )
    
    sellers = query
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
    
    # Base queryset
    sellers = BusinessDetail.objects.filter(user__role='seller').select_related('user')

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

    Strategy:
      1) If city and postal_code are provided, build a candidate service-area value
         (e.g., "le_mans_72100") and match against selected_service_areas.
      2) Fallback: Match full_address icontains city or postal_code
    """
    city = (request.GET.get('city') or '').strip()
    postal_code = (request.GET.get('postal_code') or '').strip()
    address = (request.GET.get('address') or '').strip()

    # Base queryset: sellers only
    qs = BusinessDetail.objects.filter(user__role='seller')

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
    data = [_get_seller_data(seller) for seller in sellers]
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_siret_api(request):
    siret = request.data.get('siret')
    if not siret or not siret.isdigit() or len(siret) != 14:
        return Response({'detail': 'SIRET must be exactly 14 digits.'}, status=400)
    
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

