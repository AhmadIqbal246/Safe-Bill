import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDisputes } from '../store/slices/DisputeSlice';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import Sidebar from '../components/SellerDashboard/Sidebar';
import { Search, ChevronDown, Calendar, User, FileText } from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useTranslation } from 'react-i18next';

export default function SellerDisputesPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    if (!status) return t('dispute_detail.unknown');
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  if (disputesLoading) {
    return (
      <MainLayout>
        <div className="flex">
          <div className="flex-1 min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center py-12">
                <div className="text-lg text-gray-500">{t('seller_disputes.loading_disputes')}</div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (disputesError) {
    return (
      <MainLayout>
        <div className="flex">
          <div className="flex-1 min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center py-12">
                <div className="text-lg text-red-500">
                  {typeof disputesError === 'string' ? disputesError : t('seller_disputes.failed_load_disputes')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
        <MainLayout>
      <div className="flex">
        <div className="flex-1 min-h-screen bg-gray-50 p-2 sm:p-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-4 sm:mb-6 px-2 sm:px-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{t('seller_disputes.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600">{t('seller_disputes.subtitle')}</p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 mx-2 sm:mx-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder={t('seller_disputes.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] transition-colors"
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden mx-2 sm:mx-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('seller_disputes.dispute_id')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('seller_disputes.title_label')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('seller_disputes.project')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('seller_disputes.parties')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('seller_disputes.status')}
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center gap-1">
                          {t('seller_disputes.created_at')}
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
                          <div className="space-y-1">
                            <div>{t('seller_disputes.initiator')}: {dispute.initiator_name}</div>
                            <div>{t('seller_disputes.respondent')}: {dispute.respondent_name}</div>
                          </div>
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
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 mx-2 sm:mx-0">
              {filteredAndSortedDisputes.map((dispute) => (
                <div 
                  key={dispute.id}
                  className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/dispute/${dispute.id}`)}
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <span className="text-[#01257D] font-semibold text-sm sm:text-base">
                      {dispute.dispute_id}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${getStatusColor(dispute.status)}`}>
                      {getStatusText(dispute.status)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-3 line-clamp-2">
                    {dispute.title}
                  </h3>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    {/* Project */}
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-500">{t('seller_disputes.project')}:</span>
                        <div className="text-gray-900 font-medium">
                          {dispute.project_name}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-500">{t('seller_disputes.created')}:</span>
                        <div className="text-gray-900 font-medium">
                          {formatDate(dispute.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Initiator */}
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-500">{t('seller_disputes.initiator')}:</span>
                        <div className="text-gray-900 font-medium">
                          {dispute.initiator_name}
                        </div>
                      </div>
                    </div>

                    {/* Respondent */}
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-500">{t('seller_disputes.respondent')}:</span>
                        <div className="text-gray-900 font-medium">
                          {dispute.respondent_name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Empty State */}
            {filteredAndSortedDisputes.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm mx-2 sm:mx-0">
                <div className="text-center py-12">
                  <div className="text-gray-500 text-sm sm:text-base">
                    {searchTerm ? t('seller_disputes.no_disputes_matching_search') : t('seller_disputes.no_disputes_found')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </MainLayout>
  );
}