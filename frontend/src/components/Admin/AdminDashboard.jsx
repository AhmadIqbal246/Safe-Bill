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
} from '../../store/slices/AdminSlice';

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

export default function AdminDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const staticData = useStaticAdminData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('professionals');
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [selectedMediatorByDispute, setSelectedMediatorByDispute] = useState({});

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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          dispatch(fetchOverview()),
          dispatch(fetchUsersByRole('seller')),
          dispatch(fetchUsersByRole('buyer')),
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
      } catch (e) {
        setError('Failed to load admin overview');
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

  const handleAssignMediator = async (disputeId) => {
    const mediatorId = selectedMediatorByDispute[disputeId];
    if (!mediatorId) return;
    setAssigning(true);
    await dispatch(assignMediator({ disputeId, mediatorId }));
    setAssigning(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6">
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
        <StatCard title={t('admin.transactions')} value={overview.kpis.transactions || 0} />
        <StatCard title={t('admin.disputes')} value={overview.kpis.disputes || 0} />
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
              <BarChart data={overview.revenueBars} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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
                    <td className="px-4 py-3">{d.status}</td>
                    <td className="px-4 py-3 text-gray-500">{d.initiator}</td>
                    <td className="px-4 py-3 text-gray-500">{d.respondent}</td>
                    <td className="px-4 py-3">{d.assigned_mediator || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          className="px-2 py-1 border rounded-md text-sm"
                          value={selectedMediatorByDispute[d.id] || ''}
                          onChange={(e) => setSelectedMediatorByDispute(prev => ({ ...prev, [d.id]: Number(e.target.value) }))}
                        >
                          <option value="">Select mediator…</option>
                          {currentAdmins.map(a => (
                            <option key={`opt-${a.id}`} value={a.id}>{a.name} ({a.email})</option>
                          ))}
                        </select>
                        <button
                          disabled={assigning || !selectedMediatorByDispute[d.id]}
                          onClick={() => handleAssignMediator(d.id)}
                          className={`text-xs px-3 py-1 rounded-md cursor-pointer ${assigning ? 'bg-gray-300 text-gray-600' : 'bg-[#01257D] text-white hover:bg-[#2346a0]'}`}
                        >
                          Assign
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
                </tr>
              </thead>
              <tbody>
                {assignedDisputes.map(d => (
                  <tr key={`md-${d.id}`} className="border-t border-gray-100">
                    <td className="px-4 py-3">{d.dispute_id}</td>
                    <td className="px-4 py-3">{d.title}</td>
                    <td className="px-4 py-3">{d.status}</td>
                    <td className="px-4 py-3 text-gray-500">{d.initiator}</td>
                    <td className="px-4 py-3 text-gray-500">{d.respondent}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(d.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {assignedDisputes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-3 text-center text-gray-500">No assigned disputes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KYC Validation */}
      <div className="bg-white rounded-xl border border-gray-200">
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
      </div>
    </div>
  );
}

