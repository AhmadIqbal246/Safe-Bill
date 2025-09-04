import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Wallet, TrendingUp, CreditCard, Lock } from 'lucide-react';

export default function BalanceSummary({ balance, loading, error }) {
  const { t } = useTranslation();
  const { user } = useSelector(state => state.auth);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('billings.balance_summary')}</h3>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gradient-to-r from-gray-100 to-gray-200 h-24 rounded-xl border border-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Wallet className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('billings.balance_summary')}</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-red-500 font-medium">{t('common.error_loading_data')}</div>
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('billings.balance_summary')}</h3>
        </div>
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Wallet className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">{t('billings.no_balance_data')}</p>
        </div>
      </div>
    );
  }

  // Show different cards based on user role
  const isSeller = user?.role === 'seller';
  
  const balanceCards = isSeller ? [
    // Seller cards
    {
      title: t('billings.current_balance'),
      value: `${parseFloat(balance.current_balance).toLocaleString()} ${balance.currency}`,
      icon: Wallet,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: t('billings.available_for_transfer'),
      value: `${parseFloat(balance.available_for_payout || 0).toLocaleString()} ${balance.currency}`,
      icon: Lock,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
    },
    {
      title: t('billings.total_earnings'),
      value: `${parseFloat(balance.total_earnings).toLocaleString()} ${balance.currency}`,
      icon: TrendingUp,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
  ] : [
    // Buyer cards
    {
      title: t('billings.total_spent'),
      value: `${parseFloat(balance.total_spent).toLocaleString()} ${balance.currency}`,
      icon: CreditCard,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
    {
      title: t('billings.payments_held_for_projects'),
      value: `${parseFloat(balance.held_in_escrow).toLocaleString()} ${balance.currency}`,
      icon: Lock,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-success-100 rounded-lg">
          <Wallet className="w-6 h-6 text-success-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{t('billings.balance_summary')}</h3>
      </div>
      
      <div className={` grid grid-cols-1  ${isSeller ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        {balanceCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div 
              key={index} 
              className={`${card.bgColor} rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group`}
              style={{
                animationDelay: `${index * 150}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/50 rounded-lg group-hover:bg-white/70 transition-colors">
                  <IconComponent className={`w-6 h-6 ${card.color}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {card.title}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {card.value}
              </div>
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full ${card.color.replace('text-', 'bg-')} rounded-full transition-all duration-1000`} style={{width: '100%'}}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
