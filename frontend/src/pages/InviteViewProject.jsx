import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import axios from 'axios';
import ProjectStatusBadge from '../components/common/ProjectStatusBadge';

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
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchProject = async () => {
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
  };

  useEffect(() => {
    if (token) fetchProject();
  }, [token]);

  const handleProjectAction = async (action) => {
    setActionLoading(true);
    setActionMessage('');
    setError(null);
    
    try {
      const res = await axios.post(
        `${backendBaseUrl}api/projects/invite/${token}/`,
        { action },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('access')}`,
          },
          withCredentials: true,
        }
      );
      
      setActionMessage(res.data.detail);
      
      // Refresh project data to get updated status
      setTimeout(() => {
        fetchProject();
      }, 1000);
      
    } catch (err) {
      setError(
        err.response && err.response.data && err.response.data.detail
          ? err.response.data.detail
          : err.message
      );
    } finally {
      setActionLoading(false);
    }
  };

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
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-8">Review and Pay</h1>

        {/* Project Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Project Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-2">
            <div>
              <div className="text-xs text-gray-400 font-semibold mb-1">Project Name</div>
              <div className="text-gray-900 font-medium">{project.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-semibold mb-1">Client Email</div>
              <div className="text-gray-900 font-medium">{project.client_email}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-semibold mb-1">Created At</div>
              <div className="text-gray-900 font-medium">{project.created_at}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-semibold mb-1">Reference Number</div>
              <div className="text-gray-900 font-medium">{project.reference_number}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-semibold mb-1">Status</div>
              <ProjectStatusBadge status={project.status} size="small" />
            </div>
          </div>
        </div>

        {/* Quote Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Quote</h2>
          <div className="flex flex-col items-center justify-center bg-[#F6F0F0] rounded-xl p-8 min-h-[400px]">
            {project.quote?.file ? (
              <div className="w-full text-center">
                {/* PDF Preview Container */}
                <div className="bg-white rounded-lg p-6 mb-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-gray-700 mb-4">
                    <div className="font-semibold text-lg mb-2">Quote Document</div>
                    <div className="text-sm text-gray-500">Click below to view the full PDF document</div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={getQuoteFileUrl(project.quote.file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Quote PDF
                  </a>
                  <a
                    href={getQuoteFileUrl(project.quote.file)}
                    download
                    className="px-6 py-3 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">No quote file available.</div>
            )}
          </div>
        </div>

        {/* Payment Validation Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Payment Validation</h2>
          <div className="mb-4">
            <div className="text-xs text-gray-400 font-semibold mb-1">Total Amount</div>
            <div className="text-gray-900 font-bold text-lg mb-2">${project.total_amount?.toLocaleString()}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
            {project.installments?.map((inst, idx) => (
              <div key={idx} className="bg-[#F6F0F0] rounded-lg p-4">
                <div className="font-semibold mb-1">Installment {idx + 1}</div>
                <div className="text-gray-900 font-medium mb-1">${parseFloat(inst.amount).toLocaleString()}</div>
                <div className="text-xs text-gray-500 mb-1">{inst.step}</div>
                <div className="text-xs text-gray-400">{inst.description}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center mb-4">
            <input type="checkbox" id="terms" className="mr-2" />
            <label htmlFor="terms" className="text-sm text-gray-700">I agree to the terms and conditions of this project and payment schedule.</label>
          </div>
          {/* <div className="flex gap-4">
            <button className="px-6 py-2 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors">Pay by Card</button>
            <button className="px-6 py-2 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 transition-colors">Pay by Bank Transfer</button>
          </div> */}
        </div>
        {/* Project Action Buttons */}
        {project.status === 'pending' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Project Approval</h2>
            <p className="text-gray-600 mb-6">
              Please review the project details above. You can either approve or reject this project.
            </p>
            
            {actionMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                actionMessage.includes('approved') ? 'bg-green-100 text-green-800' :
                actionMessage.includes('rejected') ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {actionMessage}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleProjectAction('approve')}
                disabled={actionLoading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve Project
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleProjectAction('reject')}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 0 018-8v8z"/>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject Project
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Status Messages for Non-Pending Projects */}
        {project.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Project Approved</h3>
                <p className="text-green-700">This project has been approved and is now active.</p>
              </div>
            </div>
          </div>
        )}
        
        {project.status === 'not_approved' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Project Rejected</h3>
                <p className="text-red-700">This project has been rejected and is no longer active.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center text-xs text-gray-400 mt-6">Secured with SSL encryption and processed through Stripe</div>
      </div>
    </>
  );
}
