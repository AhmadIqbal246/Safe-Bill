import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

const PaymentManagement = () => {
  const [tab, setTab] = useState('payments');
  const [search, setSearch] = useState('');
  
  const adminState = useSelector(state => state.admin);
  const paidPayments = useMemo(() => adminState.payments?.paid || [], [adminState.payments?.paid]);
  const transfers = useMemo(() => adminState.payments?.transfers || [], [adminState.payments?.transfers]);

  // Filter data based on search
  const filteredPayments = useMemo(() => {
    if (!search) return paidPayments;
    const q = search.toLowerCase();
    return paidPayments.filter(payment => 
      payment.user_name?.toLowerCase().includes(q) ||
      payment.user_email?.toLowerCase().includes(q) ||
      payment.project_title?.toLowerCase().includes(q) ||
      payment.stripe_payment_id?.toLowerCase().includes(q)
    );
  }, [paidPayments, search]);

  const filteredTransfers = useMemo(() => {
    if (!search) return transfers;
    const q = search.toLowerCase();
    return transfers.filter(transfer => 
      transfer.user_name?.toLowerCase().includes(q) ||
      transfer.user_email?.toLowerCase().includes(q) ||
      transfer.stripe_transfer_id?.toLowerCase().includes(q) ||
      transfer.stripe_account_id?.toLowerCase().includes(q)
    );
  }, [transfers, search]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'paid': 'bg-emerald-100 text-emerald-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'failed': 'bg-red-100 text-red-700',
      'completed': 'bg-emerald-100 text-emerald-700',
      'processing': 'bg-blue-100 text-blue-700',
      'cancelled': 'bg-gray-100 text-gray-700',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-8">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="font-medium">Payment Management</div>
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search payments and transfers..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex gap-6 text-sm">
          <button
            className={`pb-2 border-b-2 ${tab === 'payments' ? 'border-[#01257D] text-[#01257D]' : 'border-transparent text-gray-500'}`}
            onClick={() => setTab('payments')}
          >
            Payments ({paidPayments.length})
          </button>
          <button
            className={`pb-2 border-b-2 ${tab === 'transfers' ? 'border-[#01257D] text-[#01257D]' : 'border-transparent text-gray-500'}`}
            onClick={() => setTab('transfers')}
          >
            Transfers ({transfers.length})
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {tab === 'payments' ? (
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-medium px-4 py-3 min-w-[200px]">User</th>
                <th className="text-left font-medium px-4 py-3 min-w-[150px]">Project</th>
                <th className="text-left font-medium px-4 py-3 min-w-[120px]">Project Amount</th>
                {/* <th className="text-left font-medium px-4 py-3">Platform Fee</th> */}
                <th className="text-left font-medium px-4 py-3 min-w-[100px]">Stripe Fee</th>
                <th className="text-left font-medium px-4 py-3 min-w-[120px]">Total Paid</th>
                {/* <th className="text-left font-medium px-4 py-3">Seller Net</th> */}
                <th className="text-left font-medium px-4 py-3 min-w-[100px]">Status</th>
                <th className="text-left font-medium px-4 py-3 min-w-[150px]">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={`payment-${payment.id}`} className="border-t border-gray-100">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="font-medium">{payment.user_name}</div>
                      <div className="text-gray-500 text-xs">{payment.user_email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="truncate" title={payment.project_title}>
                      {payment.project_title}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{formatCurrency(payment.amount)}</td>
                  {/* <td className="px-4 py-3 text-emerald-600">{formatCurrency(payment.platform_fee_amount)}</td> */}
                  <td className="px-4 py-3 text-blue-600 whitespace-nowrap">{formatCurrency(payment.stripe_fee_amount)}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{formatCurrency(payment.buyer_total_amount)}</td>
                  {/* <td className="px-4 py-3 font-medium">{formatCurrency(payment.seller_net_amount)}</td> */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(payment.created_at)}</td>
                  {/* <td className="px-4 py-3">
                    <div className="max-w-xs truncate font-mono text-xs" title={payment.stripe_payment_id}>
                      {payment.stripe_payment_id}
                    </div>
                  </td> */}
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-3 text-center text-gray-500">
                    {search ? 'No payments found matching your search.' : 'No payments found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-medium px-4 py-3 min-w-[200px]">User</th>
                <th className="text-left font-medium px-4 py-3 min-w-[120px]">Amount</th>
                <th className="text-left font-medium px-4 py-3 min-w-[100px]">Currency</th>
                <th className="text-left font-medium px-4 py-3 min-w-[100px]">Status</th>
                <th className="text-left font-medium px-4 py-3 min-w-[200px]">Stripe Transfer ID</th>
                <th className="text-left font-medium px-4 py-3 min-w-[200px]">Stripe Account ID</th>
                <th className="text-left font-medium px-4 py-3 min-w-[150px]">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.map((transfer) => (
                <tr key={`transfer-${transfer.id}`} className="border-t border-gray-100">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="font-medium">{transfer.user_name}</div>
                      <div className="text-gray-500 text-xs">{transfer.user_email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{formatCurrency(transfer.amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {transfer.currency}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transfer.status)}`}>
                      {transfer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">
                    {transfer.stripe_transfer_id}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">
                    {transfer.stripe_account_id}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(transfer.created_at)}</td>
                  {/* <td className="px-4 py-3">
                    <div className="max-w-xs truncate font-mono text-xs" title={transfer.stripe_transfer_id}>
                      {transfer.stripe_transfer_id}
                    </div>
                  </td> */}
                </tr>
              ))}
              {filteredTransfers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-3 text-center text-gray-500">
                    {search ? 'No transfers found matching your search.' : 'No transfers found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PaymentManagement;
