import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientProjectsWithPendingMilestones, approveMilestone } from '../../store/slices/ProjectSlice';
import { fetchNotifications } from '../../store/slices/NotificationSlice';
import { toast } from 'react-toastify';
import { Dialog } from '@headlessui/react';

export default function MilestoneApproval() {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [viewCommentDialogOpen, setViewCommentDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState('');

  const {
    clientProjectsWithPending,
    clientProjectsWithPendingLoading,
    clientProjectsWithPendingError,
    approveMilestoneLoading
  } = useSelector(state => state.project);

  useEffect(() => {
    dispatch(fetchClientProjectsWithPendingMilestones());
  }, [dispatch]);

  // Get all pending milestones from all projects
  const pendingMilestones = [];
  clientProjectsWithPending.forEach(project => {
    if (project.milestones) {
      project.milestones.forEach(milestone => {
        if (milestone.status === 'pending') {
          pendingMilestones.push({
            ...milestone,
            project_name: project.name,
            seller_name: project.seller_name
          });
        }
      });
    }
  });

  // Filter milestones based on search term
  const filteredMilestones = pendingMilestones.filter(milestone =>
    milestone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    milestone.project_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = (milestone, action) => {
    setSelectedMilestone(milestone);
    setPendingAction(action);
    setReviewComment(''); // Reset comment
    setConfirmDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedMilestone || !pendingAction) return;

    try {
      const payload = {
        milestoneId: selectedMilestone.id, 
        action: pendingAction
      };

      // Add review comment if it's a review request and comment is provided
      if (pendingAction === 'review_request' && reviewComment.trim()) {
        payload.reviewComment = reviewComment.trim();
      }

      await dispatch(approveMilestone(payload)).unwrap();
      
      const actionMessages = {
        'approve': 'Milestone approved successfully!',
        'not_approved': 'Milestone marked as not approved!',
        'review_request': 'Milestone sent for review!'
      };
      
      toast.success(actionMessages[pendingAction] || 'Action completed successfully!');
      
      // Fetch updated data and notifications
      dispatch(fetchClientProjectsWithPendingMilestones());
      dispatch(fetchNotifications());
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update milestone status');
    } finally {
      setConfirmDialogOpen(false);
      setSelectedMilestone(null);
      setPendingAction(null);
      setReviewComment('');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getActionButtonText = (action) => {
    switch (action) {
      case 'approve': return '✓ Approve';
      case 'not_approved': return '✗ Not Approve';
      case 'review_request': return '↻ Request Review';
      default: return 'Action';
    }
  };

  const getActionMessage = (action) => {
    switch (action) {
      case 'approve': return 'Are you sure you want to approve this milestone?';
      case 'not_approved': return 'Are you sure you want to mark this milestone as not approved?';
      case 'review_request': return 'Are you sure you want to send this milestone for review?';
      default: return 'Are you sure you want to perform this action?';
    }
  };

  const capitalizeStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleViewComment = (comment) => {
    setSelectedComment(comment);
    setViewCommentDialogOpen(true);
  };

  if (clientProjectsWithPendingLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px]">
        <div className="font-semibold text-lg mb-4">Milestone Approval</div>
        <div className="text-gray-500 text-center py-8">Loading pending milestones...</div>
      </div>
    );
  }

  if (clientProjectsWithPendingError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px]">
        <div className="font-semibold text-lg mb-4">Milestone Approval</div>
        <div className="text-red-500 text-center py-8">
          Error: {typeof clientProjectsWithPendingError === 'string' ? clientProjectsWithPendingError : 'Failed to load milestones'}
        </div>
      </div>
    );
  }

  if (pendingMilestones.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px]">
        <div className="font-semibold text-lg mb-4">Milestone Approval</div>
        <div className="text-gray-500 text-center py-8">
          No milestones awaiting approval
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px] h-[500px] flex flex-col">
      <div className="font-semibold text-lg mb-4">Milestone Approvals</div>
      
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by project name or milestone name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
        />
      </div>

      {/* Milestones List with Fixed Height and Scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {filteredMilestones.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No milestones found matching your search.
          </div>
        ) : (
          filteredMilestones.map((milestone) => (
            <div key={milestone.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              {/* Header with name, status, and amount */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">{milestone.name}</span>
                  <span className="bg-yellow-500 text-white rounded-full px-2 py-0.5 text-xs">
                    Awaiting Review
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  ${parseFloat(milestone.relative_payment).toLocaleString()}
                </div>
              </div>
              
              {/* Project and seller info in one line */}
              <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                <span>Project: {milestone.project_name}</span>
                <span>Seller: {milestone.seller_name}</span>
                <span>Submitted: {formatDate(milestone.created_date)}</span>
              </div>
              
              {/* Description - only show if exists */}
              {milestone.description && (
                <div className="text-gray-700 mb-2 text-xs leading-relaxed">
                  {milestone.description}
                </div>
              )}
              
              {/* Supporting document link - compact */}
              {milestone.supporting_doc && (
                <div className="mb-2">
                  <a
                    href={milestone.supporting_doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-xs"
                  >
                    View Supporting Document
                  </a>
                </div>
              )}
              
              {/* Review comment - if exists */}
              {milestone.review_comment && (
                <div className="mb-2 text-xs text-gray-600">
                  <span className="font-medium">Review Comment:</span> 
                  {milestone.review_comment.length > 50 ? (
                    <>
                      <span className="ml-1">{milestone.review_comment.substring(0, 50)}...</span>
                      <button
                        onClick={() => handleViewComment(milestone.review_comment)}
                        className="ml-1 text-blue-600 underline text-xs hover:text-blue-800"
                      >
                        View Full Comment
                      </button>
                    </>
                  ) : (
                    <span className="ml-1">{milestone.review_comment}</span>
                  )}
                </div>
              )}
              
              {/* Action buttons - more compact */}
              <div className="flex gap-1.5 flex-wrap">
                <button 
                  className="px-2.5 py-1 bg-[#01257D] text-white rounded text-xs font-medium hover:bg-[#2346a0] transition-colors cursor-pointer disabled:opacity-50"
                  disabled={approveMilestoneLoading}
                  onClick={() => handleAction(milestone, 'approve')}
                >
                  {approveMilestoneLoading ? 'Approving...' : '✓ Approve'}
                </button>
                <button 
                  className="px-2.5 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                  disabled={approveMilestoneLoading}
                  onClick={() => handleAction(milestone, 'not_approved')}
                >
                  {approveMilestoneLoading ? 'Processing...' : '✗ Not Approve'}
                </button>
                <button 
                  className="px-2.5 py-1 bg-[#0ec6b0] text-white rounded text-xs font-medium hover:bg-[#0bb3a0] transition-colors cursor-pointer disabled:opacity-50"
                  disabled={approveMilestoneLoading}
                  onClick={() => handleAction(milestone, 'review_request')}
                >
                  {approveMilestoneLoading ? 'Processing...' : '↻ Request Review'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-[#01257D] mb-4">
              Confirm Action
            </Dialog.Title>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                {getActionMessage(pendingAction)}
              </p>
              {selectedMilestone && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-sm">Milestone: {selectedMilestone.name}</p>
                  <p className="text-sm text-gray-600">Project: {selectedMilestone.project_name}</p>
                </div>
              )}
              
              {/* Review Comment Input */}
              {pendingAction === 'review_request' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Comment (Optional)
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Please provide feedback on what needs to be changed or improved..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This comment will be visible to the seller to understand your feedback.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                onClick={() => setConfirmDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-[#01257D] text-white font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer"
                onClick={confirmAction}
                disabled={approveMilestoneLoading}
              >
                {approveMilestoneLoading ? 'Processing...' : getActionButtonText(pendingAction)}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* View Review Comment Dialog */}
      <Dialog
        open={viewCommentDialogOpen}
        onClose={() => setViewCommentDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-[#01257D] mb-4">
              Review Comment
            </Dialog.Title>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedComment}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-[#01257D] text-white font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer"
                onClick={() => setViewCommentDialogOpen(false)}
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}