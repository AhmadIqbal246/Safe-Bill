import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchMilestones, updateMilestone, approveMilestone } from '../store/slices/ProjectSlice';
import { fetchNotifications } from '../store/slices/NotificationSlice';
import { fetchProjectPlatformFee } from '../store/slices/PaymentSlice';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-toastify';
import { Edit, Upload, Cloud } from 'lucide-react';

export default function MilestonePage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const project = location.state?.project;
  const fileInputRef = useRef();

  const {
    milestones,
    milestonesLoading,
    milestonesError,
    milestoneUpdateLoading,
    milestoneUpdateError,
    // approveMilestoneLoading
  } = useSelector(state => state.project);

  const { projectPlatformFee, projectPlatformFeeLoading } = useSelector(state => state.payment);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Confirmation dialog state
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // Individual milestone loading states
  const [submittingMilestoneId, setSubmittingMilestoneId] = useState(null);
  
  // View comment dialog state
  const [viewCommentDialogOpen, setViewCommentDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState('');
  
  // View description dialog state
  const [viewDescriptionDialogOpen, setViewDescriptionDialogOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');

  useEffect(() => {
    if (project?.id) {
      dispatch(fetchMilestones(project.id));
      // Fetch platform fee for this project
      dispatch(fetchProjectPlatformFee({ projectId: project.id, milestoneAmount: 0 }));
    }
  }, [dispatch, project?.id]);

  const projectMilestones = milestones[project?.id] || [];

  // Function to fetch platform fee for a specific milestone amount
  // const fetchMilestonePlatformFee = (milestoneAmount) => {
  //   if (project?.id) {
  //     dispatch(fetchProjectPlatformFee({ 
  //       projectId: project.id, 
  //       milestoneAmount: milestoneAmount 
  //     }));
  //   }
  // };

  // Calculate net amount after platform fee (simplified - no Stripe fees)
  const calculateNetAmount = (amount) => {
    const numericAmount = Number(amount);
    const platformFeePct = Number(projectPlatformFee?.platform_fee_percentage || 0);
    
    // Use the calculated platform fee amount from API if available, otherwise calculate it
    let platformFeeAmount;
    if (projectPlatformFee && projectPlatformFee.milestone_amount === numericAmount) {
      // Use the exact amount from API
      platformFeeAmount = Number(projectPlatformFee.platform_fee_amount || 0);
    } else {
      // Calculate platform fee amount
      platformFeeAmount = (numericAmount * platformFeePct) / 100;
    }
    
    // Calculate seller net (what seller receives after platform fee)
    const sellerNet = numericAmount - platformFeeAmount;
    
    return {
      grossAmount: numericAmount,
      platformFee: +platformFeeAmount.toFixed(2),
      platformFeePct: +platformFeePct.toFixed(1),
      netAmount: +Math.max(sellerNet, 0).toFixed(2)
    };
  };

  // Helper functions for status-based controls
  const canEditMilestone = (milestone) => {
    return ['not_submitted', 'not_approved', 'review_request'].includes(milestone.status);
  };
  
  const getTooltipMessage = (milestone) => {
    switch (milestone.status) {
      case 'pending':
        return t('milestones.status_tooltip_submitted');
      case 'approved':
        return t('milestones.status_tooltip_approved');
      default:
        return '';
    }
  };

  // Display status in English only (no translation)
  const getDisplayStatus = (status) => {
    return capitalizeStatus(status);
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

  const handleViewDescription = (description) => {
    setSelectedDescription(description);
    setViewDescriptionDialogOpen(true);
  };

  // Handle edit functionality
  const openEditModal = (milestone) => {
    if (!canEditMilestone(milestone)) {
      return; // Don't open if editing is not allowed
    }
    setSelectedMilestone(milestone);
    setEditForm({
      name: milestone.name || '',
      description: milestone.description || '',
      relative_payment: milestone.relative_payment || '',
      supporting_doc: null
    });
    setEditModalOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm(prev => ({ ...prev, supporting_doc: file }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setEditForm(prev => ({ ...prev, supporting_doc: file }));
    }
  };

  const handleEditCancel = () => {
    setEditModalOpen(false);
    setEditForm(null);
    setSelectedMilestone(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm || !selectedMilestone) return;

    const payload = {
      milestoneId: selectedMilestone.id,
      milestoneData: {
        ...editForm,
        // Only send supporting_doc if it's a File
        ...(editForm.supporting_doc instanceof File ? {} : { supporting_doc: undefined }),
      }
    };

    try {
      await dispatch(updateMilestone(payload)).unwrap();
      toast.success(t('milestones.update_success'));
      dispatch(fetchMilestones(project.id));
      handleEditCancel();
    } catch (err) {
      // Handle different error formats
      let errorMessage = t('milestones.update_failed_default');
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        // Handle validation errors from backend
        if (err.relative_payment && Array.isArray(err.relative_payment)) {
          errorMessage = err.relative_payment[0];
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  // Submit for approval logic with confirmation dialog
  const handleSubmitForApproval = (milestone) => {
    setPendingAction({ milestone, action: 'pending' });
    setConfirmationOpen(true);
  };
  
  const confirmSubmission = async () => {
    if (!pendingAction) return;
    
    setSubmittingMilestoneId(pendingAction.milestone.id);
    
    try {
      await dispatch(approveMilestone({ 
        milestoneId: pendingAction.milestone.id, 
        action: pendingAction.action 
      })).unwrap();
      toast.success(t('milestones.submit_success'));
      
      // Fetch updated data and notifications
      dispatch(fetchMilestones(project.id));
      dispatch(fetchNotifications());
    } catch (err) {
      toast.error(
        typeof err === 'string' ? err : t('milestones.submit_failed_default')
      );
    } finally {
      setSubmittingMilestoneId(null);
    }
    
    setConfirmationOpen(false);
    setPendingAction(null);
  };
  
  const cancelSubmission = () => {
    setConfirmationOpen(false);
    setPendingAction(null);
  };

  // Helper: show action buttons based on status (seller-specific)
  const renderMilestoneActions = (milestone) => {
    // Seller can only submit for approval if status allows it
    if (['not_submitted', 'not_approved', 'review_request'].includes(milestone.status)) {
      const isSubmitting = submittingMilestoneId === milestone.id;
      return (
        <button
          className="px-3 py-1 bg-[#01257D] text-white rounded-md font-medium hover:bg-[#2346a0] transition-colors text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
          onClick={() => handleSubmitForApproval(milestone)}
        >
          {isSubmitting ? t('milestones.submitting') : t('milestones.submit_for_approval')}
        </button>
      );
    }
    // No actions available for pending or approved milestones
    return null;
  };

  return (
    <>
    <SafeBillHeader/>
    <div className="max-w-3xl mx-auto py-8 px-4">

      <button
        className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer"
        onClick={() => navigate(-1)}
      >
        ← {t('milestones.back_to_projects')}
      </button>
      <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('milestones.page_title')}: <span className="text-[#01257D]">{project?.name}</span></h2>
      {milestonesLoading ? (
        <div className="py-12 text-center text-gray-400">{t('milestones.loading')}</div>
      ) : milestonesError ? (
        <div className="py-12 text-center text-red-500">{typeof milestonesError === 'string' ? milestonesError : t('milestones.load_failed')}</div>
      ) : projectMilestones.length === 0 ? (
        <div className="py-12 text-center text-gray-400">{t('milestones.empty_state')}</div>
      ) : (
        <div className="space-y-6">
          {projectMilestones.map(milestone => (
            <div key={milestone.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="text-lg font-semibold text-[#01257D]">{milestone.name}</div>
                  <div className="text-gray-500 text-sm">{t('milestones.status_label')}: <span className={
                    milestone.status === 'approved' ? 'text-green-600' : milestone.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  }>{getDisplayStatus(milestone.status)}</span></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-800">
                      €{parseFloat(milestone.relative_payment || 0).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                    </div>
                    {projectPlatformFee && !projectPlatformFeeLoading && (
                      <div className="text-sm text-green-600 font-medium">
                        {t('milestones.you_receive_prefix')}: €{calculateNetAmount(milestone.relative_payment || 0).netAmount.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openEditModal(milestone)}
                    className={`p-2 rounded-md transition-colors ${
                      canEditMilestone(milestone)
                        ? 'text-gray-500 hover:text-[#01257D] hover:bg-[#E6F0FA] cursor-pointer'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title={canEditMilestone(milestone) ? t('milestones.edit_tooltip') : getTooltipMessage(milestone)}
                    disabled={!canEditMilestone(milestone)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {renderMilestoneActions(milestone)}
                </div>
              </div>
              <div className="text-gray-700 mb-2">
                <span className="font-medium">{t('milestones.description_label')}:</span> 
                <div className="mt-1">
                  {milestone.description.length > 100 ? (
                    <>
                      <div className="text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                        {milestone.description.substring(0, 100)}...
                      </div>
                      <button
                        onClick={() => handleViewDescription(milestone.description)}
                        className="text-blue-600 underline text-sm hover:text-blue-800 mt-1 cursor-pointer"
                      >
                        {t('milestones.view_full_description')}
                      </button>
                    </>
                  ) : (
                    <div className="text-gray-700 break-words max-w-full">
                      {milestone.description}
                    </div>
                  )}
                </div>
              </div>
              {milestone.supporting_doc && (
                <div className="mb-2">
                  <a
                    href={milestone.supporting_doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    {t('milestones.view_supporting_doc')}
                  </a>
                </div>
              )}
              {milestone.completion_notice && (
                <div className="mb-2 text-sm text-gray-600">
                  <span className="font-medium">{t('milestones.completion_notice')}:</span> {milestone.completion_notice}
                </div>
              )}
              
              {/* Simple Fee Info */}
              {projectPlatformFee && !projectPlatformFeeLoading && (
                <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <span className="font-medium">{t('milestones.platform_fee')}:</span> €{calculateNetAmount(milestone.relative_payment || 0).platformFee.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                </div>
              )}
              {milestone.review_comment && (
                <div className="mb-2 text-sm text-gray-600">
                  <span className="font-medium">{t('milestones.review_comment')}:</span> 
                  <div className="mt-1">
                    {milestone.review_comment.length > 100 ? (
                      <>
                        <div className="text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                          {milestone.review_comment.substring(0, 100)}...
                        </div>
                        <button
                          onClick={() => handleViewComment(milestone.review_comment)}
                          className="text-blue-600 underline text-sm hover:text-blue-800 mt-1 cursor-pointer"
                        >
                          {t('milestones.view_full_comment')}
                        </button>
                      </>
                    ) : (
                      <div className="text-gray-700 break-words max-w-full">
                        {milestone.review_comment}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500 mt-2">
                <div>{t('milestones.created_label')}: {milestone.created_date}</div>
                {milestone.completion_date && <div>{t('milestones.completed_label')}: {milestone.completion_date}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Milestone Modal */}
      <Dialog
        open={editModalOpen}
        onClose={handleEditCancel}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-[#01257D] mb-4">
              {t('milestones.edit_title')}
            </Dialog.Title>
            {editForm && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    {t('milestones.name_label')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                    value={editForm.name}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    placeholder={t('milestones.name_placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    {t('milestones.description_label')}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent min-h-[100px] resize-y"
                    value={editForm.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    placeholder={t('milestones.description_placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    {t('milestones.payment_amount_label')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                    value={editForm.relative_payment}
                    onChange={(e) => handleEditChange('relative_payment', e.target.value)}
                    placeholder={t('milestones.payment_amount_placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">
                    {t('milestones.supporting_documents')}
                  </label>
                  {selectedMilestone?.supporting_doc && (
                    <div className="text-sm text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{t('milestones.current_document')}:</span>
                      <a
                        href={selectedMilestone.supporting_doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline ml-1"
                      >
                        {t('milestones.view_current_document')}
                      </a>
                    </div>
                  )}

                  <div 
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver 
                        ? 'border-[#01257D] bg-[#E6F0FA]' 
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 mx-auto flex items-center justify-center bg-gray-200 rounded-full">
                        <Cloud className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          {t('milestones.upload_instructions')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {t('milestones.drag_drop_hint')}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="px-6 py-2 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {t('milestones.choose_files')}
                      </button>
                    </div>
                  </div>
                  {editForm.supporting_doc && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Upload className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">
                          {t('milestones.file_selected')}: {editForm.supporting_doc.name}
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {t('milestones.size_label')}: {(editForm.supporting_doc.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>


                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                    onClick={handleEditCancel}
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-[#01257D] text-white font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer"
                    disabled={milestoneUpdateLoading}
                  >
                    {milestoneUpdateLoading ? t('actions.processing') : t('milestones.update_button')}
                  </button>
                </div>
              </form>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationOpen}
        onClose={cancelSubmission}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-bold text-[#01257D] mb-4">
              {t('milestones.confirm_submission_title')}
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              {t('milestones.confirm_submission_body')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                onClick={cancelSubmission}
              >
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-[#01257D] text-white font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer"
                onClick={confirmSubmission}
                disabled={submittingMilestoneId !== null}
              >
                {submittingMilestoneId !== null ? t('actions.processing') : t('actions.submit')}
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
              {t('milestones.review_comment')}
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
              {t('milestones.description_label')}
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
    </>
  );
}