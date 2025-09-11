import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchOverview,
  fetchUsersByRole,
  fetchCurrentAdmins,
  toggleAdmin,
  fetchSuperAdminDisputes,
  assignMediator,
  fetchAdminAssignedDisputes,
  mediatorUpdateStatus,
  fetchRevenueSummary,
  fetchRevenueMonths,
  fetchPaidPayments,
  fetchTransfers,
  fetchRefunds,
} from '../../store/slices/AdminSlice';
import { Dialog } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import PaymentManagement from './PaymentManagement';

// Static data for now; can be replaced by API data later
const useStaticAdminData = () => {
  return useMemo(() => ({
    kpis: {
      userCount: 1234,
      transactions: 5678,
      disputes: 12,
    },
    registrationTrend: [
      { month: 'Jan', value: 48 },
      { month: 'Feb', value: 42 },
      { month: 'Mar', value: 55 },
      { month: 'Apr', value: 50 },
      { month: 'May', value: 60 },
      { month: 'Jun', value: 38 },
      { month: 'Jul', value: 58 },
    ],
    revenueBars: [
      { month: 'Jan', revenue: 8 },
      { month: 'Feb', revenue: 8 },
      { month: 'Mar', revenue: 8 },
      { month: 'Apr', revenue: 8 },
      { month: 'May', revenue: 8 },
      { month: 'Jun', revenue: 8 },
      { month: 'Jul', revenue: 8 },
    ],
    professionals: [],
    clients: [],
    kycQueue: [
      { id: 101, name: 'Noah Turner', document: 'ID Card', status: 'Pending' },
      { id: 102, name: 'Isabella Reed', document: 'Passport', status: 'Pending' },
      { id: 103, name: 'Jackson Hayes', document: "Driver's License", status: 'Pending' },
    ],
  }), []);
};

const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
    <div className="text-xs text-gray-500 mb-2">{title}</div>
    <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
  </div>
);

const Pill = ({ children, type }) => {
  const map = {
    Active: 'bg-emerald-100 text-emerald-700',
    Inactive: 'bg-gray-200 text-gray-700',
    Pending: 'bg-sky-100 text-sky-700',
  };
  return (
    <span className={`px-3 py-1 text-xs rounded-full inline-block ${map[type] || 'bg-gray-100 text-gray-700'}`}>
      {children}
    </span>
  );
};

const AdminToggle = ({ isAdmin, onToggle, disabled = false }) => (
  <label className="flex items-center cursor-pointer">
    <div className="relative">
      <input
        type="checkbox"
        className="sr-only"
        checked={isAdmin}
        onChange={onToggle}
        disabled={disabled}
      />
      <div className={`block w-10 h-6 rounded-full ${isAdmin ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAdmin ? 'transform translate-x-4' : ''}`}></div>
    </div>
  </label>
);

