from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.urls import reverse
from .serializers import (
    RegistrationSerializer, UserTokenObtainPairSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer, BankAccountSerializer
)
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions
from rest_framework_simplejwt.tokens import RefreshToken
from .models import BankAccount

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
            frontend_url = f"{front_base_url}/email-verification/?uid={uid}&token={token}"
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
            return Response(BankAccountSerializer(bank_account).data)
        return Response(serializer.errors, status=400)

    def get(self, request):
        try:
            bank_account = request.user.bank_account
            return Response(BankAccountSerializer(bank_account).data)
        except BankAccount.DoesNotExist:
            return Response({'detail': 'No bank account found.'}, status=404)

