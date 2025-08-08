import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CurrentProjects({ projects = [] }) {
  const navigate = useNavigate();

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
    if (progress >= 90) return 'bg-[#0ec6b0]'; // Green for near completion
    if (progress >= 50) return 'bg-[#0ec6b0]'; // Green for active
    return 'bg-yellow-500'; // Yellow for review
  };

  const getStatusText = (project) => {
    const progress = getProgressPercentage(project);
    if (progress >= 90) return 'Review';
    if (progress >= 50) return 'Active';
    return 'Planning';
  };

  const handleProjectClick = (project) => {
    navigate(`/project/${project.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px] h-[500px] flex flex-col">
      <div className="font-semibold text-lg mb-4">Current Projects</div>
      
      {projects.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {projects.map((project, index) => {
            const progress = getProgressPercentage(project);
            const statusColor = getStatusColor(project);
            const statusText = getStatusText(project);
            
            return (
              <div 
                key={project.id} 
                className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-[#01257D] hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleProjectClick(project)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{project.name}</span>
                    <span className={`${statusColor} text-white rounded-full px-2 py-0.5 text-xs`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    ${project.total_amount?.toFixed(2) || '0.00'}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                  <div 
                    className="h-2 bg-[#01257D] rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="text-xs text-gray-600">
                  Due: {new Date(project.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-8">
          No active projects found
        </div>
      )}
    </div>
  );
}