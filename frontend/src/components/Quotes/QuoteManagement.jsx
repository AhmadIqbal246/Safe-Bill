import React, { useState, useEffect } from 'react';
import { Eye, Edit, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, deleteProject } from '../../store/slices/ProjectSlice';
import { toast } from 'react-toastify';
import { Dialog } from '@headlessui/react';
import { useTranslation } from 'react-i18next';

const statusStyles = {
  Pending: 'bg-cyan-100 text-cyan-700',
  Validated: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Expired: 'bg-pink-100 text-pink-700',
};

const filters = ['Status', 'Date', 'Amount', 'Client'];
const statusOptions = ['Pending', 'Validated', 'Rejected', 'Expired'];

export default function QuoteManagement() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeSort, setActiveSort] = useState('Status');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading, error } = useSelector(state => state.project);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, projectId: null });

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Optionally filter by search
  let filteredProjects = (projects || []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client_email.toLowerCase().includes(search.toLowerCase())
  );

  // Sorting logic
  if (activeSort === 'Date') {
    filteredProjects = filteredProjects.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (activeSort === 'Amount') {
    filteredProjects = filteredProjects.slice().sort((a, b) => b.total_amount - a.total_amount);
  } else if (activeSort === 'Client') {
    filteredProjects = filteredProjects.slice().sort((a, b) => a.client_email.localeCompare(b.client_email));
  } else if (activeSort === 'Status') {
    // For now, keep as is or random, since status is random
  }

  const handleDelete = (id) => {
    setConfirmModal({ open: true, projectId: id });
  };

  const confirmDelete = async () => {
    const id = confirmModal.projectId;
    setDeletingId(id);
    setConfirmModal({ open: false, projectId: null });
    try {
      await dispatch(deleteProject(id)).unwrap();
      toast.success(t('quote_management.project_deleted_successfully'));
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('quote_management.failed_delete_project'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Confirmation Modal using Headless UI Dialog */}
      <Dialog open={confirmModal.open} onClose={() => setConfirmModal({ open: false, projectId: null })} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-xs rounded bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold mb-4">{t('quote_management.confirm_deletion')}</Dialog.Title>
            <div className="mb-6">{t('quote_management.confirm_delete_message')}</div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 cursor-pointer"
                onClick={() => setConfirmModal({ open: false, projectId: null })}
              >
                {t('quote_management.cancel')}
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 cursor-pointerS"
                onClick={confirmDelete}
                disabled={deletingId === confirmModal.projectId}
              >
                {deletingId === confirmModal.projectId ? t('quote_management.deleting') : t('quote_management.delete')}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">{t('quote_management.title')}</h1>
        <button
          className="px-5 py-2 bg-[#01257D] text-white rounded-lg font-semibold hover:bg-[#2346a0] transition-colors text-sm mt-2 sm:mt-0 cursor-pointer"
          onClick={() => navigate('/project-creation')}
        >
          {t('quote_management.new_quote')}
        </button>
      </div>
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.map(f => (
            <button
              key={f}
              className={`px-3 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors ${activeSort === f ? 'bg-[#E6F0FA] text-[#01257D] font-bold' : 'bg-[#E6F0FA] text-[#01257D]'}`}
              onClick={() => setActiveSort(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="mb-6 flex justify-start sm:justify-center">
          <input
            type="text"
            placeholder={t('quote_management.search_placeholder')}
            className="w-[100%] sm:w-full px-3 py-3 rounded-md border border-gray-200 bg-[#E6F0FA] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#01257D]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white max-w-[300px] w-full mx-auto sm:max-w-full">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-[#E6F0FA] border-t-[#01257D] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{typeof error === 'string' ? error : t('quote_management.failed_load_projects')}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center text-gray-400 py-12">{t('quote_management.no_projects_found')}</div>
        ) : (
          <div className={filteredProjects.length > 10 ? 'max-h-96 overflow-y-auto' : ''}>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">{t('quote_management.quote_reference')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('quote_management.project_name')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('quote_management.client')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('quote_management.amount')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('quote_management.creation_date')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('quote_management.status')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('quote_management.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p, i) => {
                  const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
                  return (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 whitespace-nowrap">{p.quote && p.quote.reference_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.client_email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">${p.total_amount}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.created_at}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>{t(`quote_management.${status.toLowerCase()}`)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap flex gap-2 items-center">
                        <button className="p-1 hover:bg-gray-100 rounded" title={t('quote_management.view')}
                          onClick={() => window.open(p.quote && p.quote.file, '_blank')}>
                          <Eye className="w-4 h-4" />
                        </button>
                        <a className="p-1 hover:bg-gray-100 rounded" title={t('quote_management.download')}
                          href={p.quote && p.quote.file} download>
                          <Download className="w-4 h-4" />
                        </a>
                        <button className="p-1 hover:bg-gray-100 rounded" title={t('quote_management.edit')}><Edit className="w-4 h-4" /></button>
                        <button
                          className={`p-1 hover:bg-gray-100 rounded cursor-pointer ${deletingId === p.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={t('quote_management.delete')}
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
