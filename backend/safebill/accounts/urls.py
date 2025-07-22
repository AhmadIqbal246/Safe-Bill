from django.urls import path
from .views import (
    RegisterView,
    VerifyEmailView,
    UserTokenObtainPairView,
    OnboardingStatusView,
    ProfileView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    BankAccountView,
    filter_sellers_by_service_type,
    filter_sellers_by_service_area,
    filter_sellers_by_type_and_area,
    list_all_sellers
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
    path(
        'filter-sellers-by-service-type/',
        filter_sellers_by_service_type,
        name='filter-sellers-by-service-type'
    ),
    path(
        'filter-sellers-by-service-area/',
        filter_sellers_by_service_area,
        name='filter-sellers-by-service-area'
    ),
    path(
        'filter-sellers-by-type-and-area/',
        filter_sellers_by_type_and_area,
        name='filter-sellers-by-type-and-area'
    ),
    path(
        'all-sellers/',
        list_all_sellers,
        name='all-sellers'
    ),
] 