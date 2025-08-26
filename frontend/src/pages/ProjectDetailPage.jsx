import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientProjectDetail } from '../store/slices/ProjectSlice';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import { Download, Star, Calendar, DollarSign, Shield, MessageCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProjectDetailPage() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const {
    clientProjectDetail,
    clientProjectDetailLoading,
    clientProjectDetailError
  } = useSelector(state => state.project);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchClientProjectDetail(projectId));
    }
  }, [dispatch, projectId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (project) => {
    if (!project?.milestones?.length) return 0;
    const completedMilestones = project.milestones.filter(m => 
      m.status === 'approved'
    ).length;
    return Math.round((completedMilestones / project.milestones.length) * 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'not_approved': return 'bg-red-500';
      case 'review_request': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return t('project_detail.completed');
      case 'pending': return t('project_detail.in_progress');
      case 'not_approved': return t('project_detail.not_approved');
      case 'review_request': return t('project_detail.review_request');
      default: return t('project_detail.not_submitted');
    }
  };

  if (clientProjectDetailLoading) {
    return (
      <>
        <SafeBillHeader />
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-lg text-gray-500">{t('project_detail.loading_project_details')}</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (clientProjectDetailError) {
    return (
      <>
        <SafeBillHeader />
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-lg text-red-500">
                {typeof clientProjectDetailError === 'string' ? clientProjectDetailError : t('project_detail.failed_load_project_details')}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!clientProjectDetail) {
    return (
      <>
        <SafeBillHeader />
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-lg text-gray-500">{t('project_detail.project_not_found')}</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const project = clientProjectDetail;
  const progress = getProgressPercentage(project);
  const totalAmount = project.total_amount || 0;
  const paidAmount = project.installments?.filter(inst => inst.step === 'Project Completion').reduce((sum, inst) => sum + parseFloat(inst.amount), 0) || 0;
  const pendingAmount = totalAmount - paidAmount;

  return (
    <>
      <SafeBillHeader />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            {t('project_detail.back_to_dashboard')}
          </button>

          {/* Project Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {project.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{project.seller_name}</span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span>4.9</span>
                      <span className="text-gray-500">(127 reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{t('project_detail.started')}: {formatDate(project.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {t('project_detail.in_progress')}
                </span>
                <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] transition-colors cursor-pointer">
                  {t('project_detail.contact_seller')}
                </button>
                <button 
                  onClick={() => navigate('/dispute-submit', { state: { project } })}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  {t('project_detail.raise_dispute')}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Progress */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('project_detail.project_progress')}</h2>
                <div className="relative">
                  {/* Timeline Container */}
                  <div className="flex items-center justify-between">
                    {project.installments?.map((installment, index) => {
                      const milestone = project.milestones?.find(m => m.related_installment === installment.id);
                      const isCompleted = milestone?.status === 'approved';
                      const isCurrent = milestone?.status === 'pending';
                      const isFuture = !isCompleted && !isCurrent;
                      
                      // Determine if the line to the next stage should be colored
                      // Only color the line if this stage is completed
                      const shouldColorLine = isCompleted;
                      
                      return (
                        <div key={installment.id} className="flex flex-col items-center relative">
                          {/* Circle Icon */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                            isCompleted ? 'bg-[#01257D]' : isCurrent ? 'bg-[#01257D]' : 'bg-gray-300'
                          }`}>
                            {isCompleted ? (
                              <span className="text-white text-lg font-bold">✓</span>
                            ) : isCurrent ? (
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <span className="text-gray-600 text-lg font-bold">{index + 1}</span>
                            )}
                          </div>
                          
                          {/* Stage Text */}
                          <div className="text-center">
                            <div className="font-medium text-gray-900 text-sm mb-1">{installment.step}</div>
                            <div className="text-xs text-gray-600">
                              ${parseFloat(installment.amount).toLocaleString()} {isCompleted ? t('project_detail.paid') : t('project_detail.pending')}
                            </div>
                          </div>
                          
                          {/* Connecting Line - only show colored line if this stage is completed */}
                          {index < project.installments.length - 1 && (
                            <div className={`absolute top-6 left-full w-full h-0.5 ${
                              shouldColorLine ? 'bg-[#01257D]' : 'bg-gray-300'
                            }`} style={{ width: 'calc(100% - 3rem)' }}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Milestones & Payments */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('project_detail.milestones_payments')}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">{t('project_detail.milestone')}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">{t('project_detail.status')}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">{t('project_detail.amount')}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">{t('project_detail.paid')}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">{t('project_detail.date')}</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">{t('project_detail.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.milestones?.map((milestone) => (
                        <tr key={milestone.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-900">{milestone.name}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)} text-white`}>
                              {getStatusText(milestone.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-900">
                            ${parseFloat(milestone.relative_payment).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {milestone.status === 'approved' ? 'Yes' : 'No'}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {milestone.completion_date ? formatDate(milestone.completion_date) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {milestone.status === 'pending' && (
                              <button className="text-[#01257D] hover:text-[#2346a0] text-sm cursor-pointer">
                                {t('project_detail.review')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Project Documents */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{t('project_detail.project_documents')}</h2>
                  <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] transition-colors cursor-pointer">
                    {t('project_detail.download_all')}
                  </button>
                </div>
                <div className="space-y-4">
                  {project.quote?.file && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{t('project_detail.quote_document')}</div>
                        <div className="text-sm text-gray-600">{formatDate(project.created_at)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-[#01257D] hover:text-[#2346a0] text-sm cursor-pointer">
                          {t('project_detail.preview')}
                        </button>
                        <a
                          href={project.quote.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#01257D] hover:text-[#2346a0] text-sm flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          {t('project_detail.download')}
                        </a>
                      </div>
                    </div>
                  )}
                  {project.milestones?.map((milestone) => 
                    milestone.supporting_doc && (
                      <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{milestone.name} - {t('project_detail.supporting_document')}</div>
                          <div className="text-sm text-gray-600">{formatDate(milestone.created_date)}</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-[#01257D] hover:text-[#2346a0] text-sm cursor-pointer">
                            {t('project_detail.preview')}
                          </button>
                          <a
                            href={milestone.supporting_doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#01257D] hover:text-[#2346a0] text-sm flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            {t('project_detail.download')}
                          </a>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('project_detail.payment_summary')}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project_detail.total_project_amount')}</span>
                    <span className="font-semibold text-gray-900">${totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project_detail.amount_paid')}</span>
                    <span className="font-semibold text-green-600">${paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project_detail.pending_payments')}</span>
                    <span className="font-semibold text-orange-600">${pendingAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="text-sm text-gray-600 mb-1">{t('project_detail.next_payment_due')}</div>
                    <div className="font-semibold text-gray-900">${pendingAmount > 0 ? project.installments?.find(inst => inst.step !== 'Project Completion')?.amount || 0 : 0}</div>
                    <div className="text-xs text-gray-500">{t('project_detail.development_milestone')}</div>
                  </div>
                  <button className="w-full mt-4 px-4 py-3 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] transition-colors font-medium cursor-pointer">
                    {t('project_detail.pay_now')}
                  </button>
                </div>
              </div>

              {/* Project Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('project_detail.project_details')}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project_detail.project_id')}</span>
                    <span className="font-medium text-gray-900">MPRJ-{project.id.toString().padStart(6, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project_detail.category')}</span>
                    <span className="font-medium text-gray-900">{project.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('project_detail.duration')}</span>
                    <span className="font-medium text-gray-900">8 {t('project_detail.weeks')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('project_detail.escrow_protection')}</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">{t('project_detail.active')}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/dispute-submit', { state: { project } })}
                    className="w-full mt-4 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer"
                  >
                    {t('project_detail.dispute')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 