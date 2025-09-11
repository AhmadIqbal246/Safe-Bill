import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CompletedProjectsSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clientProjects } = useSelector((state) => state.project);
  const [search, setSearch] = React.useState("");

  const completed = (clientProjects || []).filter(p => p.status === 'completed');
  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return completed;
    return completed.filter(p => (p.name || "").toLowerCase().includes(term));
  }, [completed, search]);

  const openProject = (p) => navigate(`/project/${p.id}`);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('buyer_dashboard.completed_projects') || 'Completed Projects'}</h3>
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('receipts.search_placeholder')}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01257D]"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-gray-500">{t('dashboard.no_projects_found')}</div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${filtered.length > 4 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
          {filtered.map((p) => (
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


