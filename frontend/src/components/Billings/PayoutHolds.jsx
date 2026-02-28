import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Clock } from 'lucide-react';

export default function PayoutHolds({ holds, loading, error }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-secondary-100 rounded-lg">
            <Lock className="w-6 h-6 text-secondary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('billings.payout_holds')}</h3>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-16 rounded-xl border border-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('billings.payout_holds')}</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-red-500 font-medium">{t('common.error_loading_data')}</div>
        </div>
      </div>
    );
  }

  const unreleased = (holds || []).filter(h => !h.released);

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary-100 rounded-lg">
            <Lock className="w-6 h-6 text-secondary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('billings.payout_holds')}</h3>
        </div>
      </div>

      {/* Unreleased holds */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('billings.on_hold')}</h4>
        {unreleased.length === 0 ? (
          <div className="text-sm text-gray-500">{t('billings.no_holds')}</div>
        ) : (
          <div className="space-y-3">
            {unreleased.map((h) => (
              <div key={h.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {parseFloat(h.amount).toLocaleString()} {h.currency}
                  </div>
                  <div className="text-sm text-gray-600">
                    {h.project?.name || t('billings.unknown_project')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4" />
                    <span>{t('billings.release_in')} {h.days_until_release} {t('billings.days')}</span>
                  </div>
                  <div className="text-xs text-gray-500">{formatDateTime(h.hold_until)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}


