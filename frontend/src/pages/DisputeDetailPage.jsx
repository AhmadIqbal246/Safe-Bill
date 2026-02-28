import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDisputeDetail } from '../store/slices/DisputeSlice';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import { Dialog } from '@headlessui/react';
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Calendar, 
  AlertTriangle,
  Download,
  MessageCircle,
  Clock,
  CheckCircle,
  UserCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DisputeDetailPage() {
  const { t } = useTranslation();
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // View description dialog state
  const [viewDescriptionDialogOpen, setViewDescriptionDialogOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');
  
  const {
    disputeDetail,
    disputeDetailLoading,
    disputeDetailError
  } = useSelector(state => state.dispute);

  // Detect admin view
  const user = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
  const userData = user ? JSON.parse(user) : null;
  const isAdminView = userData?.role === 'admin' || userData?.role === 'super-admin' || userData?.is_admin;

  useEffect(() => {
    if (disputeId) {
      dispatch(fetchDisputeDetail(disputeId));
    }
  }, [dispatch, disputeId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  const getDisputeTypeText = (type) => {
    if (!type) return t('dispute_detail.unknown');
    return type.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'submitted': return <FileText className="w-5 h-5" />;
      case 'mediator_assigned': return <UserCheck className="w-5 h-5" />;
      case 'status_changed': return <AlertTriangle className="w-5 h-5" />;
      case 'comment_added': return <MessageCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const handleViewDescription = (description) => {
    setSelectedDescription(description);
    setViewDescriptionDialogOpen(true);
  };

  if (disputeDetailLoading) {
    return (
      <>
        <SafeBillHeader />
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-lg text-gray-500">{t('dispute_detail.loading_dispute_details')}</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (disputeDetailError) {
    return (
      <>
        <SafeBillHeader />
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-lg text-red-500">
                {typeof disputeDetailError === 'string' ? disputeDetailError : t('dispute_detail.failed_load_dispute_details')}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!disputeDetail) {
    return (
      <>
        <SafeBillHeader />
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-lg text-gray-500">{t('dispute_detail.dispute_not_found')}</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const dispute = disputeDetail;

  return (
    <>
      <SafeBillHeader />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => isAdminView ? navigate('/admin') : navigate(-1)}
            className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {isAdminView ? 'Back to Admin Panel' : t('dispute_detail.back_to_disputes')}
          </button>

          {/* Dispute Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {dispute.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">ID:</span>
                    <span className="text-[#01257D]">{dispute.dispute_id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {formatDate(dispute.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
                  {getStatusText(dispute.status)}
                </span>
                {/* {!isAdminView && (
                  <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] transition-colors cursor-pointer">
                    {t('dispute_detail.contact_mediator')}
                  </button>
                )} */}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Dispute Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dispute Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dispute_detail.dispute_information')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('dispute_detail.description')}</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {dispute.description.length > 150 ? (
                        <>
                          <p className="text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                            {dispute.description.substring(0, 150)}...
                          </p>
                          <button
                            onClick={() => handleViewDescription(dispute.description)}
                            className="text-blue-600 underline text-sm hover:text-blue-800 mt-2 cursor-pointer"
                          >
                            {t('dispute_detail.view_full_description')}
                          </button>
                        </>
                      ) : (
                        <p className="text-gray-900 break-words max-w-full">
                          {dispute.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('dispute_detail.nature_of_dispute')}</label>
                      <p className="text-gray-900">{getDisputeTypeText(dispute.dispute_type)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('disputes.project')}</label>
                      <p className="text-gray-900">{dispute.project?.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('disputes.initiator')}</label>
                      <p className="text-gray-900">{dispute.initiator_name}</p>
                    </div>
                    <div>
                      <label className="block text_sm text-sm font-medium text-gray-700 mb-1">{t('disputes.respondent')}</label>
                      <p className="text-gray-900">{dispute.respondent_name}</p>
                    </div>
                  </div>

                  {dispute.assigned_mediator && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('dispute_detail.assigned_mediator')}</label>
                      <p className="text-gray-900">{dispute.mediator_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Supporting Documents */}
              {dispute.documents && dispute.documents.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dispute_detail.supporting_documents')}</h2>
                  <div className="space-y-3">
                    {dispute.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify_between justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                            <p className="text-xs text-gray-500">{t('dispute_detail.uploaded_by')} {doc.uploaded_by}</p>
                          </div>
                        </div>
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#01257D] hover:text-[#2346a0] text-sm flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          {t('project_detail.download')}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {dispute.comments && dispute.comments.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dispute_detail.comments')}</h2>
                  <div className="space-y-4">
                    {dispute.comments.map((comment) => (
                      <div key={comment.id} className="border-l-4 border-[#01257D] pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{comment.author_name}</span>
                          <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Tracking */}
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dispute_detail.tracking')}</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{t('disputes.status')}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                      {getStatusText(dispute.status)}
                    </span>
                  </div>
                  
                  {dispute.assigned_mediator && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{t('dispute_detail.assigned_mediator')}</span>
                      <span className="text-sm text-gray-900">{dispute.mediator_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* History Timeline */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dispute_detail.history')}</h3>
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  {/* Timeline Events */}
                  <div className="space-y-4">
                    {dispute.events && dispute.events.map((event) => (
                      <div key={event.id} className="relative flex items-start gap-4">
                        {/* Event Icon */}
                        <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-[#01257D] rounded-full text-white">
                          {getEventIcon(event.event_type)}
                        </div>
                        
                        {/* Event Content */}
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-medium text-gray-900">{event.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(event.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resolution Details */}
              {dispute.resolution_details && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dispute_detail.resolution')}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('dispute_detail.resolution_details')}</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">{dispute.resolution_details}</p>
                    </div>
                    
                    {dispute.resolution_amount && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dispute_detail.resolution_amount')}</label>
                        <p className="text-gray-900 font-medium">${dispute.resolution_amount}</p>
                      </div>
                    )}
                    
                    {dispute.resolved_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dispute_detail.resolved_date')}</label>
                        <p className="text-gray-900">{formatDate(dispute.resolved_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Description Dialog */}
      <Dialog
        open={viewDescriptionDialogOpen}
        onClose={() => setViewDescriptionDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-[#01257D] mb-4">
              {t('dispute_detail.dispute_description')}
            </Dialog.Title>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                  {selectedDescription}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-[#01257D] text-white font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer"
                onClick={() => setViewDescriptionDialogOpen(false)}
              >
                {t('dispute_detail.close')}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
} 