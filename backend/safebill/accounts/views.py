from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.urls import reverse
from .serializers import (
    RegistrationSerializer, UserTokenObtainPairSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer, BankAccountSerializer,
    UserProfileSerializer, verify_siret_number
)
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import BankAccount, BusinessDetail
from rest_framework.decorators import api_view, permission_classes

User = get_user_model()



# if we do not make this class, we will only get the token, not the user data
class UserTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer



class RegisterView(APIView):
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Send verification email
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            front_base_url = settings.FRONTEND_URL
            # verification_url = request.build_absolute_uri(
            #     reverse('accounts:verify-email') + f'?uid={uid}&token={token}'
            # )
            frontend_url = f"{front_base_url}email-verification/?uid={uid}&token={token}"
            send_mail(
                subject='Verify your email',
                message=(
                    f'Click the link to verify your email: {frontend_url}'
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
            )
            return Response(
                {'detail': 'Registration successful. Please check your email to verify your account.'},
                status=status.HTTP_201_CREATED
            )
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
            return Response(
                {'detail': 'Email verified successfully.'},
                status=status.HTTP_200_OK
            )
        return Response(
            {'detail': 'Invalid or expired token.'},
            status=status.HTTP_400_BAD_REQUEST
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
            uid = user.id
            print(uid)
            reset_url = request.build_absolute_uri(
                reverse('accounts:password-reset-confirm') +
                f'?uid={uid}&token={token}'
            )
            send_mail(
                subject='Password Reset',
                message=(
                    f'Click the link to reset your password: {reset_url}'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
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
    data = [
        {
            'name': s.user.username,
            'business_type': s.type_of_activity
        }
        for s in sellers
    ]
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
        service_area__iexact=service_area,
        user__role='seller'
    )
    data = [
        {
            'name': s.user.username,
            'business_type': s.type_of_activity
        }
        for s in sellers
    ]
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
        service_area__iexact=service_area,
        user__role='seller'
    )
    data = [
        {
            'name': s.user.username,
            'business_type': s.type_of_activity
        }
        for s in sellers
    ]
    return Response(data)


@api_view(['GET'])
def list_all_sellers(request):
    sellers = BusinessDetail.objects.filter(user__role='seller')
    data = [
        {
            'name': s.user.username,
            'business_type': s.type_of_activity
        }
        for s in sellers
    ]
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
        return Response({
            'valid': True,
            'company_name': unite_legale.get('denominationUniteLegale') or unite_legale.get('nomUniteLegale'),
            'address': address,
            'raw': data
        })
    else:
        return Response({'valid': False, 'detail': 'SIRET not found or invalid.'}, status=404)

