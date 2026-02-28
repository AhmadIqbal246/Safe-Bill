import React, { useMemo, useState } from 'react';
import { Eye, Search, CheckCircle } from 'lucide-react';
import ProjectStatusBadge from '../common/ProjectStatusBadge';
import { useTranslation } from 'react-i18next';

export default function ApprovedProjects({ projects }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // Only approved, real projects
  const allApproved = projects.filter(
    (p) => p.status === 'approved' && p.project_type === 'real_project'
  );

  const approvedProjects = useMemo(() => {
    if (!searchTerm.trim()) return allApproved;
    const q = searchTerm.toLowerCase();
    return allApproved.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.seller_name || '').toLowerCase().includes(q) ||
        (p.reference_number || '').toLowerCase().includes(q)
    );
  }, [allApproved, searchTerm]);

  const getQuoteFileUrl = (file) => {
    if (!file) return '#';
    if (file.startsWith('http')) return file;
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') + file;
  };

  if (allApproved.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('approved_projects.header')}</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-gray-500 text-sm">You have no approved projects yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 sm:mb-0">
          {t('approved_projects.header')} ({allApproved.length})
        </h3>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('approved_projects.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D] text-sm"
          />
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-4">
          {approvedProjects.map((project) => (
            <div key={project.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{project.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Seller: {project.seller_name}</span>
                    <span>Ref: {project.reference_number}</span>
                    <span>Approved: {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <ProjectStatusBadge status={project.status} size="small" />
              </div>

              {project.quote?.file && (
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={getQuoteFileUrl(project.quote.file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#01257D] hover:bg-[#E6F0FA] rounded-md transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {t('approved_projects.view_quote')}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


