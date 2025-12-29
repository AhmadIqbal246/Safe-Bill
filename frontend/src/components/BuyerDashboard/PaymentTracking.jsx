import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

export default function PaymentTracking({ billings = [] }) {
  const { user } = useSelector(state => state.auth);
  const { t } = useTranslation();
  const [search, setSearch] = React.useState('');
  const filteredBillings = React.useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    if (!q) return billings;
    return billings.filter((p) => (p.project?.name || '').toLowerCase().includes(q));
  }, [billings, search]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
      case 'succeeded':
        return '#0ec6b0';
      case 'failed':
        return '#ef4444';
      case 'pending':
      case 'payment_in_progress':
        return '#eab308';
      case 'in_transit':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  return (
    <div style={{ flex: 1, borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 340 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 18 }}>{t('payment_tracking.title')}</div>
        <div style={{ flex: '0 1 320px', width: '100%', maxWidth: 360 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('payment_tracking.search_placeholder')}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 14,
              width: '100%'
            }}
          />
        </div>
      </div>

      {filteredBillings.length > 0 ? (
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '360px', width: '100%' }}>
          <table style={{
            minWidth: '750px',
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e5e7eb'
              }}>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#374151',
                  borderRight: '1px solid #e5e7eb',
                  minWidth: '150px',
                  whiteSpace: 'nowrap'
                }}>
                  {t('payment_tracking.project_name')}
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#374151',
                  borderRight: '1px solid #e5e7eb',
                  minWidth: '150px',
                  whiteSpace: 'nowrap'
                }}>
                  {t('payment_tracking.project_amount')}
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#374151',
                  borderRight: '1px solid #e5e7eb',
                  minWidth: '150px',
                  whiteSpace: 'nowrap'
                }}>
                  {t('payment_tracking.paid_amount')}
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#374151',
                  borderRight: '1px solid #e5e7eb',
                  minWidth: '150px',
                  whiteSpace: 'nowrap'
                }}>
                  {t('payment_tracking.date')}
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#374151',
                  minWidth: '150px',
                  whiteSpace: 'nowrap'
                }}>
                  {t('payment_tracking.status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBillings.map((payment, index) => {
                const statusColor = getStatusColor(payment.status);

                return (
                  <tr
                    key={payment.id}
                    style={{
                      borderBottom: index < filteredBillings.length - 1 ? '1px solid #e5e7eb' : 'none',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                    }}
                  >
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: 500,
                      color: '#111827',
                      borderRight: '1px solid #e5e7eb',
                      minWidth: '150px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {payment.project?.name || 'Unknown Project'}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      color: '#6b7280',
                      borderRight: '1px solid #e5e7eb',
                      minWidth: '150px',
                      whiteSpace: 'nowrap'
                    }}>
                      {payment.amount || 'Unknown Project'}
                      {" "}
                      {payment.currency || 'USD'}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: payment.status === 'paid' || payment.status === 'succeeded' ? '#0ec6b0' : '#153A7D',
                      borderRight: '1px solid #e5e7eb',
                      minWidth: '150px',
                      whiteSpace: 'nowrap'
                    }}>
                      €{parseFloat(payment.buyer_total_amount).toFixed(2)} {payment.currency || 'USD'}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      color: '#6b7280',
                      borderRight: '1px solid #e5e7eb',
                      minWidth: '150px',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatDate(payment.created_at)}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      minWidth: '150px',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        background: statusColor,
                        color: '#fff',
                        borderRadius: 8,
                        padding: '4px 12px',
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
          {t('payment_tracking.no_payments')}
        </div>
      )}
    </div>
  );
}