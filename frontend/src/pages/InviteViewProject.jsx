import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import axios from 'axios';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const backendBaseUrl = import.meta.env.VITE_API_BASE_URL;

function getQuoteFileUrl(file) {
  if (!file) return '#';
  if (file.startsWith('http')) return file;
  return backendBaseUrl.replace(/\/$/, '') + file;
}

export default function InviteViewProject() {
  const query = useQuery();
  const token = query.get('token');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${backendBaseUrl}api/projects/invite/${token}/`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionStorage.getItem('access')}`,
            },
            withCredentials: true,
          }
        );
        setProject(res.data);
      } catch (err) {
        setError(
          err.response && err.response.data && err.response.data.detail
            ? err.response.data.detail
            : err.message
        );
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchProject();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-500">No project data to display.</div>
      </div>
    );
  }

  return (
    <>
      <SafeBillHeader />
      <div className="max-w-3xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold mb-2 text-[#01257D]">{project.name}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
            <span>Reference: <span className="font-semibold">{project.reference_number}</span></span>
            <span>Created: {project.created_at}</span>
          </div>
        </div>

        {/* Client Email */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-1">Client Email</h2>
          <div className="bg-gray-50 rounded px-4 py-2 text-gray-800 border border-gray-200 inline-block">
            {project.client_email}
          </div>
        </div>

        {/* Quote Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-1">Signed Quote</h2>
          <div className="flex items-center gap-4">
            <a
              href={getQuoteFileUrl(project.quote?.file)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors text-sm"
            >
              View Quote PDF
            </a>
            <span className="text-gray-600 text-sm">
              Reference: <span className="font-medium">{project.quote?.reference_number}</span>
            </span>
          </div>
        </div>

        {/* Installments Table */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Payment Installments</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#E6F0FA]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Trigger Step</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {project.installments?.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-3">${parseFloat(row.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#01257D] font-medium">{row.step}</td>
                    <td className="px-4 py-3 text-gray-600">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex justify-end">
          <div className="bg-cyan-100 text-cyan-900 px-6 py-3 rounded-xl text-lg font-bold shadow">
            Total: ${project.total_amount?.toLocaleString()}
          </div>
        </div>
      </div>
    </>
  );
}
