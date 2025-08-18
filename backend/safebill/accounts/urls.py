from django.urls import path
from .views import (
    SellerRegisterView,
    VerifyEmailView,
    UserTokenObtainPairView,
    OnboardingStatusView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    BankAccountView,
    filter_sellers_by_service_type,
    filter_sellers_by_service_area,
    filter_sellers_by_type_and_area,
    filter_sellers_by_skills,
    filter_sellers_by_type_area_and_skills,
    list_all_sellers,
    UserProfileView,
    verify_siret_api,
    BuyerRegistrationView,
    filter_sellers_by_location
)
from rest_framework_simplejwt.views import TokenRefreshView

app_name = 'accounts'

urlpatterns = [
    path('seller-register/', SellerRegisterView.as_view(), name='seller-register'),
    path('buyer-register/', BuyerRegistrationView.as_view(), name='buyer-register'),
    path('login/', UserTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('onboarding-status/', OnboardingStatusView.as_view(), name='onboarding-status'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), 
         name='password-reset-request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), 
         name='password-reset-confirm'),
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
        'filter-sellers-by-skills/',
        filter_sellers_by_skills,
        name='filter-sellers-by-skills'
    ),
    path(
        'filter-sellers-by-type-area-and-skills/',
        filter_sellers_by_type_area_and_skills,
        name='filter-sellers-by-type-area-and-skills'
    ),
    path(
        'all-sellers/',
        list_all_sellers,
        name='all-sellers'
    ),
    path(
        'filter-sellers-by-location/',
        filter_sellers_by_location,
        name='filter-sellers-by-location'
    ),
    path('verify-siret/', verify_siret_api, name='verify-siret'),
] 