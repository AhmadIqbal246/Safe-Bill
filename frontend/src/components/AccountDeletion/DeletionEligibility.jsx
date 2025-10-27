import React from 'react';
import { useTranslation } from 'react-i18next';

const DeletionEligibility = ({ eligibility }) => {
  const { t } = useTranslation();
  
  if (!eligibility || eligibility.can_delete) {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 md:p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <div className="ml-3 md:ml-4 flex-1">
          <h3 className="text-base md:text-lg font-semibold text-red-800 mb-2">{t('account_deletion.not_eligible_title')}</h3>
          <p className="text-xs md:text-sm text-red-700 mb-4">{eligibility.message}</p>
          
          <div className="space-y-2 md:space-y-3">
            {eligibility.active_projects > 0 && (
              <div className="flex items-center justify-between bg-red-100 rounded-lg p-2 md:p-3">
                <div className="flex items-center">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 mr-2 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs md:text-sm text-red-800 font-medium">{t('account_deletion.active_projects')}</span>
                </div>
                <span className="bg-red-200 text-red-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                  {eligibility.active_projects}
                </span>
              </div>
            )}
            
            {eligibility.pending_payments > 0 && (
              <div className="flex items-center justify-between bg-red-100 rounded-lg p-2 md:p-3">
                <div className="flex items-center">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 mr-2 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-xs md:text-sm text-red-800 font-medium">{t('account_deletion.pending_payments')}</span>
                </div>
                <span className="bg-red-200 text-red-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                  {eligibility.pending_payments}
                </span>
              </div>
            )}
            
            {eligibility.active_disputes > 0 && (
              <div className="flex items-center justify-between bg-red-100 rounded-lg p-2 md:p-3">
                <div className="flex items-center">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 mr-2 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs md:text-sm text-red-800 font-medium">{t('account_deletion.active_disputes')}</span>
                </div>
                <span className="bg-red-200 text-red-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                  {eligibility.active_disputes}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 md:p-4 bg-red-100 rounded-lg">
            <h4 className="text-red-800 font-semibold mb-2 text-xs md:text-sm">❌ {t('account_deletion.not_eligible_title')}</h4>
            <p className="text-red-700 text-xs md:text-sm mb-3">{t('account_deletion.not_eligible_message')}</p>
            
            <div className="space-y-2">
              {eligibility.active_projects > 0 && (
                <div className="flex items-center justify-between bg-red-200 rounded-lg p-2">
                  <span className="text-xs md:text-sm text-red-800">{t('account_deletion.active_projects')}</span>
                  <span className="bg-red-300 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    {eligibility.active_projects}
                  </span>
                </div>
              )}
              {eligibility.pending_payments > 0 && (
                <div className="flex items-center justify-between bg-red-200 rounded-lg p-2">
                  <span className="text-xs md:text-sm text-red-800">{t('account_deletion.pending_payments')}</span>
                  <span className="bg-red-300 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    {eligibility.pending_payments}
                  </span>
                </div>
              )}
              {eligibility.active_disputes > 0 && (
                <div className="flex items-center justify-between bg-red-200 rounded-lg p-2">
                  <span className="text-xs md:text-sm text-red-800">{t('account_deletion.active_disputes')}</span>
                  <span className="bg-red-300 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    {eligibility.active_disputes}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-3 md:mt-4 p-2 md:p-3 bg-red-200 rounded-lg">
              <h5 className="text-red-800 font-semibold mb-2 text-xs md:text-sm">{t('account_deletion.to_delete_need_to')}</h5>
              <ul className="text-red-700 text-xs md:text-sm space-y-1">
                {eligibility.active_projects > 0 && (
                  <li>• {t('account_deletion.complete_projects')}</li>
                )}
                {eligibility.pending_payments > 0 && (
                  <li>• {t('account_deletion.wait_payments')}</li>
                )}
                {eligibility.active_disputes > 0 && (
                  <li>• {t('account_deletion.resolve_disputes')}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletionEligibility;