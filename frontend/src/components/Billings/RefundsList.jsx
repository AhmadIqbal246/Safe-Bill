import React from 'react';

export default function RefundsList({ refunds, loading, error }) {
  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'paid':
      case 'succeeded':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
      case 'canceled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="h-6 w-40 bg-gray-100 rounded mb-4" />
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-lg p-6">
        <div className="text-red-700">{typeof error === 'string' ? error : 'Failed to load refunds'}</div>
      </div>
    );
  }

  console.log(refunds);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Refunded Payments</h3>
      {(!refunds || refunds.length === 0) ? (
        <div className="text-gray-500">No refunded payments.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Project</th>
                <th className="text-left font-medium px-4 py-3">Amount</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Stripe Refund ID</th>
                <th className="text-left font-medium px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{r.project?.name || '-'}</td>
                  <td className="px-4 py-3 font-medium">€{parseFloat(r.amount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono">{r.stripe_refund_id}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
