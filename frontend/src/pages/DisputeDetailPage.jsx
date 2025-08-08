import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDisputeDetail } from '../store/slices/DisputeSlice';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
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

export default function DisputeDetailPage() {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const {
    disputeDetail,
    disputeDetailLoading,
    disputeDetailError
  } = useSelector(state => state.dispute);

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
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const getDisputeTypeText = (type) => {
    if (!type) return 'Unknown';
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

  if (disputeDetailLoading) {
    return (
      <>
        <SafeBillHeader />
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-lg text-gray-500">Loading dispute details...</div>
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
                Error: {typeof disputeDetailError === 'string' ? disputeDetailError : 'Failed to load dispute details'}
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
              <div className="text-lg text-gray-500">Dispute not found</div>
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
            onClick={() => navigate(-1)}
            className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Disputes
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
                <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] transition-colors cursor-pointer">
                  Contact Mediator
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Dispute Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dispute Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Dispute Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{dispute.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Dispute</label>
                      <p className="text-gray-900">{getDisputeTypeText(dispute.dispute_type)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                      <p className="text-gray-900">{dispute.project?.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Initiator</label>
                      <p className="text-gray-900">{dispute.initiator_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Respondent</label>
                      <p className="text-gray-900">{dispute.respondent_name}</p>
                    </div>
                  </div>

                  {dispute.assigned_mediator && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Mediator</label>
                      <p className="text-gray-900">{dispute.mediator_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Supporting Documents */}
              {dispute.documents && dispute.documents.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Supporting Documents</h2>
                  <div className="space-y-3">
                    {dispute.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                            <p className="text-xs text-gray-500">Uploaded by {doc.uploaded_by}</p>
                          </div>
                        </div>
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#01257D] hover:text-[#2346a0] text-sm flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {dispute.comments && dispute.comments.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments</h2>
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
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tracking</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                      {getStatusText(dispute.status)}
                    </span>
                  </div>
                  
                  {dispute.assigned_mediator && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Assigned Mediator</span>
                      <span className="text-sm text-gray-900">{dispute.mediator_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* History Timeline */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  {/* Timeline Events */}
                  <div className="space-y-4">
                    {dispute.events && dispute.events.map((event, index) => (
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Details</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">{dispute.resolution_details}</p>
                    </div>
                    
                    {dispute.resolution_amount && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Amount</label>
                        <p className="text-gray-900 font-medium">${dispute.resolution_amount}</p>
                      </div>
                    )}
                    
                    {dispute.resolved_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resolved Date</label>
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
    </>
  );
} 