import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ArrowUpRight, CheckCircle, XCircle, Clock, ExternalLink, TrendingUp, DollarSign } from 'lucide-react';

export default function TransfersList({ transfers, loading, error }) {
  const { t } = useTranslation();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-success-600 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-danger-600" />;
      case 'in_transit':
        return <Clock className="w-5 h-5 text-warning-600 animate-spin" />;
      case 'canceled':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-success-100 text-success-800 border border-success-300 shadow-sm';
      case 'failed':
        return 'bg-danger-100 text-danger-800 border border-danger-300 shadow-sm';
      case 'in_transit':
        return 'bg-warning-100 text-warning-800 border border-warning-300 shadow-sm';
      case 'canceled':
        return 'bg-gray-100 text-gray-800 border border-gray-300 shadow-sm';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300 shadow-sm';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg">
            <ArrowUpRight className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('transfers.title')}</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-20 rounded-xl border border-gray-200"></div>
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
          <div className="p-2 bg-danger-100 rounded-lg">
            <XCircle className="w-6 h-6 text-danger-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('transfers.title')}</h3>
        </div>
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 text-center">
          <XCircle className="w-8 h-8 text-danger-500 mx-auto mb-2" />
          <p className="text-danger-700 font-medium">{t('common.error_loading_data')}</p>
        </div>
      </div>
    );
  }

  if (!transfers || transfers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg">
            <ArrowUpRight className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('transfers.title')}</h3>
        </div>
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <ArrowUpRight className="w-10 h-10 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">{t('transfers.no_transfers')}</h4>
          <p className="text-gray-500">{t('transfers.no_transfers_description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <ArrowUpRight className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('transfers.title')}</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <TrendingUp className="w-4 h-4" />
          <span>{transfers.length} {transfers.length === 1 ? 'transfer' : 'transfers'}</span>
        </div>
      </div>

      <div className="space-y-4">
        {transfers.map((transfer, index) => (
          <div
            key={transfer.id}
            className="group border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-gradient-to-r from-white to-gray-50/30"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {getStatusIcon(transfer.status)}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border border-gray-200"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">
                    Transfer to Stripe Account
                  </h4>
                  <p className="text-sm text-gray-500">
                    {transfer.stripe_transfer_id ? (
                      <span className="font-mono">
                        {transfer.stripe_transfer_id.substring(0, 20)}...
                      </span>
                    ) : (
                      'Transfer ID not available'
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-success-600" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatAmount(transfer.amount, transfer.currency)}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    transfer.status
                  )}`}
                >
                  {transfer.status}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">{t('transfers.created')}</p>
                    <p className="text-gray-500">{formatDate(transfer.created_at)}</p>
                  </div>
                </div>
                {transfer.completed_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-success-100 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-success-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">{t('transfers.completed')}</p>
                      <p className="text-gray-500">{formatDate(transfer.completed_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