// Helpers
const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status
    .toString()
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const staticData = useStaticAdminData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('professionals');
  const [search, setSearch] = useState('');
  const [selectedMediatorByDispute, setSelectedMediatorByDispute] = useState({});
  const [assigningById, setAssigningById] = useState({}); // { [disputeId]: true }
  const [mediatorDropdownOpen, setMediatorDropdownOpen] = useState({}); // { [disputeId]: true }
  const [mediatorSearchTerm, setMediatorSearchTerm] = useState({}); // { [disputeId]: 'john' }
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null, confirmLabel: 'Confirm' });

  const user = sessionStorage.getItem('user');
  const userData = JSON.parse(user || '{}');
  const isSuperAdmin = userData.role === 'super-admin';
  const isAdmin = userData.role === 'admin' || (userData.is_admin === true);

  const adminState = useSelector(state => state.admin);
  const overview = adminState.overview || staticData;
  const professionals = adminState.professionals || [];
  const clients = adminState.clients || [];
  const currentAdmins = adminState.currentAdmins || [];
  const disputes = adminState.disputes || [];
  const assignedDisputes = adminState.assignedDisputes || [];
  const revenue = adminState.revenue || { summary: null, months: [] };

  const totalAssignedDisputes = assignedDisputes.length;

  // Process revenue data for charts
  const processedRevenueData = useMemo(() => {
    // Use revenue data from overview API (already processed by backend)
    if (overview.revenueBars && overview.revenueBars.length > 0) {
      return overview.revenueBars;
    }
    
    // Fallback: process revenue months if available
    if (revenue.months && revenue.months.length > 0) {
      const sortedMonths = [...revenue.months].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      const last7Months = sortedMonths.slice(0, 7).reverse();
      
      return last7Months.map(month => ({
        month: new Date(month.year, month.month - 1).toLocaleDateString('en-US', { month: 'short' }),
        revenue: parseFloat(month.total_revenue) || 0,
      }));
    }
    
    // Final fallback to static data
    return staticData.revenueBars;
  }, [overview.revenueBars, revenue.months, staticData.revenueBars]);

  // Get total transactions from revenue data
  const totalTransactions = useMemo(() => {
    if (revenue.summary && revenue.summary.current_month) {
      return revenue.summary.current_month.total_payments || 0;
    }
    return overview.kpis.transactions || 0;
  }, [revenue.summary, overview.kpis.transactions]);

  console.log(totalAssignedDisputes);


  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          dispatch(fetchOverview()),
          dispatch(fetchUsersByRole('seller')),
          dispatch(fetchUsersByRole('buyer')),
          dispatch(fetchRevenueSummary()),
          dispatch(fetchRevenueMonths()),
          dispatch(fetchPaidPayments()),
          dispatch(fetchTransfers()),
          dispatch(fetchRefunds()),
        ]);

        if (isSuperAdmin) {
          await Promise.all([
            dispatch(fetchCurrentAdmins()),
            dispatch(fetchSuperAdminDisputes()),
          ]);
        }
        if (!isSuperAdmin && isAdmin) {
          await dispatch(fetchAdminAssignedDisputes());
        }
      } catch (error) {
        setError('Failed to load admin overview');
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dispatch, isSuperAdmin, isAdmin]);

  const handleAdminToggle = async (userId, newAdminStatus) => {
    await dispatch(toggleAdmin({ userId, isAdmin: newAdminStatus }));
    if (isSuperAdmin) dispatch(fetchCurrentAdmins());
  };

  const openConfirm = (message, onConfirm, confirmLabel = 'Confirm') => {
    setConfirmModal({ open: true, message, onConfirm, confirmLabel });
  };

  const handleAssignMediator = async (disputeId) => {
    const mediatorId = selectedMediatorByDispute[disputeId];
    if (!mediatorId) return;
    setAssigningById(prev => ({ ...prev, [disputeId]: true }));
    await dispatch(assignMediator({ disputeId, mediatorId }));
    setAssigningById(prev => ({ ...prev, [disputeId]: false }));
    setMediatorDropdownOpen(prev => ({ ...prev, [disputeId]: false }));
  };

  const filteredMediators = (disputeId) => {
    const term = (mediatorSearchTerm[disputeId] || '').toLowerCase();
    if (!term) return currentAdmins;
    return currentAdmins.filter(a => (
      (a.name || '').toLowerCase().includes(term) ||
      (a.email || '').toLowerCase().includes(term)
    ));
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6">
      {/* Confirmation Modal */}
      <Dialog open={confirmModal.open} onClose={() => setConfirmModal({ open: false, message: '', onConfirm: null, confirmLabel: 'Confirm' })} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-xs rounded bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold mb-4">Confirm Action</Dialog.Title>
            <div className="mb-6 whitespace-pre-line text-sm text-gray-700">{confirmModal.message}</div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 cursor-pointer"
                onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null, confirmLabel: 'Confirm' })}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-[#01257D] text-white font-semibold hover:bg-[#2346a0] cursor-pointer"
                onClick={async () => {
                  const fn = confirmModal.onConfirm;
                  setConfirmModal({ open: false, message: '', onConfirm: null, confirmLabel: 'Confirm' });
                  if (typeof fn === 'function') await fn();
                }}
              >
                {confirmModal.confirmLabel || 'Confirm'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <h1 className="text-xl sm:text-2xl font-semibold mb-4">{t('admin.title')}</h1>

      {loading && (
        <div className="mb-4 text-sm text-gray-500">{t('admin.loading_overview')}</div>
      )}
      {error && (
        <div className="mb-4 text-sm text-red-600">{t('admin.failed_overview')}</div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title={t('admin.user_count')} value={overview.kpis.userCount || 0} />
        <StatCard title={t('admin.transactions')} value={totalTransactions} />
        <StatCard title={t('admin.disputes')} value={userData.role === 'super-admin' ? overview.kpis.disputes : totalAssignedDisputes || 0} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="mb-2">
            <div className="text-sm font-medium">{t('admin.registration_trends')}</div>
            <div className="text-xs text-gray-500">
              {(overview.registrationChangePercent >= 0 ? '+' : '') + (overview.registrationChangePercent ?? 0)}%
              {' • '}{t('admin.last_30_days')}{' '}
              {(overview.registrationChangePercent >= 0 ? '+' : '') + (overview.registrationChangePercent ?? 0)}%
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview.registrationTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#01257D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="mb-2">
            <div className="text-sm font-medium">{t('admin.revenue')}</div>
            <div className="text-xs text-gray-500">
              {(overview.revenueChangePercent >= 0 ? '+' : '') + (overview.revenueChangePercent ?? 0)}%
              {' • '}{t('admin.last_30_days')}{' '}
              {(overview.revenueChangePercent >= 0 ? '+' : '') + (overview.revenueChangePercent ?? 0)}%
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedRevenueData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value} EUR`, 'Revenue']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="revenue" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue Summary Section */}
      {revenue.summary && (
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="font-medium">Revenue Summary</div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-[#01257D]">
                  {revenue.summary.current_month?.total_revenue || 0} EUR
                </div>
                <div className="text-sm text-gray-500">Current Month Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-emerald-600">
                  {revenue.summary.current_month?.vat_collected || 0} EUR
                </div>
                <div className="text-sm text-gray-500">VAT Collected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-600">
                  {revenue.summary.current_month?.seller_revenue || 0} EUR
                </div>
                <div className="text-sm text-gray-500">Seller Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-600">
                  {revenue.summary.total_revenue?.total_revenue || 0} EUR
                </div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Admins Section (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="font-medium">{t('admin.current_admins')}</div>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">{t('admin.name')}</th>
                  <th className="text-left font-medium px-4 py-3">{t('admin.email')}</th>
                  <th className="text-left font-medium px-4 py-3">{t('admin.role')}</th>
                  <th className="text-left font-medium px-4 py-3">{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {currentAdmins.map(row => (
                  <tr key={`admin-${row.id}`} className="border-t border-gray-100">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500">{row.email}</td>
                    <td className="px-4 py-3">{row.role}</td>
                    <td className="px-4 py-3"><Pill type={row.status}>{row.status}</Pill></td>
                  </tr>
                ))}
                {currentAdmins.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-center text-gray-500">
                      {t('admin.no_admins_found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Management */}
      <PaymentManagement />

      {/* User Management */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="font-medium">{t('admin.user_management')}</div>
            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder={t('admin.search_placeholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-6 text-sm">
            <button
              className={`pb-2 border-b-2 ${tab === 'professionals' ? 'border-[#01257D] text-[#01257D]' : 'border-transparent text-gray-500'}`}
              onClick={() => setTab('professionals')}
            >
              {t('admin.professionals')}
            </button>
            <button
              className={`pb-2 border-b-2 ${tab === 'clients' ? 'border-[#01257D] text-[#01257D]' : 'border-transparent text-gray-500'}`}
              onClick={() => setTab('clients')}
            >
              {t('admin.clients')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">{t('admin.name')}</th>
                <th className="text-left font-medium px-4 py-3">{t('admin.email')}</th>
                <th className="text-left font-medium px-4 py-3">{t('admin.status')}</th>
                {isSuperAdmin && (
                  <th className="text-left font-medium px-4 py-3">{t('admin.admin_access')}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(tab === 'professionals' ? professionals : clients)
                .filter(row => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return (
                    row.name?.toLowerCase().includes(q) ||
                    row.email?.toLowerCase().includes(q)
                  );
                })
                .map(row => (
                <tr key={`${tab}-${row.id}`} className="border-t border-gray-100">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 text-gray-500">{row.email}</td>
                  <td className="px-4 py-3"><Pill type={row.status}>{row.status}</Pill></td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      <AdminToggle
                        isAdmin={row.is_admin || false}
                        onToggle={() => handleAdminToggle(row.id, !row.is_admin)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Super Admin: Disputes Management */}
      {isSuperAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-4 py-3 border-b border-gray-200 font-medium">Disputes</div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">ID</th>
                  <th className="text-left font-medium px-4 py-3">Title</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Initiator</th>
                  <th className="text-left font-medium px-4 py-3">Respondent</th>
                  <th className="text-left font-medium px-4 py-3">Mediator</th>
                  <th className="text-left font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(d => (
                  <tr key={`d-${d.id}`} className="border-t border-gray-100">
                    <td className="px-4 py-3">{d.dispute_id}</td>
                    <td className="px-4 py-3">{d.title}</td>
                    <td className="px-4 py-3">{formatStatus(d.status)}</td>
                    <td className="px-4 py-3 text-gray-500">{d.initiator}</td>
                    <td className="px-4 py-3 text-gray-500">{d.respondent}</td>
                    <td className="px-4 py-3">{d.assigned_mediator || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 relative">
                        <button
                          className={`px-3 py-1 border rounded-md text-sm ${d.status === 'resolved' || d.status === 'closed' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 cursor-pointer'}`}
                          onClick={() => {
                            if (d.status === 'resolved' || d.status === 'closed') return;
                            setMediatorDropdownOpen(prev => ({ ...prev, [d.id]: !prev[d.id] }));
                          }}
                          title={d.status === 'resolved' || d.status === 'closed' ? 'Cannot assign when dispute is resolved or closed' : ''}
                          disabled={d.status === 'resolved' || d.status === 'closed'}
                        >
                          {selectedMediatorByDispute[d.id]
                            ? (currentAdmins.find(a => a.id === selectedMediatorByDispute[d.id])?.name || 'Selected')
                            : 'Select mediator…'}
                        </button>
                        {mediatorDropdownOpen[d.id] && d.status !== 'resolved' && d.status !== 'closed' && (
                          <div className="absolute z-10 top-10 left-0 bg-white border rounded-md shadow-lg w-72">
                            <div className="p-2 border-b">
                              <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={mediatorSearchTerm[d.id] || ''}
                                onChange={(e) => setMediatorSearchTerm(prev => ({ ...prev, [d.id]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
                              />
                            </div>
                            <div className="max-h-56 overflow-y-auto">
                              {filteredMediators(d.id).map(a => (
                                <button
                                  key={`opt-${a.id}`}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text_sm text-sm cursor-pointer"
                                  onClick={() => {
                                    setSelectedMediatorByDispute(prev => ({ ...prev, [d.id]: a.id }));
                                    setMediatorDropdownOpen(prev => ({ ...prev, [d.id]: false }));
                                  }}
                                >
                                  {a.name} ({a.email})
                                </button>
                              ))}
                              {filteredMediators(d.id).length === 0 && (
                                <div className="px-3 py-2 text-gray-400 text-sm">No results</div>
                              )}
                            </div>
                          </div>
                        )}
                        <button
                          disabled={assigningById[d.id] || !selectedMediatorByDispute[d.id] || d.status === 'resolved' || d.status === 'closed'}
                          onClick={() => {
                            const msg = `You cannot reverse this action.\nAre you sure you want to change status from "${formatStatus(d.status)}" to "${formatStatus('mediation_initiated')}"?`;
                            openConfirm(msg, async () => {
                              await handleAssignMediator(d.id);
                            }, 'Assign');
                          }}
                          className={`text-xs px-3 py-1 rounded-md ${assigningById[d.id] ? 'bg-gray-300 text-gray-600' : (d.status === 'resolved' || d.status === 'closed' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#01257D] text-white hover:bg-[#2346a0] cursor-pointer')}`}
                          title={d.status === 'resolved' || d.status === 'closed' ? 'Cannot assign when dispute is resolved or closed' : ''}
                        >
                          {assigningById[d.id] ? 'Assigning…' : 'Assign'}
                        </button>
                        <button
                          className="text-xs px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                          onClick={() => navigate(`/dispute/${d.id}`)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {disputes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-3 text-center text-gray-500">No disputes found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin: My Assigned Disputes */}
      {!isSuperAdmin && isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-4 py-3 border-b border-gray-200 font-medium">My Assigned Disputes</div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">ID</th>
                  <th className="text-left font-medium px-4 py-3">Title</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Initiator</th>
                  <th className="text-left font-medium px-4 py-3">Respondent</th>
                  <th className="text-left font-medium px-4 py-3">Created</th>
                  <th className="text-left font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedDisputes.map(d => (
                  <tr key={`md-${d.id}`} className="border-t border-gray-100">
                    <td className="px-4 py-3">{d.dispute_id}</td>
                    <td className="px-4 py-3">{d.title}</td>
                    <td className="px-4 py-3">{formatStatus(d.status)}</td>
                    <td className="px-4 py-3 text-gray-500">{d.initiator}</td>
                    <td className="px-4 py-3 text-gray-500">{d.respondent}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(d.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                          onClick={() => navigate(`/dispute/${d.id}`)}
                        >
                          View
                        </button>
                        {d.status === 'mediation_initiated' && (
                          <button
                            className={`text-xs px-3 py-1 rounded-md cursor-pointer ${assigningById[`prog-${d.id}`] ? 'bg-gray-300 text-gray-600' : 'bg-[#01257D] text-white hover:bg-[#2346a0]'}`}
                            disabled={assigningById[`prog-${d.id}`]}
                            onClick={() => {
                              const msg = `You cannot reverse this action.\nAre you sure you want to change status from "${formatStatus(d.status)}" to "${formatStatus('in_progress')}"?`;
                              openConfirm(msg, async () => {
                                setAssigningById(prev => ({ ...prev, [`prog-${d.id}`]: true }));
                                await dispatch(mediatorUpdateStatus({ disputeId: d.id, newStatus: 'in_progress' }));
                                setAssigningById(prev => ({ ...prev, [`prog-${d.id}`]: false }));
                              }, 'Update');
                            }}
                          >
                            {assigningById[`prog-${d.id}`] ? 'Updating…' : 'Mark In Progress'}
                          </button>
                        )}
                        {d.status === 'in_progress' && (
                          <button
                            className={`text-xs px-3 py-1 rounded-md cursor-pointer ${assigningById[`await-${d.id}`] ? 'bg-gray-300 text-gray-600' : 'bg-[#01257D] text-white hover:bg-[#2346a0]'}`}
                            disabled={assigningById[`await-${d.id}`]}
                            onClick={() => {
                              const msg = `You cannot reverse this action.\nAre you sure you want to change status from "${formatStatus(d.status)}" to "${formatStatus('awaiting_decision')}"?`;
                              openConfirm(msg, async () => {
                                setAssigningById(prev => ({ ...prev, [`await-${d.id}`]: true }));
                                await dispatch(mediatorUpdateStatus({ disputeId: d.id, newStatus: 'awaiting_decision' }));
                                setAssigningById(prev => ({ ...prev, [`await-${d.id}`]: false }));
                              }, 'Update');
                            }}
                          >
                            {assigningById[`await-${d.id}`] ? 'Updating…' : 'Mark Awaiting Decision'}
                          </button>
                        )}
                        {d.status === 'awaiting_decision' && (
                          <>
                            <button
                              className={`text-xs px-3 py-1 rounded-md cursor-pointer ${assigningById[`res-${d.id}`] ? 'bg-gray-300 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                              disabled={assigningById[`res-${d.id}`]}
                              onClick={() => {
                                const msg = `You cannot reverse this action.\nAre you sure you want to change status from "${formatStatus(d.status)}" to "${formatStatus('resolved')}"?`;
                                openConfirm(msg, async () => {
                                  setAssigningById(prev => ({ ...prev, [`res-${d.id}`]: true }));
                                  await dispatch(mediatorUpdateStatus({ disputeId: d.id, newStatus: 'resolved' }));
                                  setAssigningById(prev => ({ ...prev, [`res-${d.id}`]: false }));
                                }, 'Update');
                              }}
                            >
                              {assigningById[`res-${d.id}`] ? 'Updating…' : 'Mark Resolved'}
                            </button>
                            <button
                              className={`text-xs px-3 py-1 rounded-md cursor-pointer ${assigningById[`close-${d.id}`] ? 'bg-gray-300 text-gray-600' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
                              disabled={assigningById[`close-${d.id}`]}
                              onClick={() => {
                                const msg = `You cannot reverse this action.\nAre you sure you want to change status from "${formatStatus(d.status)}" to "${formatStatus('closed')}"?`;
                                openConfirm(msg, async () => {
                                  setAssigningById(prev => ({ ...prev, [`close-${d.id}`]: true }));
                                  await dispatch(mediatorUpdateStatus({ disputeId: d.id, newStatus: 'closed' }));
                                  setAssigningById(prev => ({ ...prev, [`close-${d.id}`]: false }));
                                }, 'Close');
                              }}
                            >
                              {assigningById[`close-${d.id}`] ? 'Updating…' : 'Close'}
                            </button>
                          </>
                        )}
                        {d.status === 'resolved' && (
                          <button
                            className={`text-xs px-3 py-1 rounded-md cursor-pointer ${assigningById[`close-${d.id}`] ? 'bg-gray-300 text-gray-600' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
                            disabled={assigningById[`close-${d.id}`]}
                            onClick={() => {
                              const msg = `You cannot reverse this action.\nAre you sure you want to change status from "${formatStatus(d.status)}" to "${formatStatus('closed')}"?`;
                              openConfirm(msg, async () => {
                                setAssigningById(prev => ({ ...prev, [`close-${d.id}`]: true }));
                                await dispatch(mediatorUpdateStatus({ disputeId: d.id, newStatus: 'closed' }));
                                setAssigningById(prev => ({ ...prev, [`close-${d.id}`]: false }));
                              }, 'Close');
                            }}
                          >
                            {assigningById[`close-${d.id}`] ? 'Updating…' : 'Close'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {assignedDisputes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-3 text-center text-gray-500">No assigned disputes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KYC Validation */}
      {/* <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 font-medium">{t('admin.kyc_validation')}</div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">{t('admin.name')}</th>
                <th className="text-left font-medium px-4 py-3">{t('admin.document_type')}</th>
                <th className="text-left font-medium px-4 py-3">{t('admin.status')}</th>
                <th className="text-left font-medium px-4 py-3">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {overview.kycQueue?.map(row => (
                <tr key={`kyc-${row.id}`} className="border-t border-gray-100">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 text-gray-500">{row.document}</td>
                  <td className="px-4 py-3"><Pill type={row.status}>{row.status}</Pill></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-xs">
                      <button className="text-emerald-600 hover:underline cursor-pointer">{t('admin.validate')}</button>
                      <span className="text-gray-300">|</span>
                      <button className="text-rose-600 hover:underline cursor-pointer">{t('admin.reject')}</button>
                      <span className="text-gray-300">|</span>
                      <button className="text-[#01257D] hover:underline cursor-pointer">{t('admin.request_info')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> */}
    </div>
  );
}

