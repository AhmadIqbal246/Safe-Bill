import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import { Key, ArrowRight, AlertCircle } from 'lucide-react';

export default function AcceptProjectInvite() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError(t('accept_project_invite.enter_token_error'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Navigate directly to the InviteViewProject page with the token
      navigate(`/project-invite?token=${encodeURIComponent(token.trim())}`);
    } catch (err) {
      setError(t('accept_project_invite.general_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeBillHeader />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#10B981] mb-4">
              <Key className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('accept_project_invite.title')}
            </h1>
            <p className="text-gray-600">
              {t('accept_project_invite.subtitle')}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Token Input */}
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('accept_project_invite.token_label')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={t('accept_project_invite.token_placeholder')}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-sm transition-colors"
                    disabled={loading}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {t('accept_project_invite.token_help')}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#10B981] text-white rounded-lg font-medium hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('accept_project_invite.processing')}
                  </>
                ) : (
                  <>
                    {t('accept_project_invite.submit_button')}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('accept_project_invite.help_text')}
            </p>
            <button
              onClick={() => navigate('/buyer-dashboard')}
              className="mt-2 text-sm text-[#10B981] hover:text-[#059669] font-medium transition-colors"
            >
              {t('accept_project_invite.back_to_dashboard')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
