import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DashboardSummary({ stats = {} }) {
  const { t } = useTranslation();
  const { activeProjects = 0, completedProjects = 0, pendingPayments = 0 } = stats;

  return (
    <>
      <div style={{ flex: 1, borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 220 }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>{t('buyer_dashboard.active_projects')}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#153A7D' }}>{activeProjects}</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>{t('buyer_dashboard.in_progress')}</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 220 }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>{t('buyer_dashboard.completed')}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#153A7D' }}>{completedProjects}</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>{t('buyer_dashboard.successfully_finished')}</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 220 }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>{t('buyer_dashboard.pending_payment')}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#153A7D' }}>{pendingPayments}</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>{t('buyer_dashboard.awaiting_payment')}</div>
      </div>
    </>
  );
}