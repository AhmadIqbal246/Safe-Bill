import React, { useState } from 'react';
import { Mail, ArrowLeft, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState('');

  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return t('forgot_password.email_required');
    }
    if (!emailRegex.test(email)) {
      return t('forgot_password.email_invalid');
    }
    if (email.length > 254) {
      return t('forgot_password.email_too_long');
    }
    if (email.split('@')[0].length > 64) {
      return t('forgot_password.local_part_too_long');
    }
    if (email.split('@')[1] && email.split('@')[1].length > 190) {
      return t('forgot_password.domain_part_too_long');
    }
    return '';
  };

  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);
    setEmailError(validateEmail(emailValue));
    // Clear previous messages when user starts typing
    setShowSuccess(false);
    setShowError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setShowError(true);
      setMessage(t('forgot_password.please_enter_email'));
      return;
    }

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setShowError(true);
      setMessage(emailValidationError);
      return;
    }

    setIsLoading(true);
    setShowError(false);
    setShowSuccess(false);

    try {
      const response = await axios.post(
        `${backendBaseUrl}api/accounts/password-reset-request/`,
        { email: email.trim() }
      );
      
      setShowSuccess(true);
      setMessage(response.data.detail || t('forgot_password.reset_link_sent'));
      setEmail(''); // Clear email after successful submission
    } catch (error) {
      setShowError(true);
      setMessage(
        error.response?.data?.detail || 
        t('forgot_password.failed_to_send')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SafeBillHeader/>
    <div className="min-h-screen flex items-center justify-center px-4 py-8">

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative">
          {/* Header Icon */}
          <div className="flex justify-center -mt-16 mb-6">
            <div className="bg-gradient-to-r from-[#01257D] to-[#2346a0] rounded-full p-4 flex items-center justify-center shadow-lg">
              <Mail className="text-white w-8 h-8" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('forgot_password.title')}</h1>
            <p className="text-gray-600 text-base leading-relaxed">
              {t('forgot_password.description')}
            </p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
              <CheckCircle className="text-green-600 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">Success</p>
                <p className="text-green-700 text-sm mt-1">{message}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertTriangle className="text-red-600 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-green-700 text-sm mt-1">{message}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('forgot_password.email_address')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#01257D] focus:border-transparent transition-all duration-200 ${
                    emailError ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('forgot_password.email_placeholder')}
                  disabled={isLoading}
                />
              </div>
              {emailError && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email.trim() || emailError}
              className="w-full bg-gradient-to-r bg-[#01257D] hover:bg-[#2346a0] text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  {t('forgot_password.sending_reset_link')}
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  {t('forgot_password.send_reset_link')}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 bg-white">Or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Back to Login Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-[#01257D] hover:text-[#2346a0] font-medium transition-colors duration-200 group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              {t('forgot_password.back_to_login')}
            </Link>
          </div>
        </div>

        {/* Information Cards */}
        <div className="mt-8 space-y-4">
          {/* Secure Reset Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
            <div className="bg-blue-500 rounded-full p-2 mr-3 flex-shrink-0">
              <AlertTriangle className="text-white w-4 h-4" />
            </div>
            <div>
              <h3 className="text-blue-800 font-semibold text-sm">{t('forgot_password.secure_reset')}</h3>
              <p className="text-blue-700 text-sm mt-1">
                {t('forgot_password.secure_reset_description')}
              </p>
            </div>
          </div>

          {/* Need Help Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start">
            <div className="bg-gray-500 rounded-full p-2 mr-3 flex-shrink-0">
              <Mail className="text-white w-4 h-4" />
            </div>
            <div>
              <h3 className="text-gray-800 font-semibold text-sm">{t('forgot_password.need_help')}</h3>
              <p className="text-gray-700 text-sm mt-1">
                {t('forgot_password.need_help_description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
    </>
  );
}
