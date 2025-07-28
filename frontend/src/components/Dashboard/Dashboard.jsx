import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../../store/slices/ProjectSlice';
import ProjectDetailDialogue from '../mutualComponents/Project/ProjectDetailDialogue';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationRead } from '../../store/slices/NotificationSlice';
import { CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const overviewData = [
  {
    label: 'Pending Quotes',
    value: 12,
    change: '+10%',
    color: 'bg-white',
    btn: 'View',
  },
  {
    label: 'Current Projects',
    value: 8,
    change: '+5%',
    color: 'bg-white',
    btn: 'View',
  },
  {
    label: 'Monthly Revenue',
    value: '$25,000',
    change: '+15%',
    color: 'bg-white',
    btn: 'View',
  },
];

const deadlines = {
  count: 3,
  change: '-2%',
};

// Icon selection based on message content (simple heuristic)
function getNotificationIcon(message) {
  if (message.toLowerCase().includes('project')) return '+';
  if (message.toLowerCase().includes('approved')) return '✓';
  if (message.toLowerCase().includes('deadline')) return '⏰';
  if (message.toLowerCase().includes('payment')) return '$';
  return '!';
}

const statusOptions = [
  { label: 'In Progress', color: 'bg-cyan-400 text-white' },
  { label: 'Completed', color: 'bg-emerald-700 text-white' },
  { label: 'Pending', color: 'bg-gray-300 text-gray-800' },
];

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading, error } = useSelector(state => state.project);
  const { notifications, loading: notifLoading, error: notifError } = useSelector(state => state.notifications);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProject, setDialogProject] = useState(null);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Sort projects by created_at descending (most recent first)
  const sortedProjects = (projects || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  // Show up to 7 projects in the table, scroll if more
  const maxRows = 7;
  const dummyStatus = idx => statusOptions[idx % statusOptions.length];

  const handleViewDetails = (project) => {
    setDialogProject(project);
    setDialogOpen(true);
  };

  // Notification UI rendering (shared for mobile and desktop)
  function renderNotifications(list = notifications) {
    if (notifLoading) {
      return <div className="text-center text-gray-400 text-xs sm:text-sm">Loading...</div>;
    }
    if (notifError) {
      return <div className="text-center text-red-500 text-xs sm:text-sm">{notifError}</div>;
    }
    if (!list || list.length === 0) {
      return <div className="text-center text-gray-400 text-xs sm:text-sm">No notifications.</div>;
    }
    return list.map((n) => (
      <div key={n.id} className="flex items-start gap-2 sm:gap-3">
        <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full ${n.is_read ? 'bg-gray-200 text-gray-400' : 'bg-[#E6F0FA] text-[#01257D]'} text-sm sm:text-lg font-bold flex-shrink-0`}>
          {getNotificationIcon(n.message)}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className={`text-xs sm:text-sm ${n.is_read ? 'text-gray-400' : 'text-gray-800'} break-words`}>{n.message}</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
          </div>
        </div>
        {!n.is_read && (
          <button
            className="ml-1 sm:ml-2 text-green-600 hover:text-green-800 self-center flex-shrink-0"
            title="Mark as read"
            onClick={() => dispatch(markNotificationRead(n.id))}
          >
            <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}
      </div>
    ));
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-8 px-1 sm:px-2 md:px-4 overflow-x-hidden box-border">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Dashboard</h1>
      {/* Responsive layout: mobile-first column, md+: row */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 sm:gap-8">
        {/* Main content column for mobile, left for desktop */}
        <div className="flex-1 flex flex-col gap-4 sm:gap-6 order-1 md:order-none min-w-0 w-full">
          {/* Overview Section */}
          <div className="flex flex-col gap-2 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
              <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-0">Overview</h2>
              <div className="flex gap-2">
                <button onClick={() => navigate('/project-creation')} className="px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 bg-[#01257D] text-white rounded-lg font-semibold text-xs sm:text-sm shadow hover:bg-[#2346a0] transition-colors cursor-pointer">New Quote</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 min-w-0 w-full">
              {overviewData.map((card, idx) => (
                <div key={idx} className="rounded-lg border border-[#E6F0FA] bg-white p-2 sm:p-3 md:p-5 flex flex-col items-start shadow-sm flex-1 min-w-0">
                  <div className="text-gray-500 text-xs sm:text-sm mb-1 w-full">{card.label}</div>
                  <div className="text-base sm:text-lg md:text-2xl font-bold mb-1">{card.value}</div>
                  <div className={`text-xs font-semibold mb-2 ${card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{card.change}</div>
                  <button className="mt-auto w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-[#01257D] text-white rounded font-semibold text-xs hover:bg-[#2346a0] transition-colors">{card.btn}</button>
                </div>
              ))}
            </div>
          </div>
          {/* Notifications section (mobile order: 2, desktop: right) */}
          <div className="block md:hidden w-full">
            <div className="bg-white rounded-lg border border-[#E6F0FA] p-2 sm:p-3 md:p-5 shadow-sm mt-2 w-full">
              <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Notifications</h2>
              <div className="flex flex-col gap-3 sm:gap-4 mb-4 max-h-40 sm:max-h-48 md:max-h-64 overflow-y-auto w-full">
                {renderNotifications(notifications.slice(0, 5))}
              </div>
              {/* Optionally, add a mark all as read button here */}
            </div>
          </div>
          {/* Upcoming Deadlines section (mobile order: 3) */}
          <div className="rounded-lg border border-[#E6F0FA] bg-white p-2 sm:p-3 md:p-5 shadow-sm flex flex-col justify-between min-w-0 w-full" style={{ minHeight: '120px' }}>
            <div>
              <div className="text-gray-500 text-xs sm:text-sm mb-1">Upcoming Deadlines</div>
              <div className="text-base sm:text-lg md:text-2xl font-bold">{deadlines.count}</div>
              <div className={`text-xs font-semibold mb-3 sm:mb-4 ${deadlines.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{deadlines.change}</div>
            </div>
            <button className="w-full mt-auto px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-[#01257D] text-white rounded-full font-semibold text-xs hover:bg-[#2346a0] transition-colors">View</button>
          </div>
          {/* Recent Projects Table (mobile order: 4) */}
          <div className="mt-6 sm:mt-8 min-w-0 w-full">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Recent Projects</h2>
            <div className="overflow-x-auto rounded-lg border border-[#E6F0FA] bg-white min-w-0 w-full">
              <div className="max-h-40 sm:max-h-48 md:max-h-64 overflow-y-auto w-full">
                <table className="w-full min-w-[280px] sm:min-w-[350px] md:min-w-[400px] text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 text-left font-semibold">Project Name</th>
                      <th className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 text-left font-semibold">Client</th>
                      <th className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 text-left font-semibold">Status</th>
                      <th className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 text-left font-semibold">Amount</th>
                      <th className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-4 sm:py-6 text-gray-400 text-xs sm:text-sm">Loading...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={5} className="text-center py-4 sm:py-6 text-red-500 text-xs sm:text-sm">{typeof error === 'string' ? error : 'Failed to load projects.'}</td></tr>
                    ) : sortedProjects.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-4 sm:py-6 text-gray-400 text-xs sm:text-sm">No projects found.</td></tr>
                    ) : (
                      sortedProjects.slice(0, 5).map((proj, idx) => {
                        const status = dummyStatus(idx);
                        return (
                          <tr key={proj.id} className="border-t border-gray-100">
                            <td className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm max-w-[80px] sm:max-w-none truncate">{proj.name}</td>
                            <td className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 whitespace-nowrap text-blue-700 font-medium cursor-pointer hover:underline text-xs sm:text-sm max-w-[80px] sm:max-w-none truncate">{proj.client_email}</td>
                            <td className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 whitespace-nowrap">
                              <span className={`inline-block px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${status.color}`}>{status.label}</span>
                            </td>
                            <td className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm">${parseFloat(proj.total_amount).toLocaleString()}</td>
                            <td className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 whitespace-nowrap">
                              <button className="text-[#01257D] font-semibold hover:underline cursor-pointer text-xs sm:text-sm" onClick={() => handleViewDetails(proj)}>View</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end mt-3 sm:mt-4">
              <button
                className="px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 bg-[#01257D] text-white rounded-lg font-semibold hover:bg-[#2346a0] transition-colors text-xs sm:text-sm cursor-pointer"
                onClick={() => navigate('/current-projects')}
              >
                View All Projects
              </button>
            </div>
          </div>
          {/* Project Detail Dialog */}
          <ProjectDetailDialogue
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            project={dialogProject}
          />
        </div>
        {/* Right: Notifications (desktop only) */}
        <div className="hidden md:block w-full md:w-80 flex-shrink-0 md:ml-8 mt-8 md:mt-0 order-2 md:order-none">
          <div className="bg-white rounded-lg border border-[#E6F0FA] p-5 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Notifications</h2>
            <div className="flex flex-col gap-4 mb-4 max-h-64 overflow-y-auto">
              {renderNotifications(notifications.slice(0, 5))}
            </div>
            {/* Optionally, add a mark all as read button here */}
          </div>
        </div>
      </div>
    </div>
  );
} 