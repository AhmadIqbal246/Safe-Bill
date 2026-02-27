import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProjectStatusBadge from '../common/ProjectStatusBadge';
import { Search } from 'lucide-react';

export default function CurrentProjects({ projects = [] }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");

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

  // filter by name for in-progress projects
  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const inProgress = (projects || []).filter(p => p.status === 'in_progress');
    if (!term) return inProgress;
    return inProgress.filter(p => (p.name || "").toLowerCase().includes(term));
  }, [projects, search]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px] h-[500px] flex flex-col">
      <div className="font-semibold text-lg mb-3">{t('buyer_dashboard.current_projects')}</div>
      <div className="mb-3">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('buyer_dashboard.search_projects')}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D] text-sm"
          />
        </div>
      </div>
      {filtered.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {filtered.map((project, index) => {
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
                    €{(() => {
                      const totalAmount = Number(project.total_amount) || 0;
                      const vatPct = Number(project.vat_rate) || 0;
                      const amountWithVat = totalAmount * (1 + vatPct / 100);
                      const netAmount = amountWithVat;
                      return Number.isFinite(netAmount) ? Math.round(netAmount).toLocaleString() : '0';
                    })()}
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
                  {t('buyer_dashboard.due_label', 'Due')}: {new Date(project.created_at).toLocaleDateString(i18n.language || 'en-US', {
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