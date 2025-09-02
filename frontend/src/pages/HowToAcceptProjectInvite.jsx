import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import { 
  Mail, 
  Copy, 
  ArrowRight, 
  CheckCircle, 
  Key, 
  Users, 
  FileText, 
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function HowToAcceptProjectInvite() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [invitationCode, setInvitationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptProjectInvite = () => {
    navigate('/accept-project-invite');
  };

  const handleGoToDashboard = () => {
    navigate('/buyer-dashboard');
  };

  const handleViewProjects = () => {
    navigate('/buyer-dashboard');
  };

  const handleInvitationCodeSubmit = (e) => {
    e.preventDefault();
    if (!invitationCode.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate directly to the project invite page with the code
      navigate(`/project-invite?token=${encodeURIComponent(invitationCode.trim())}`);
    }, 1000);
  };

  return (
    <>
      <SafeBillHeader />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-[#10B981] mb-6">
              <Key className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('how_to_accept_project_invite.title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('how_to_accept_project_invite.subtitle')}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-[#10B981]" />
              {t('how_to_accept_project_invite.quick_actions')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleAcceptProjectInvite}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-[#10B981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors text-lg cursor-pointer"
              >
                <Key className="h-5 w-5" />
                {t('how_to_accept_project_invite.accept_invite_button')}
              </button>
              <button
                onClick={handleGoToDashboard}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-[#01257D] text-white rounded-lg font-medium hover:bg-[#2346a0] transition-colors text-lg cursor-pointer"
              >
                <Users className="h-5 w-5" />
                {t('how_to_accept_project_invite.go_to_dashboard_button')}
              </button>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="space-y-8">
            {/* Step 1: Email Reception */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">1</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    {t('how_to_accept_project_invite.step1_title')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('how_to_accept_project_invite.step1_description')}
                  </p>
                  
                  {/* Email Preview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        {t('how_to_accept_project_invite.email_preview_title')}
                      </span>
                    </div>
                    <div className="bg-white border border-blue-200 rounded p-3">
                      <div className="text-sm text-blue-800 font-mono break-all">
                        {t('how_to_accept_project_invite.email_preview_code')}
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      {t('how_to_accept_project_invite.email_preview_note')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Dashboard Access */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">2</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    {t('how_to_accept_project_invite.step2_title')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('how_to_accept_project_invite.step2_description')}
                  </p>
                  
                  {/* Dashboard Button Preview */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">
                        {t('how_to_accept_project_invite.dashboard_button_preview_title')}
                      </span>
                    </div>
                    <button
                      onClick={handleGoToDashboard}
                      className="px-6 py-3 bg-[#01257D] text-white rounded-lg font-medium hover:bg-[#2346a0] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="h-4 w-4" />
                      {t('how_to_accept_project_invite.dashboard_button')}
                    </button>
                    <p className="text-xs text-green-700 mt-2">
                      {t('how_to_accept_project_invite.dashboard_button_note')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Enter Invitation Code */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-lg">3</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Key className="h-5 w-5 text-purple-600" />
                    {t('how_to_accept_project_invite.step3_title')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('how_to_accept_project_invite.step3_description')}
                  </p>
                  
                  {/* Form Preview */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-900">
                        {t('how_to_accept_project_invite.form_preview_title')}
                      </span>
                    </div>
                    <form onSubmit={handleInvitationCodeSubmit} className="space-y-3">
                      <div>
                        <label htmlFor="invitation-code" className="block text-sm font-medium text-purple-900 mb-1">
                          {t('how_to_accept_project_invite.invitation_code_label')}
                        </label>
                        <input
                          id="invitation-code"
                          type="text"
                          value={invitationCode}
                          onChange={(e) => setInvitationCode(e.target.value)}
                          placeholder={t('how_to_accept_project_invite.invitation_code_placeholder')}
                          className="w-full px-3 py-2 border border-purple-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!invitationCode.trim() || isSubmitting}
                        className="w-full px-4 py-2 bg-[#10B981] text-white rounded-md font-medium hover:bg-[#059669] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t('how_to_accept_project_invite.processing')}
                          </>
                        ) : (
                          <>
                            {t('how_to_accept_project_invite.view_project_button')}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                    <p className="text-xs text-purple-600 mt-2 text-center">
                      Try it now! Enter your invitation code above and click "View Project"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Review and Approve */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-lg">4</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    {t('how_to_accept_project_invite.step4_title')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('how_to_accept_project_invite.step4_description')}
                  </p>
                  
                  {/* Project Review Preview */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-900">
                        {t('how_to_accept_project_invite.project_review_title')}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white border border-orange-200 rounded p-3">
                        <div className="text-sm text-orange-800">
                          <div className="font-medium mb-1">{t('how_to_accept_project_invite.project_details')}</div>
                          <div className="text-xs space-y-1">
                            <div>• {t('how_to_accept_project_invite.project_name')}</div>
                            <div>• {t('how_to_accept_project_invite.total_amount')}</div>
                            <div>• {t('how_to_accept_project_invite.installments')}</div>
                            <div>• {t('how_to_accept_project_invite.quote_document')}</div>
                          </div>
                        </div>
                      </div>
                      {/* <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                          {t('how_to_accept_project_invite.approve_button')}
                        </button>
                        <button className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
                          {t('how_to_accept_project_invite.reject_button')}
                        </button>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5: Project Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-lg">5</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                    {t('how_to_accept_project_invite.step5_title')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('how_to_accept_project_invite.step5_description')}
                  </p>
                  
                  {/* Dashboard Management Preview */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium text-indigo-900">
                        {t('how_to_accept_project_invite.dashboard_management_title')}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white border border-indigo-200 rounded p-3">
                        <div className="text-sm text-indigo-800">
                          <div className="font-medium mb-1">{t('how_to_accept_project_invite.pending_projects')}</div>
                          <div className="text-xs text-indigo-600">{t('how_to_accept_project_invite.pending_projects_desc')}</div>
                        </div>
                      </div>
                      <div className="bg-white border border-indigo-200 rounded p-3">
                        <div className="text-sm text-indigo-800">
                          <div className="font-medium mb-1">{t('how_to_accept_project_invite.active_projects')}</div>
                          <div className="text-xs text-indigo-600">{t('how_to_accept_project_invite.active_projects_desc')}</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleViewProjects}
                      className="w-full mt-3 px-4 py-2 bg-[#01257D] text-white rounded-md font-medium hover:bg-[#2346a0] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Users className="h-4 w-4" />
                      {t('how_to_accept_project_invite.view_my_projects')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              {t('how_to_accept_project_invite.important_notes_title')}
            </h3>
            <div className="space-y-2 text-sm text-yellow-700">
              <div className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>{t('how_to_accept_project_invite.note1')}</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>{t('how_to_accept_project_invite.note2')}</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>{t('how_to_accept_project_invite.note3')}</span>
              </div>
            </div>
          </div>

          {/* Final Action */}
          <div className="text-center mt-8">
            <button
              onClick={handleAcceptProjectInvite}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#10B981] text-white rounded-lg font-semibold hover:bg-[#059669] transition-colors text-lg shadow-lg cursor-pointer"
            >
              <Key className="h-6 w-6" />
              {t('how_to_accept_project_invite.get_started_button')}
              <ArrowRight className="h-6 w-6" />
            </button>
            <p className="text-gray-500 mt-3">
              {t('how_to_accept_project_invite.get_started_note')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
