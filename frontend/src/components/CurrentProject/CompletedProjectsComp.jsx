import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../../store/slices/ProjectSlice';

const getRandomDate = () => {
  // Generate a random date in 2022-2025 for demo
  const start = new Date(2022, 0, 1);
  const end = new Date(2025, 11, 31);
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().slice(0, 10);
};

export default function CompletedProjectsComp() {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector(state => state.project);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [clientFilter, setClientFilter] = useState('All');
  const pageSize = 4;

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Extract unique clients for filter
  const clientOptions = ['All', ...Array.from(new Set((projects || []).map(p => p.client_email)))];

  // Add a static/random completion date for demo
  const projectsWithDate = (projects || []).map((p, idx) => ({
    ...p,
    completion_date: getRandomDate(),
  }));

  // Filter by client
  const filtered = clientFilter === 'All'
    ? projectsWithDate
    : projectsWithDate.filter(p => p.client_email === clientFilter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.completion_date) - new Date(a.completion_date);
    }
    if (sortBy === 'client') {
      return a.client_email.localeCompare(b.client_email);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Completed Projects</h1>
      <p className="text-gray-500 mb-6 max-w-2xl">Explore a selection of projects successfully completed by our team, showcasing our expertise and commitment to quality.</p>
      {/* Sort & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 bg-[#E6F0FA] text-[#01257D] rounded-md font-semibold text-sm flex items-center gap-2 ${sortBy === 'date' ? 'ring-2 ring-[#01257D]' : ''}`}
            onClick={() => setSortBy('date')}
          >
            Sort by Date <span className="ml-1">▼</span>
          </button>
          <button
            className={`px-4 py-2 bg-[#E6F0FA] text-[#01257D] rounded-md font-semibold text-sm flex items-center gap-2 ${sortBy === 'client' ? 'ring-2 ring-[#01257D]' : ''}`}
            onClick={() => setSortBy('client')}
          >
            Filter by Client <span className="ml-1">▼</span>
          </button>
          {/* <select
            className="ml-2 px-2 py-1 rounded border border-gray-200 text-sm"
            value={clientFilter}
            onChange={e => { setClientFilter(e.target.value); setPage(1); }}
          >
            {clientOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select> */}
        </div>
      </div>
      <div className="mb-2 font-semibold">Projects</div>
      <div className="overflow-x-auto rounded-lg border border-[#E6F0FA] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#E6F0FA]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Project Title</th>
              <th className="px-4 py-3 text-left font-semibold">Client Name</th>
              <th className="px-4 py-3 text-left font-semibold">Price</th>
              <th className="px-4 py-3 text-left font-semibold">Completion Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-6 text-gray-400">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={4} className="text-center py-6 text-red-500">{typeof error === 'string' ? error : 'Failed to load projects.'}</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-6 text-gray-400">No projects found.</td></tr>
            ) : (
              paginated.map((proj, idx) => (
                <tr key={proj.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 whitespace-normal max-w-xs">{proj.name}</td>
                  <td className="px-4 py-3 text-blue-700 font-medium whitespace-nowrap cursor-pointer hover:underline">{proj.client_email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">${parseFloat(proj.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{proj.completion_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E6F0FA] text-[#01257D] font-bold text-lg disabled:opacity-50"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          {'<'}
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`w-8 h-8 flex items-center justify-center rounded-full font-semibold text-sm ${page === p ? 'bg-[#E6F0FA] text-[#01257D]' : 'text-gray-700'}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E6F0FA] text-[#01257D] font-bold text-lg disabled:opacity-50"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
        >
          {'>'}
        </button>
      </div>
    </div>
  );
}