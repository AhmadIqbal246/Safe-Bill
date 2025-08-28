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
    professionals: [
      { id: 1, name: 'Sophia Clark', email: 'sophia.clark@example.com', status: 'Active' },
      { id: 2, name: 'Ethan Carter', email: 'ethan.carter@example.com', status: 'Inactive' },
      { id: 3, name: 'Olivia Bennett', email: 'olivia.bennett@example.com', status: 'Active' },
      { id: 4, name: 'Liam Foster', email: 'liam.foster@example.com', status: 'Active' },
      { id: 5, name: 'Ava Harper', email: 'ava.harper@example.com', status: 'Inactive' },
    ],
    clients: [
      { id: 11, name: 'Noah Turner', email: 'noah.turner@example.com', status: 'Active' },
      { id: 12, name: 'Isabella Reed', email: 'isabella.reed@example.com', status: 'Active' },
      { id: 13, name: 'Jackson Hayes', email: 'jackson.hayes@example.com', status: 'Inactive' },
    ],
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
  const staticData = useStaticAdminData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(staticData);
  const [professionals, setProfessionals] = useState(staticData.professionals);
  const [clients, setClients] = useState(staticData.clients);
  const [currentAdmins, setCurrentAdmins] = useState([]);
  const [tab, setTab] = useState('professionals');
  const [search, setSearch] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const user = sessionStorage.getItem('user');
  const userData = JSON.parse(user);
  setIsSuperAdmin(userData.role === 'super-admin');

  useEffect(() => {
    const access = sessionStorage.getItem('access');
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const headers = access ? { Authorization: `Bearer ${access}` } : {};

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Overview
        const o = await fetch(`${BASE_URL}api/admin/overview/`, { headers });
        if (o.ok) {
          const json = await o.json();
          setOverview({
            ...staticData,
            kpis: json.kpis,
            registrationTrend: json.registrationTrend,
            revenueBars: json.revenueBars,
          });
        }

        // Users
        const [proRes, clientRes] = await Promise.all([
          fetch(`${BASE_URL}api/admin/users/?role=seller`, { headers }),
          fetch(`${BASE_URL}api/admin/users/?role=buyer`, { headers }),
        ]);
        
        if (proRes.ok) {
          const j = await proRes.json();
          setProfessionals(j.results || staticData.professionals);
        }
        if (clientRes.ok) {
          const j = await clientRes.json();
          setClients(j.results || staticData.clients);
        }

        // Current admins (only for super-admin)
        if (isSuperAdmin) {
          const adminsRes = await fetch(`${BASE_URL}api/admin/super-admin/current-admins/`, { headers });
          if (adminsRes.ok) {
            const adminsData = await adminsRes.json();
            setCurrentAdmins(adminsData.results || []);
          }
        }
      } catch (e) {
        setError('Failed to load admin overview');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [staticData, isSuperAdmin]);

  const handleAdminToggle = async (userId, newAdminStatus) => {
    const access = sessionStorage.getItem('access');
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const headers = {
      'Authorization': `Bearer ${access}`,
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(`${BASE_URL}api/admin/super-admin/manage-admin/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          is_admin: newAdminStatus
        })
      });

      if (response.ok) {
        // Update the user in the appropriate list
        const updateUserInList = (list, setList) => {
          setList(prev => prev.map(user => 
            user.id === userId ? { ...user, is_admin: newAdminStatus } : user
          ));
        };

        updateUserInList(professionals, setProfessionals);
        updateUserInList(clients, setClients);

        // Refresh current admins list
        const adminsRes = await fetch(`${BASE_URL}api/admin/super-admin/current-admins/`, { 
          headers: { Authorization: `Bearer ${access}` } 
        });
        if (adminsRes.ok) {
          const adminsData = await adminsRes.json();
          setCurrentAdmins(adminsData.results || []);
        }
      } else {
        console.error('Failed to update admin status');
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
    }
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
        <StatCard title={t('admin.user_count')} value={overview.kpis.userCount} />
        <StatCard title={t('admin.transactions')} value={overview.kpis.transactions} />
        <StatCard title={t('admin.disputes')} value={overview.kpis.disputes} />
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
              {overview.kycQueue.map(row => (
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

