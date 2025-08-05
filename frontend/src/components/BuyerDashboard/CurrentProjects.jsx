import React from 'react';

export default function CurrentProjects({ projects = [] }) {
  const getProgressPercentage = (project) => {
    // For now, use a simple calculation based on installments
    const totalInstallments = project.installments?.length || 1;
    const completedInstallments = project.installments?.filter(inst => 
      inst.step === 'Project Completion'
    ).length || 0;
    return Math.round((completedInstallments / totalInstallments) * 100);
  };

  const getStatusColor = (project) => {
    // For now, use a simple status based on progress
    const progress = getProgressPercentage(project);
    if (progress >= 90) return '#0ec6b0'; // Green for near completion
    if (progress >= 50) return '#0ec6b0'; // Green for active
    return '#eab308'; // Yellow for review
  };

  const getStatusText = (project) => {
    const progress = getProgressPercentage(project);
    if (progress >= 90) return 'Review';
    if (progress >= 50) return 'Active';
    return 'Planning';
  };

  return (
    <div style={{ 
      flex: 1, 
      borderRadius: 12, 
      boxShadow: '0 1px 4px #e5e7eb', 
      padding: 24, 
      minWidth: 340,
      maxHeight: 400,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Current Projects</div>
      
      {projects.length > 0 ? (
        <div style={{
          overflowY: 'auto',
          flex: 1,
          paddingRight: 8,
          marginRight: -8
        }}>
          {projects.map((project, index) => {
            const progress = getProgressPercentage(project);
            const statusColor = getStatusColor(project);
            const statusText = getStatusText(project);
            
            return (
              <div key={project.id} style={{ marginBottom: index < projects.length - 1 ? 20 : 0 }}>
                <div style={{ fontWeight: 500 }}>
                  {project.name} 
                  <span style={{ 
                    background: statusColor, 
                    color: '#fff', 
                    borderRadius: 8, 
                    padding: '2px 10px', 
                    fontSize: 12, 
                    marginLeft: 8 
                  }}>
                    {statusText}
                  </span>
                </div>
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, margin: '8px 0' }}>
                  <div style={{ 
                    width: `${progress}%`, 
                    height: '100%', 
                    background: '#153A7D', 
                    borderRadius: 4 
                  }}></div>
                </div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>
                  Due: {new Date(project.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div style={{ float: 'right', fontWeight: 600 }}>
                  ${project.total_amount?.toFixed(2) || '0.00'}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
          No active projects found
        </div>
      )}
    </div>
  );
}