from django.urls import path
from .views import (
    RegisterView, VerifyEmailView, UserTokenObtainPairView,
    OnboardingStatusView, ProfileView, PasswordResetRequestView, PasswordResetConfirmView, BankAccountView
)
from rest_framework_simplejwt.views import TokenRefreshView

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', UserTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('onboarding-status/', OnboardingStatusView.as_view(), name='onboarding-status'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('bank-account/', BankAccountView.as_view(), name='bank-account'),
] 