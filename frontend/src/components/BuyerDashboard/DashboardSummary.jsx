import React from 'react';

export default function DashboardSummary({ stats = {} }) {
  const { activeProjects = 8, completedProjects = 24, pendingPayments = 3 } = stats;

  return (
    <>
      <div style={{ flex: 1, borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 220 }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Active Projects</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#153A7D' }}>{activeProjects}</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>In progress</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 220 }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Completed</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#153A7D' }}>{completedProjects}</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>Successfully finished</div>
      </div>
      <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 220 }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Pending Payment</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#153A7D' }}>{pendingPayments}</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>Awaiting payment</div>
      </div>
    </>
  );
}