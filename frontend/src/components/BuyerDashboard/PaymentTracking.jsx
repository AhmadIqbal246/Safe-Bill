import React from 'react';

export default function PaymentTracking({ projects = [] }) {
  // Extract payment installments from projects
  const allPayments = projects.flatMap(project => 
    project.installments?.map(installment => ({
      ...installment,
      projectName: project.name,
      projectId: project.id
    })) || []
  );

  // For now, show first 2 payments
  const displayPayments = allPayments.slice(0, 2);

  const getPaymentStatus = (installment) => {
    // For now, use a simple logic based on step name
    if (installment.step === 'Project Completion') return 'Pending';
    if (installment.step === 'Quote Acceptance') return 'Paid';
    return 'Pending';
  };

  const getStatusColor = (status) => {
    return status === 'Paid' ? '#0ec6b0' : '#eab308';
  };

  const getDueDate = (project, installment) => {
    // For now, calculate a simple due date based on project creation
    const projectDate = new Date(project.created_at);
    const daysToAdd = installment.step === 'Project Completion' ? 30 : 7;
    const dueDate = new Date(projectDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    return dueDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div style={{ flex: 1, borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 340 }}>
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Payment Tracking</div>
      
      {displayPayments.length > 0 ? (
        displayPayments.map((payment, index) => {
          const status = getPaymentStatus(payment);
          const statusColor = getStatusColor(status);
          const project = projects.find(p => p.id === payment.projectId);
          
          return (
            <div key={`${payment.projectId}-${payment.step}`} style={{ marginBottom: index < displayPayments.length - 1 ? 20 : 0 }}>
              <div style={{ fontWeight: 500 }}>
                {payment.step} 
                <span style={{ 
                  float: 'right', 
                  color: status === 'Paid' ? '#0ec6b0' : '#153A7D', 
                  fontWeight: 600 
                }}>
                  ${parseFloat(payment.amount).toFixed(2)}
                </span>
              </div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>
                Due: {getDueDate(project, payment)} 
                <span style={{ 
                  background: statusColor, 
                  color: '#fff', 
                  borderRadius: 8, 
                  padding: '2px 10px', 
                  fontSize: 12, 
                  marginLeft: 8 
                }}>
                  {status}
                </span>
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
          No payment installments found
        </div>
      )}
    </div>
  );
}