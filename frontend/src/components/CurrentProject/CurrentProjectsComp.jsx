import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProjects } from '../../store/slices/ProjectSlice';
import ProjectDetailDialogue from '../mutualComponents/Project/ProjectDetailDialogue';
import { useTranslation } from 'react-i18next';
import ProjectStatusBadge from '../common/ProjectStatusBadge';
import LoginBg from '../../assets/Circle Background/login-removed-bg.jpg';
import { getStepTranslationKey } from '../../utils/translationUtils';

export default function CurrentProjectsComp() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading, error } = useSelector(state => state.project);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProject, setDialogProject] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Filter projects by search and status (only in_progress)
  let filteredProjects = (projects || []).filter(p =>
    p.status === 'in_progress' && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client_email.toLowerCase().includes(search.toLowerCase())
    )
  );

  // Sort projects by created_at descending
  const sortedProjects = filteredProjects.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const currentProject = sortedProjects[0];
  const otherProjects = sortedProjects.slice(1);

  const handleViewDetails = (project) => {
    setDialogProject(project);
    setDialogOpen(true);
  };

  const handleViewMilestones = (project) => {
    console.log("project", project);
    navigate('/milestones', { state: { project } });
  };

  return (
    <div className="relative -m-6 min-h-[calc(100vh-4rem)]">
      {/* Full-page background layer */}
      <div
        className="absolute inset-0 -z-10 bg-top bg-no-repeat bg-contain md:bg-cover"
        style={{ backgroundImage: `url(${LoginBg})` }}
      />
      <div className="max-w-4xl mx-auto relative z-10 py-8 px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[#2E78A6]">{t('current_projects.in_progress_title')}</h2>

        {/* Search Bar */}
        <div className="mb-6 flex justify-start sm:justify-center">
          <input
            type="text"
            placeholder={t('current_projects.search_placeholder')}
            className="w-[100%] sm:w-full px-3 py-3 rounded-md border border-gray-200 bg-[#C1E7FF] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#01257D]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Highlighted Current Project */}
        {loading ? (
          <div className="py-12 text-center text-gray-400">{t('my_profile.loading')}</div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">{typeof error === 'string' ? error : t('current_projects.failed_load_projects')}</div>
        ) : currentProject ? (
          <div className="bg-[#C1E7FF] rounded-lg p-6 mb-8 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="text-lg font-semibold text-[#01257D]">{currentProject.name}</div>
                <div className="text-gray-500 text-sm">{t('current_projects.client')}: {currentProject.client_email}</div>
                <div className="mt-2">
                  <ProjectStatusBadge status={currentProject.status} size="default" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
                <button
                  className="px-4 py-2 bg-[#2E78A6] text-white rounded-lg font-semibold hover:bg-[#256a94] transition-colors text-sm cursor-pointer"
                  onClick={() => handleViewDetails(currentProject)}
                >
                  {t('current_projects.view_details')}
                </button>
                <button
                  className="px-4 py-2 bg-white text-[#01257D] border border-[#01257D] rounded-lg font-semibold hover:bg-[#E6F0FA] transition-colors text-sm cursor-pointer"
                  onClick={() => handleViewMilestones(currentProject)}
                >
                  {t('current_projects.view_milestones')}
                </button>
              </div>
            </div>
            {/* Progress Bar - dynamic from backend progress_pct */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-500 text-sm">{t('current_projects.progress')}</span>
              <div className="flex-1 mx-4">
                <div className="w-full h-2 bg-[#E6F0FA] rounded-full">
                  <div
                    className="h-2 bg-[#01257D] rounded-full transition-all"
                    style={{ width: `${Math.min(Math.max(currentProject.progress_pct ?? 0, 0), 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-gray-700 text-sm font-semibold">{currentProject.progress_pct ?? 0}%</span>
            </div>
            {/* Breakdown: show steps and amounts from installments */}
            <div className="flex flex-col md:flex-row justify-between mt-4 gap-4">
              {(currentProject.installments || []).map((item, idx) => (
                <div key={idx} className="flex-1 text-center">
                  <div className="text-gray-500 text-sm mb-1">{getStepTranslationKey(item.step) ? t(getStepTranslationKey(item.step)) : item.step}</div>
                  <div className="text-lg font-semibold text-gray-800">€{parseFloat(item.amount).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            {search ? t('current_projects.no_projects_matching_search') : t('current_projects.no_projects_found')}
          </div>
        )}

        {/* Other Projects List with Scroll */}
        {otherProjects.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{t('current_projects.other_projects')}</h3>
            <div className={`flex flex-col gap-3 ${otherProjects.length > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
              {otherProjects.map((proj, idx) => (
                <div
                  key={proj.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-[#E6F0FA] rounded-lg px-5 py-4 hover:shadow-sm transition-shadow"
                >
                  <div>
                    <div className="text-base font-semibold text-gray-900">{proj.name}</div>
                    <div className="text-gray-500 text-sm">{t('current_projects.client')}: {proj.client_email}</div>
                    <div className="mt-1">
                      <ProjectStatusBadge status={proj.status} size="small" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0">
                    <div className="text-lg font-semibold text-[#01257D]">${parseFloat(proj.total_amount).toLocaleString()}</div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 bg-[#01257D] text-white rounded-md font-medium hover:bg-[#2346a0] transition-colors text-sm cursor-pointer"
                        onClick={() => handleViewDetails(proj)}
                      >
                        {t('dashboard.view')}
                      </button>
                      <button
                        className="px-3 py-1 bg-white text-[#01257D] border border-[#01257D] rounded-md font-medium hover:bg-[#E6F0FA] transition-colors text-sm cursor-pointer"
                        onClick={() => handleViewMilestones(proj)}
                      >
                        {t('current_projects.milestones')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Detail Dialog */}
        <ProjectDetailDialogue
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          project={dialogProject}
        />
      </div>
    </div>
  );
}