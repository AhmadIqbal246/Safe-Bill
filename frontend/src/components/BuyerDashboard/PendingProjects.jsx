import React, { useState, useMemo } from 'react';
import { Check, X, Eye, Download, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProjectStatusBadge from '../common/ProjectStatusBadge';

export default function PendingProjects({ projects }) {
  const { t } = useTranslation();
  const [actionLoading, setActionLoading] = useState({});
  const [actionMessage, setActionMessage] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only pending projects that are real projects (not quote chat)
  const allPendingProjects = projects.filter(project => 
    project.status === 'pending' && project.project_type === 'real_project'
  );

  // Filter projects based on search term
  const pendingProjects = useMemo(() => {
    if (!searchTerm.trim()) return allPendingProjects;
    
    const searchLower = searchTerm.toLowerCase();
    return allPendingProjects.filter(project => 
      project.name.toLowerCase().includes(searchLower) ||
      project.seller_name.toLowerCase().includes(searchLower) ||
      project.reference_number.toLowerCase().includes(searchLower) ||
      project.total_amount?.toString().includes(searchLower)
    );
  }, [allPendingProjects, searchTerm]);

  const handleProjectAction = async (projectId, action) => {
    setActionLoading(prev => ({ ...prev, [projectId]: true }));
    setActionMessage(prev => ({ ...prev, [projectId]: '' }));
    
    try {
      // Get the project's invite token from the project data
      const project = projects.find(p => p.id === projectId);
      if (!project || !project.invite_token) {
        throw new Error('Project invite token not found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}api/projects/invite/${project.invite_token}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('access')}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setActionMessage(prev => ({ 
          ...prev, 
          [projectId]: data.detail 
        }));
        
        // Refresh the page after a short delay to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // Map backend error messages to localized versions
        const detail = (data && data.detail) || 'Action failed';
        let localized = detail;
        if (detail === 'Invite link has expired.') {
          localized = t('accept_project_invite.invite_expired');
        } else if (detail === 'Invalid or expired invite link.') {
          localized = t('accept_project_invite.invalid_or_expired');
        }
        throw new Error(localized);
      }
    } catch (error) {
      setActionMessage(prev => ({ 
        ...prev, 
        [projectId]: `Error: ${error.message}` 
      }));
    } finally {
      setActionLoading(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const getQuoteFileUrl = (file) => {
    if (!file) return '#';
    if (file.startsWith('http')) return file;
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') + file;
  };

  if (allPendingProjects.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t('buyer_dashboard.pending_projects')}
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            {t('buyer_dashboard.no_pending_projects')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 sm:mb-0">
          {t('buyer_dashboard.pending_projects')} ({allPendingProjects.length})
        </h3>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('buyer_dashboard.search_projects')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D] text-sm"
          />
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm.trim() && (
        <div className="mb-4 text-sm text-gray-600">
          {t('buyer_dashboard.search_results', { 
            found: pendingProjects.length, 
            total: allPendingProjects.length 
          })}
        </div>
      )}
      
      {/* Projects Container with Scroll */}
      <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-4">
          {pendingProjects.map((project) => (
            <div key={project.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              {/* Project Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{project.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Seller: {project.seller_name}</span>
                    <span>Ref: {project.reference_number}</span>
                    <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <ProjectStatusBadge status={project.status} size="small" />
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-1">Total Amount</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${(() => {
                          const totalAmount = Number(project.total_amount) || 0;
                          const platformFeePct = Number(project.platform_fee_percentage) || 0;
                          const vatPct = Number(project.vat_rate) || 0;
                          const amountWithVat = totalAmount * (1 + vatPct / 100);
                          const netAmount = amountWithVat * (1 - platformFeePct / 100);
                          return Number.isFinite(netAmount) ? Math.round(netAmount).toLocaleString() : '0';
                        })()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-1">Installments</div>
                  <div className="text-sm text-gray-700">
                    {project.installments?.length || 0} payment(s)
                  </div>
                </div>
              </div>

              {/* Quote Actions */}
              {project.quote?.file && (
                <div className="flex items-center gap-2 mb-4">
                  <a
                    href={getQuoteFileUrl(project.quote.file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#01257D] hover:bg-[#E6F0FA] rounded-md transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Quote
                  </a>
                  <a
                    href={getQuoteFileUrl(project.quote.file)}
                    download
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              )}

              {/* Action Messages */}
              {actionMessage[project.id] && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  actionMessage[project.id].includes('approved') ? 'bg-green-100 text-green-800' :
                  actionMessage[project.id].includes('rejected') ? 'bg-red-100 text-red-800' :
                  actionMessage[project.id].includes('Error') ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {actionMessage[project.id]}
                </div>
              )}

              {/* Project Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleProjectAction(project.id, 'approve')}
                  disabled={actionLoading[project.id]}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading[project.id] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('actions.processing')}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {t('buyer_dashboard.approve_project')}
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleProjectAction(project.id, 'reject')}
                  disabled={actionLoading[project.id]}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading[project.id] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('actions.processing')}
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      {t('buyer_dashboard.reject_project')}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* No Search Results */}
      {searchTerm.trim() && pendingProjects.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            {t('buyer_dashboard.no_search_results')}
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-[#01257D] hover:text-[#2346a0] text-sm font-medium"
          >
            {t('buyer_dashboard.clear_search')}
          </button>
        </div>
      )}
    </div>
  );
}
