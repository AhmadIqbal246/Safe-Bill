import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchBillings, fetchBalance } from '../store/slices/PaymentSlice';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import BalanceSummary from '../components/Billings/BalanceSummary';
import BillingsList from '../components/Billings/BillingsList';
import TransferFunds from '../components/Billings/TransferFunds';
import Loader from '../components/common/Loader';
import MainLayout from '../components/Layout/MainLayout';

export default function Billings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { 
    billings, 
    billingsLoading, 
    billingsError,
    balance, 
    balanceLoading, 
    balanceError 
  } = useSelector(state => state.payment);
  
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // Fetch both billings and balance data
    dispatch(fetchBillings());
    dispatch(fetchBalance());
  }, [dispatch]);

  const isLoading = billingsLoading || balanceLoading;
  const hasError = billingsError || balanceError;

  if (isLoading && !billings.length && !balance) {
    return (
      
        <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader size="large" text={t('billings.loading')} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('billings.title')}
          </h1>
          <p className="text-gray-600">
            {t('billings.subtitle')}
          </p>
        </div>

        {/* Error Display */}
        {hasError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {t('common.error')}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {billingsError || balanceError}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Summary */}
        <div className="mb-8">
          <BalanceSummary 
            balance={balance}
            loading={balanceLoading}
            error={balanceError}
          />
        </div>

        {/* Transfer Funds - Only for Sellers */}
        {user?.role === 'seller' && (
          <div className="mb-8">
            <TransferFunds balance={balance} />
          </div>
        )}

        {/* Billings List */}
        <div>
          <BillingsList 
            billings={billings}
            loading={billingsLoading}
            error={billingsError}
          />
        </div>
      </div>
    </MainLayout>
  );
}
