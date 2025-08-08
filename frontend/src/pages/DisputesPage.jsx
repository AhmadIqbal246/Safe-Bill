import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDisputes } from '../store/slices/DisputeSlice';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import { Search, ChevronDown } from 'lucide-react';

export default function DisputesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const {
    disputes,
    disputesLoading,
    disputesError
  } = useSelector(state => state.dispute);

  useEffect(() => {
    dispatch(fetchDisputes());
  }, [dispatch]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedDisputes = disputes
    .filter(dispute => 
      dispute.dispute_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.initiator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.respondent_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue?.toString().toLowerCase();
        bValue = bValue?.toString().toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  if (disputesLoading) {
    return (
      <>
        <SafeBillHeader />
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-lg text-gray-500">Loading disputes...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (disputesError) {
    return (
      <>
        <SafeBillHeader />
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-lg text-red-500">
                Error: {typeof disputesError === 'string' ? disputesError : 'Failed to load disputes'}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SafeBillHeader />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Disputes</h1>
              <p className="text-gray-600">Manage and track your disputes</p>
            </div>
            <button
              onClick={() => navigate('/dispute-submit')}
              className="mt-4 sm:mt-0 px-6 py-3 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] transition-colors font-medium cursor-pointer"
            >
              Create New Dispute
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search disputes by ID, title, project, or parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] transition-colors"
              />
            </div>
          </div>

          {/* Disputes Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispute ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Initiator
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Respondent
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Created At
                        <ChevronDown className={`w-4 h-4 transition-transform ${sortField === 'created_at' && sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedDisputes.map((dispute) => (
                    <tr 
                      key={dispute.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/dispute/${dispute.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#01257D] font-medium hover:underline">
                          {dispute.dispute_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispute.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispute.project_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispute.initiator_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispute.respondent_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                          {getStatusText(dispute.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(dispute.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredAndSortedDisputes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {searchTerm ? 'No disputes found matching your search.' : 'No disputes found.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 