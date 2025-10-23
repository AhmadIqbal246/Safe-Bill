from django.urls import path
from .views import (
    SellerRegisterView,
    VerifyEmailView,
    ResendVerificationView,
    UserTokenObtainPairView,
    LogoutView,
    OnboardingStatusView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    BankAccountView,
    filter_sellers_by_service_type,
    filter_sellers_by_service_area,
    filter_sellers_by_type_and_area,
    filter_sellers_by_type_area_and_skills,
    list_all_sellers,
    UserProfileView,
    verify_siret_api,
    BuyerRegistrationView,
    filter_sellers_by_location,
    get_seller_details,
    SellerRatingCreateView,
    EligibleProjectsForRating,
    filter_sellers_by_region,
    RoleSwitchView,
    deletion_eligibility,
    delete_account,
)
from rest_framework_simplejwt.views import TokenRefreshView

app_name = 'accounts'

urlpatterns = [
    path('seller-register/', SellerRegisterView.as_view(), name='seller-register'),
    path('buyer-register/', BuyerRegistrationView.as_view(), name='buyer-register'),
    # Use standard token obtain view (no role selection at login)
    path('login/', UserTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
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
    path(
        'filter-sellers-by-region/',
        filter_sellers_by_region,
        name='filter-sellers-by-region'
    ),
    path(
        'seller/<int:seller_id>/',
        get_seller_details,
        name='get-seller-details'
    ),
    path('rate-seller/', SellerRatingCreateView.as_view(), name='rate-seller'),
    path('eligible-projects/<int:seller_id>/', EligibleProjectsForRating.as_view(), name='eligible-projects'),
    path('verify-siret/', verify_siret_api, name='verify-siret'),
    # Added: switch active role (seller <-> professional-buyer) for current session/user
    path('role/switch/', RoleSwitchView.as_view(), name='role-switch'),
    # User Account Deletion endpoints
    path('deletion-eligibility/', deletion_eligibility, name='deletion-eligibility'),
    path('delete-account/', delete_account, name='delete-account'),
] 