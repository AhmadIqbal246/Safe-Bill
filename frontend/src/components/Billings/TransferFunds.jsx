import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { ExternalLink, ArrowRight, CheckCircle } from 'lucide-react';
import {
  fetchTransferInfo,
  createTransfer,
  generateStripeLoginLink,
  selectTransferInfo,
  selectTransferInfoLoading,
  selectTransferInfoError,
  selectTransferLoading,
  selectTransferError,
  selectLastTransfer,
  selectCanTransfer,
  selectHasStripeAccount,
  selectStripeLoginLink,
  selectStripeLoginLinkLoading,
  selectStripeLoginLinkError,
  clearTransferError,
  clearTransferInfoError,
  clearStripeLoginLinkError,
} from '../../store/slices/FundsTransferSlice';

export default function TransferFunds({ balance, onTransferComplete }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  // Redux selectors
  const transferInfo = useSelector(selectTransferInfo);
  const loading = useSelector(selectTransferInfoLoading);
  const transferInfoError = useSelector(selectTransferInfoError);
  const transferring = useSelector(selectTransferLoading);
  const transferError = useSelector(selectTransferError);
  const lastTransfer = useSelector(selectLastTransfer);
  const canTransferFromStore = useSelector(selectCanTransfer);
  const hasStripeAccount = useSelector(selectHasStripeAccount);
  const stripeLoginLink = useSelector(selectStripeLoginLink);
  const stripeLoginLinkLoading = useSelector(selectStripeLoginLinkLoading);
  const stripeLoginLinkError = useSelector(selectStripeLoginLinkError);
  
  // Local state
  const [transferAmount, setTransferAmount] = useState('');

  // Fetch transfer info on component mount
  useEffect(() => {
    if (user && user.role === 'seller') {
      dispatch(fetchTransferInfo());
    }
  }, [user, dispatch]);

  // Handle transfer info error
  useEffect(() => {
    if (transferInfoError) {
      toast.error(transferInfoError);
      dispatch(clearTransferInfoError());
    }
  }, [transferInfoError, dispatch]);

  // Handle transfer error
  useEffect(() => {
    if (transferError) {
      toast.error(transferError);
      dispatch(clearTransferError());
    }
  }, [transferError, dispatch]);

  // Handle successful transfer
  useEffect(() => {
    if (lastTransfer && lastTransfer.success) {
      toast.success(
        `Successfully transferred ${formatCurrency(lastTransfer.amount, lastTransfer.currency)} to your Stripe account!`
      );
      
      // Clear the transfer amount input
      setTransferAmount('');
      
      // Refresh transfer info and balance
      dispatch(fetchTransferInfo());
      
      // Refetch all data in parent component
      if (onTransferComplete) {
        onTransferComplete();
      }
    }
  }, [lastTransfer, dispatch]);

  // Handle Stripe login link error
  useEffect(() => {
    if (stripeLoginLinkError) {
      toast.error(stripeLoginLinkError);
      dispatch(clearStripeLoginLinkError());
    }
  }, [stripeLoginLinkError, dispatch]);

  // Handle successful Stripe login link generation
  useEffect(() => {
    if (stripeLoginLink && stripeLoginLink.success && stripeLoginLink.login_url) {
      // Open the Stripe Dashboard in a new tab
      window.open(stripeLoginLink.login_url, '_blank', 'noopener,noreferrer');
      
      // Clear the login link from state after use
      // The link expires in 5 minutes anyway
    }
  }, [stripeLoginLink]);

  const handleTransfer = () => {
    // Validate transfer amount
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid transfer amount');
      return;
    }

    if (amount > availableBalance) {
      toast.error('Transfer amount cannot exceed available balance');
      return;
    }

    // Dispatch the transfer action
    dispatch(createTransfer({ amount, currency: 'EUR' }));
    fetchTransferInfo();
  };

  const handleStripeLogin = () => {
    // Generate and open Stripe Dashboard login link
    dispatch(generateStripeLoginLink());
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Only show for sellers
  if (!user || user.role !== 'seller') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg">
            <span className="text-2xl font-bold text-primary-600">€</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('billings.transfer_funds')}</h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const availableBalance = balance?.available_for_payout || 0;
  const transferAmountValue = parseFloat(transferAmount) || 0;
  const canTransfer = canTransferFromStore && availableBalance > 0 && transferAmountValue > 0 && transferAmountValue <= availableBalance;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <span className="text-2xl font-bold text-primary-600">€</span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{t('billings.transfer_funds')}</h3>
          <p className="text-sm text-gray-500">
            {t('billings.transfer_to_stripe_account')}
          </p>
        </div>
      </div>

      {/* Available Balance */}
      <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-success-700 font-medium mb-2">{t('billings.available_for_transfer')}</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-success-900">
                {formatCurrency(availableBalance, balance?.currency)}
              </span>
            </div>
          </div>
          {hasStripeAccount && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-success-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{t('billings.stripe_connected')}</span>
              </div>
              <p className="text-xs text-success-600">
                {transferInfo.stripe_account_id}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Action */}
      <div className="space-y-4">
        {!hasStripeAccount ? (
          <div className="text-center py-8">
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
              <p className="text-warning-800 font-medium">
                {t('billings.stripe_account_required')}
              </p>
              <p className="text-warning-700 text-sm mt-1">
                {t('billings.connect_stripe_first')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Transfer Amount Input */}
            <div className="space-y-2">
              <label htmlFor="transferAmount" className="block text-sm font-medium text-gray-700">
                {t('billings.transfer_amount')} (EUR)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">€</span>
                </div>
                <input
                  type="number"
                  id="transferAmount"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  max={availableBalance}
                  step="0.01"
                  className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-lg"
                />
                <button
                  type="button"
                  onClick={() => setTransferAmount(availableBalance.toString())}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('billings.max')}
                </button>
              </div>
              {transferAmountValue > availableBalance && (
                <p className="text-sm text-red-600">
                  {t('billings.amount_exceeds_balance')}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {t('billings.available')}: {formatCurrency(availableBalance, balance?.currency)}
              </p>
            </div>

            {/* Transfer Button */}
            <button
              onClick={handleTransfer}
              disabled={!canTransfer || transferring}
              className="flex-1 bg-primary-600 text-white px-6 py-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center gap-3">
                {transferring ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="font-medium">{t('common.processing')}</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    <span className="font-medium">
                      {transferAmountValue > 0 
                        ? `${t('billings.transfer_to_stripe')} (${formatCurrency(transferAmountValue, 'EUR')})`
                        : t('billings.transfer_to_stripe')
                      }
                    </span>
                  </>
                )}
              </div>
            </button>

            {/* Stripe Dashboard Link */}
            <button
              onClick={handleStripeLogin}
              disabled={stripeLoginLinkLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stripeLoginLinkLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="font-medium">{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span className="font-medium">{t('billings.manage_payouts_stripe')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Information */}
      <div className="mt-6 p-4 bg-info-50 border border-info-200 rounded-lg">
        <h5 className="font-medium text-info-800 mb-2">{t('billings.how_it_works')}</h5>
        <ul className="text-sm text-info-700 space-y-1">
          <li>• {t('billings.transfer_info_1')}</li>
          <li>• {t('billings.transfer_info_2')}</li>
          <li>• {t('billings.transfer_info_3')}</li>
          <li>• {t('billings.transfer_info_4')}</li>
        </ul>
      </div>
    </div>
  );
}
