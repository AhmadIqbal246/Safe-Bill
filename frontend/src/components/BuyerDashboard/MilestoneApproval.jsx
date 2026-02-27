import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientProjectsWithPendingMilestones, approveMilestone } from '../../store/slices/ProjectSlice';
import { fetchNotifications } from '../../store/slices/NotificationSlice';
import { toast } from 'react-toastify';
import { Dialog } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { getStepTranslationKey, getDescriptionTranslationKey } from '../../utils/translationUtils';

export default function MilestoneApproval({ onMilestoneAction }) {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [viewCommentDialogOpen, setViewCommentDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState('');
  const [viewDescriptionDialogOpen, setViewDescriptionDialogOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');

  // Translate milestone name based on current language
  // Translate milestone name based on current language
  const getDisplayMilestoneName = (name) => {
    const translationKey = getStepTranslationKey(name);
    if (translationKey) {
      return t(translationKey);
    }
    return name;
  };

  const getTranslatedDescription = (desc) => {
    if (!desc) return '';
    const translationKey = getDescriptionTranslationKey(desc);
    return translationKey ? t(translationKey) : desc;
  };

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
        approve: t('milestone_approval.success_approved'),
        not_approved: t('milestone_approval.success_not_approved'),
        review_request: t('milestone_approval.success_review'),
      };

      toast.success(actionMessages[pendingAction] || 'Action completed successfully!');

      // Fetch updated data and notifications
      dispatch(fetchClientProjectsWithPendingMilestones());
      dispatch(fetchNotifications());

      // Refetch all data in parent component
      if (onMilestoneAction) {
        onMilestoneAction();
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('milestone_approval.failed_update'));
    } finally {
      setConfirmDialogOpen(false);
      setSelectedMilestone(null);
      setPendingAction(null);
      setReviewComment('');
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(i18n.language || undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return new Date(dateString).toLocaleDateString();
    }
  };

  const getActionButtonText = (action) => {
    switch (action) {
      case 'approve': return `✓ ${t('milestone_approval.approve')}`;
      case 'not_approved': return `✗ ${t('milestone_approval.not_approve')}`;
      case 'review_request': return `↻ ${t('milestone_approval.request_review')}`;
      default: return t('milestone_approval.action_generic');
    }
  };

  const getActionMessage = (action) => {
    switch (action) {
      case 'approve': return t('milestone_approval.confirm_approve');
      case 'not_approved': return t('milestone_approval.confirm_not_approved');
      case 'review_request': return t('milestone_approval.confirm_review');
      default: return t('milestone_approval.confirm_generic');
    }
  };

  // const capitalizeStatus = (status) => {
  //   return status.split('_').map(word => 
  //     word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  //   ).join(' ');
  // };

  // const handleViewComment = (comment) => {
  //   setSelectedComment(comment);
  //   setViewCommentDialogOpen(true);
  // };

  const handleViewDescription = (description) => {
    setSelectedDescription(description);
    setViewDescriptionDialogOpen(true);
  };

  if (clientProjectsWithPendingLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px]">
        <div className="font-semibold text-lg mb-4">{t('milestone_approval.title_single')}</div>
        <div className="text-gray-500 text-center py-8">{t('milestone_approval.loading_pending')}</div>
      </div>
    );
  }

  if (clientProjectsWithPendingError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px]">
        <div className="font-semibold text-lg mb-4">{t('milestone_approval.title_single')}</div>
        <div className="text-red-500 text-center py-8">
          {t('common.error')}: {typeof clientProjectsWithPendingError === 'string' ? clientProjectsWithPendingError : t('milestone_approval.load_failed')}
        </div>
      </div>
    );
  }

  if (pendingMilestones.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px]">
        <div className="font-semibold text-lg mb-4">{t('milestone_approval.title_single')}</div>
        <div className="text-gray-500 text-center py-8">
          {t('milestone_approval.empty_pending')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-w-[340px] h-[500px] flex flex-col">
      <div className="font-semibold text-lg mb-4">{t('milestone_approval.title_plural')}</div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('milestone_approval.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
        />
      </div>

      {/* Milestones List with Fixed Height and Scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {filteredMilestones.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {t('milestone_approval.no_search_results')}
          </div>
        ) : (
          filteredMilestones.map((milestone) => (
            <div key={milestone.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              {/* Header with name, status, and amount */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">{getDisplayMilestoneName(milestone.name)}</span>
                  <span className="bg-yellow-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {t('milestone_approval.awaiting_review')}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  €{parseFloat(milestone.relative_payment).toLocaleString()}
                </div>
              </div>

              {/* Project and seller info in one line */}
              <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                <span>{t('milestone_approval.project_label')} {milestone.project_name}</span>
                <span>{t('milestone_approval.seller_label')} {milestone.seller_name}</span>
                <span>{t('milestone_approval.submitted_label')} {formatDate(milestone.created_date)}</span>
              </div>

              {/* Description - only show if exists */}
              {milestone.description && (
                <div className="text-gray-700 mb-2 text-xs">
                  <span className="font-medium">{t('milestone_approval.description_label')}</span>
                  <div className="mt-1">
                    {getTranslatedDescription(milestone.description).length > 50 ? (
                      <>
                        <div className="text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                          {getTranslatedDescription(milestone.description).substring(0, 50)}...
                        </div>
                        <button
                          onClick={() => handleViewDescription(getTranslatedDescription(milestone.description))}
                          className="text-blue-600 underline text-xs hover:text-blue-800 mt-1 cursor-pointer"
                        >
                          {t('milestone_approval.view_full_description')}
                        </button>
                      </>
                    ) : (
                      <div className="text-gray-700 break-words max-w-full">
                        {getTranslatedDescription(milestone.description)}
                      </div>
                    )}
                  </div>
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
                    {t('milestone_approval.view_supporting_doc')}
                  </a>
                </div>
              )}



              {/* Action buttons - more compact */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  className="px-2.5 py-1 bg-[#01257D] text-white rounded text-xs font-medium hover:bg-[#2346a0] transition-colors cursor-pointer disabled:opacity-50"
                  disabled={approveMilestoneLoading}
                  onClick={() => handleAction(milestone, 'approve')}
                >
                  {approveMilestoneLoading ? t('actions.processing') : getActionButtonText('approve')}
                </button>
                <button
                  className="px-2.5 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                  disabled={approveMilestoneLoading}
                  onClick={() => handleAction(milestone, 'not_approved')}
                >
                  {approveMilestoneLoading ? t('actions.processing') : getActionButtonText('not_approved')}
                </button>
                <button
                  className="px-2.5 py-1 bg-[#0ec6b0] text-white rounded text-xs font-medium hover:bg-[#0bb3a0] transition-colors cursor-pointer disabled:opacity-50"
                  disabled={approveMilestoneLoading}
                  onClick={() => handleAction(milestone, 'review_request')}
                >
                  {approveMilestoneLoading ? t('actions.processing') : getActionButtonText('review_request')}
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
              {t('milestone_approval.confirm_action_title')}
            </Dialog.Title>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                {getActionMessage(pendingAction)}
              </p>
              {selectedMilestone && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-sm">{t('milestone_approval.milestone_label')} {getDisplayMilestoneName(selectedMilestone.name)}</p>
                  <p className="text-sm text-gray-600">{t('milestone_approval.project_label')} {selectedMilestone.project_name}</p>
                </div>
              )}

              {/* Review Comment Input */}
              {pendingAction === 'review_request' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('milestone_approval.review_comment_label')}
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t('milestone_approval.review_comment_placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('milestone_approval.review_comment_hint')}
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
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-[#01257D] text-white font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer"
                onClick={confirmAction}
                disabled={approveMilestoneLoading}
              >
                {approveMilestoneLoading ? t('actions.processing') : getActionButtonText(pendingAction)}
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
          <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-[#01257D] mb-4">
              {t('milestone_approval.review_comment_title')}
            </Dialog.Title>

            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
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
                {t('actions.close')}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

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
              {t('milestone_approval.milestone_description_title')}
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
                {t('actions.close')}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}