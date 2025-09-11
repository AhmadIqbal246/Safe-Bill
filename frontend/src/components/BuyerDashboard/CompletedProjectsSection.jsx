import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CompletedProjectsSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clientProjects } = useSelector((state) => state.project);

  const completed = (clientProjects || []).filter(p => p.status === 'completed');

  const openProject = (p) => navigate(`/project/${p.id}`);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('buyer_dashboard.completed_projects') || 'Completed Projects'}</h3>
      </div>
      {completed.length === 0 ? (
        <div className="py-10 text-center text-gray-500">{t('dashboard.no_projects_found')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {completed.map((p) => (
            <div key={p.id} className="border border-[#E6F0FA] rounded-md p-4 hover:shadow-sm transition cursor-pointer" onClick={() => openProject(p)}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-[#01257D] truncate mr-2">{p.name}</div>
                <div className="text-sm font-semibold text-gray-800">€{(p.total_amount || 0).toLocaleString()}</div>
              </div>
              <div className="text-xs text-gray-500">{t('receipts.ref')} {p.reference_number || '-'}</div>
              <div className="text-xs text-gray-500">{t('buyer_dashboard.completed_on') || 'Completed on'}: {p.created_at}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


