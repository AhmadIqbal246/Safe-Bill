import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../../store/slices/ProjectSlice';
import ProjectDetailDialogue from '../mutualComponents/Project/ProjectDetailDialogue';
import { useNavigate } from 'react-router-dom';

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

const notifications = [
  {
    icon: '+',
    text: "+ New project 'Project Alpha' created",
    time: '2 hours ago',
  },
  {
    icon: '✓',
    text: "Quote for 'Tech Solutions Inc.' approved",
    time: '5 hours ago',
  },
  {
    icon: '⏰',
    text: "Deadline approaching for 'Project Beta'",
    time: '1 day ago',
  },
  {
    icon: '$',
    text: "Payment received for 'Project Gamma'",
    time: '2 days ago',
  },
];

const statusOptions = [
  { label: 'In Progress', color: 'bg-cyan-400 text-white' },
  { label: 'Completed', color: 'bg-emerald-700 text-white' },
  { label: 'Pending', color: 'bg-gray-300 text-gray-800' },
];

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading, error } = useSelector(state => state.project);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProject, setDialogProject] = useState(null);

  useEffect(() => {
    dispatch(fetchProjects());
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

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-2 md:px-4 overflow-x-hidden box-border">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Dashboard</h1>
      {/* Responsive layout: mobile-first column, md+: row */}
      <div className="flex flex-col md:flex-row md:items-start gap-8">
        {/* Main content column for mobile, left for desktop */}
        <div className="flex-1 flex flex-col gap-6 order-1 md:order-none min-w-0">
          {/* Overview Section */}
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
              <h2 className="text-lg font-bold mb-2 sm:mb-0">Overview</h2>
              <div className="flex gap-2">
                <button className="px-5 py-2 bg-cyan-300 text-black rounded-lg font-semibold text-sm shadow hover:bg-cyan-400 transition-colors cursor-pointer">New Project</button>
                <button className="px-5 py-2 bg-[#01257D] text-white rounded-lg font-semibold text-sm shadow hover:bg-[#2346a0] transition-colors cursor-pointer">New Quote</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-w-0">
              {overviewData.map((card, idx) => (
                <div key={idx} className="rounded-lg border border-[#E6F0FA] bg-white p-5 flex flex-col items-start shadow-sm flex-1 min-w-0">
                  <div className="text-gray-500 text-sm mb-1">{card.label}</div>
                  <div className="text-2xl font-bold mb-1">{card.value}</div>
                  <div className={`text-xs font-semibold mb-2 ${card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{card.change}</div>
                  <button className="mt-auto w-full px-4 py-2 bg-[#01257D] text-white rounded font-semibold text-xs hover:bg-[#2346a0] transition-colors">{card.btn}</button>
                </div>
              ))}
            </div>
          </div>
          {/* Notifications section (mobile order: 2, desktop: right) */}
          <div className="block md:hidden">
            <div className="bg-white rounded-lg border border-[#E6F0FA] p-5 shadow-sm mt-2">
              <h2 className="text-lg font-bold mb-4">Notifications</h2>
              <div className="flex flex-col gap-4 mb-4">
                {notifications.map((n, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E6F0FA] text-[#01257D] text-lg font-bold">{n.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-800 mb-1">{n.text}</div>
                      <div className="text-xs text-gray-400">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full px-4 py-2 bg-[#01257D] text-white rounded font-semibold text-xs hover:bg-[#2346a0] transition-colors">Mark All as Read</button>
            </div>
          </div>
          {/* Upcoming Deadlines section (mobile order: 3) */}
          <div className="rounded-lg border border-[#E6F0FA] bg-white p-5 shadow-sm flex flex-col justify-between min-w-0" style={{ minHeight: 170 }}>
            <div>
              <div className="text-gray-500 text-sm mb-1">Upcoming Deadlines</div>
              <div className="text-2xl font-bold">{deadlines.count}</div>
              <div className={`text-xs font-semibold mb-4 ${deadlines.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{deadlines.change}</div>
            </div>
            <button className="w-full mt-auto px-4 py-2 bg-[#01257D] text-white rounded-full font-semibold text-xs hover:bg-[#2346a0] transition-colors">View</button>
          </div>
          {/* Recent Projects Table (mobile order: 4) */}
          <div className="mt-8 min-w-0">
            <h2 className="text-lg font-bold mb-4">Recent Projects</h2>
            <div className="overflow-x-auto rounded-lg border border-[#E6F0FA] bg-white min-w-0 max-h-96 overflow-y-auto">
              <table className="w-full min-w-[400px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Project Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Client</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-400">Loading...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={5} className="text-center py-6 text-red-500">{typeof error === 'string' ? error : 'Failed to load projects.'}</td></tr>
                  ) : sortedProjects.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-400">No projects found.</td></tr>
                  ) : (
                    sortedProjects.slice(0, maxRows).map((proj, idx) => {
                      const status = dummyStatus(idx);
                      return (
                        <tr key={proj.id} className="border-t border-gray-100">
                          <td className="px-4 py-3 whitespace-nowrap">{proj.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-blue-700 font-medium cursor-pointer hover:underline">{proj.client_email}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>{status.label}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">${parseFloat(proj.total_amount).toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button className="text-[#01257D] font-semibold hover:underline cursor-pointer" onClick={() => handleViewDetails(proj)}>View</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="px-5 py-2 bg-[#01257D] text-white rounded-lg font-semibold hover:bg-[#2346a0] transition-colors text-sm cursor-pointer"
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
            <div className="flex flex-col gap-4 mb-4">
              {notifications.map((n, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E6F0FA] text-[#01257D] text-lg font-bold">{n.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-800 mb-1">{n.text}</div>
                    <div className="text-xs text-gray-400">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full px-4 py-2 bg-[#01257D] text-white rounded font-semibold text-xs hover:bg-[#2346a0] transition-colors">Mark All as Read</button>
          </div>
        </div>
      </div>
    </div>
  );
} 