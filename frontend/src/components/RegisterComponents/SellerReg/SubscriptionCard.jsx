import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubscriptionEligibility,
  createSubscriptionSession,
  fetchSubscriptionStatus,
} from "../../../store/slices/SubscriptionSlice";

export default function SubscriptionCard() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const eligibility = useSelector((s) => s.subscription.eligibility);
  const eligibilityLoading = useSelector((s) => s.subscription.eligibilityLoading);
  const checkoutLoading = useSelector((s) => s.subscription.checkoutLoading);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    if (!eligibility && !eligibilityLoading) {
      dispatch(fetchSubscriptionEligibility());
    }
  }, [dispatch, eligibility, eligibilityLoading]);

  const handleSubscribe = () => {
    const base = window.location.origin;
    // Redirect back to current page after successful subscription
    const currentPath = window.location.pathname;
    const successUrl = `${base}${currentPath}?subscription_success=true`;
    const cancelUrl = `${base}${currentPath}`;
    dispatch(createSubscriptionSession({ successUrl, cancelUrl })).then((r) => {
      const url = r?.payload?.checkout_url;
      if (url) window.location.href = url;
    });
  };

  if (eligibilityLoading) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 rounded-xl bg-white shadow">
        <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  // Get subscription status from eligibility or user object
  const needs = eligibility?.needs_subscription ?? (user?.membership_active === false && (eligibility?.needs_subscription ?? true));
  const active = eligibility?.membership_active ?? user?.membership_active ?? false;
  const status = eligibility?.status ?? user?.subscription_status ?? "";
  const periodEnd = eligibility?.current_period_end ?? user?.subscription_current_period_end;

  // If not needed and already active, do not show the card
  if (active || needs === false) return null;

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-[#01257D] to-[#0F91D2] text-white">
          <h2 className="text-lg sm:text-xl font-semibold">{t('subscription_card.title')}</h2>
          <p className="text-xs sm:text-sm opacity-90 mt-1">{t('subscription_card.subtitle')}</p>
        </div>
        <div className="p-4 sm:p-6 bg-[#F6FAFD]">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#01257D]/10 flex items-center justify-center border-2 border-[#01257D]/20">
              <span className="text-[#01257D] text-base sm:text-lg font-bold">€3</span>
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('subscription_card.plan_title')}</h3>
              <ul className="mt-1 text-xs sm:text-sm text-gray-700 space-y-1.5">
                <li className="flex items-start">
                  <span className="mr-2 text-[#01257D]">✓</span>
                  <span>{t('subscription_card.feature_create_more')}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-[#01257D]">✓</span>
                  <span>{t('subscription_card.feature_auto_renews')}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-[#01257D]">✓</span>
                  <span>{t('subscription_card.feature_realtime')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-600 flex-1">
                {active === false && needs && (
                  <span className="font-medium">{t('subscription_card.membership_required')}</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-md bg-[#01257D] hover:bg-[#2346a0] text-white font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01257D] disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {checkoutLoading ? "Redirecting…" : t('subscription_card.cta')}
              </button>
            </div>

            <div className="mt-3 sm:mt-4">
              <p className="text-xs text-gray-500">
                {t('subscription_card.secure_payment')}
              </p>
            </div>
          </div>

          {/* Display subscription status if available */}
          {(status || periodEnd) && (
            <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="text-xs text-gray-600 space-y-1">
                {status && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">{t('subscription_card.status')}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                    </span>
                  </p>
                )}
                {periodEnd && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">{t('subscription_card.current_period_ends')}</span>
                    <span>{new Date(periodEnd).toLocaleDateString()}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


