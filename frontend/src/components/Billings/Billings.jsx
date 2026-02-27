import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchBillings, fetchBalance, fetchPayoutHolds, fetchTransfers, fetchRefundedPayments } from '../../store/slices/PaymentSlice';
import BalanceSummary from './BalanceSummary';
import BillingsList from './BillingsList';
import TransferFunds from './TransferFunds';
import Loader from '../common/Loader';
import PayoutHolds from './PayoutHolds';
import TransfersList from './TransfersList';
import RefundsList from './RefundsList';

export default function Billings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { 
    billings, 
    billingsLoading, 
    billingsError,
    balance, 
    balanceLoading, 
    balanceError,
    payoutHolds,
    payoutHoldsLoading,
    payoutHoldsError,
    transfers,
    transfersLoading,
    transfersError,
    refunded,
    refundedLoading,
    refundedError,
  } = useSelector(state => state.payment);
  
  const { user } = useSelector(state => state.auth);

  // Function to refetch all data
  const refetchAllData = React.useCallback(() => {
    dispatch(fetchBillings());
    dispatch(fetchBalance());
    if (user?.role === 'seller') {
      dispatch(fetchPayoutHolds());
      dispatch(fetchTransfers());
    }
    if (user?.role === 'buyer') {
      dispatch(fetchRefundedPayments());
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Fetch both billings and balance data
    refetchAllData();
  }, [refetchAllData]);

  const isLoading = billingsLoading || balanceLoading || payoutHoldsLoading || transfersLoading || refundedLoading;
  const hasError = billingsError || balanceError || payoutHoldsError || transfersError || refundedError;

  if (isLoading && !billings.length && !balance) {
    return (
      
        <>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader size="large" text={t('billings.loading')} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2E78A6] mb-2">
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
                  {billingsError || balanceError || transfersError}
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
            <TransferFunds balance={balance} onTransferComplete={refetchAllData} />
          </div>
        )}

        {/* Payout Holds - Only for Sellers */}
        {user?.role === 'seller' && (
          <div className="mb-8">
            <PayoutHolds holds={payoutHolds} loading={payoutHoldsLoading} error={payoutHoldsError} />
          </div>
        )}

        {/* Transfer History - Only for Sellers */}
        {user?.role === 'seller' && (
          <div className="mb-8">
            <TransfersList 
              transfers={transfers}
              loading={transfersLoading}
              error={transfersError}
            />
          </div>
        )}

        {/* Refunded Payments - Only for Buyers */}
        {user?.role === 'buyer' && (
          <div className="mb-8">
            <RefundsList refunds={refunded} loading={refundedLoading} error={refundedError} />
          </div>
        )}

        {/* Billings List */}
        {user?.role !== 'seller' && <div>
          <BillingsList 
            billings={billings}
            loading={billingsLoading}
            error={billingsError}
          />
        </div>}
      </div>
    </>
  );
}
