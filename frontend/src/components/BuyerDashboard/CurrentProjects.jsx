import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProjectStatusBadge from '../common/ProjectStatusBadge';

export default function CurrentProjects({ projects = [] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getProgressPercentage = (project) => {
    // Prefer backend-provided progress percentage if available
    const pctFromBackend = project?.progress_pct;
    if (typeof pctFromBackend === 'number' && !isNaN(pctFromBackend)) {
      return Math.min(Math.max(Math.round(pctFromBackend), 0), 100);
    }

    // Fallback 1: use approved vs total milestones if present
    const approved = typeof project?.approved_milestones === 'number' ? project.approved_milestones : null;
    const total = typeof project?.total_milestones === 'number' ? project.total_milestones : null;
    if (total && total > 0 && approved !== null) {
      return Math.min(Math.max(Math.round((approved / total) * 100), 0), 100);
    }

    // Fallback 2: simple heuristic by installments
    const totalInstallments = project.installments?.length || 1;
    const completedInstallments = project.installments?.filter(inst => inst.step === 'Project Completion').length || 0;
    return Math.min(Math.max(Math.round((completedInstallments / totalInstallments) * 100), 0), 100);
  };



  const handleProjectClick = (project) => {
    navigate(`/project/${project.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px] h-[500px] flex flex-col">
      <div className="font-semibold text-lg mb-4">{t('buyer_dashboard.current_projects')}</div>
      
      {projects.filter(project => project.status === 'in_progress').length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {projects.filter(project => project.status === 'in_progress').map((project, index) => {
            const progress = getProgressPercentage(project);
            
            return (
              <div 
                key={project.id} 
                className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-[#01257D] hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleProjectClick(project)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{project.name}</span>
                    <ProjectStatusBadge status={project.status} size="small" />
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    €{project.total_amount?.toFixed(2) || '0.00'}
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
          {t('buyer_dashboard.no_in_progress_projects')}
        </div>
      )}
    </div>
  );
}