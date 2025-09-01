import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Check, Copy, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function EmailVerificationComp() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('form'); // 'form', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Auto-verify if URL contains uid and token
  useEffect(() => {
    if (uid && token) {
      setVerificationToken(token);
      handleVerifyEmail();
    }
  }, [uid, token]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyEmail = async () => {
    if (!verificationToken.trim()) {
      setShowError(true);
      setMessage('Please enter a verification token');
      return;
    }

    setStatus('loading');
    setShowError(false);
    setShowSuccess(false);

    try {
      const res = await axios.post(
        `${backendBaseUrl}api/accounts/verify-email/`,
        { token: verificationToken }
      );
      
      setStatus('success');
      setShowSuccess(true);
      setMessage(res.data.detail || 'Email verified successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setShowError(true);
      setMessage(
        err.response?.data?.detail ||
        'Verification failed. Please check your token and try again.'
      );
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail.trim()) {
      setShowError(true);
      setMessage('Please enter your email address');
      return;
    }

    setIsResending(true);
    setShowError(false);

    try {
      const res = await axios.post(
        `${backendBaseUrl}api/accounts/resend-verification/`,
        { email: resendEmail }
      );
      
      setShowSuccess(true);
      setMessage(res.data.detail || 'Verification email sent successfully!');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err) {
      setShowError(true);
      setMessage(
        err.response?.data?.detail ||
        'Failed to send verification email. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(verificationToken);
    // You could add a toast notification here
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-15">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-gray-100 relative">
        {/* Header Icon */}
        <div className="flex justify-center -mt-16 mb-6">
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] rounded-full p-4 flex items-center justify-center shadow-lg">
            <Mail className="text-white w-8 h-8" />
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600 text-sm">Please check your email and enter the verification code below</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <Check className="text-green-600 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}

        {/* Error Message */}
        {showError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertTriangle className="text-red-600 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-800 text-sm">{message}</p>
          </div>
        )}

        {/* Loading State */}
        {status === 'loading' && (
          <div className="flex flex-col items-center py-8">
            <svg className="animate-spin h-8 w-8 text-[#1e3a8a] mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-lg font-medium text-gray-900">Verifying your email...</p>
          </div>
        )}

        {/* Main Form */}
        {status === 'form' && (
          <>
            {/* Verification Token Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Token
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent pr-12"
                  placeholder="Enter your verification token"
                />
                {verificationToken && (
                  <button
                    onClick={copyToken}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyEmail}
              disabled={!verificationToken.trim()}
              className="w-full bg-[#1e3a8a] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#1e40af] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              <Check className="w-5 h-5 mr-2" />
              Verify Email
            </button>

            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">Or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Resend Verification Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resend verification to
              </label>
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            {/* Resend Button */}
            <button
              onClick={handleResendVerification}
              disabled={!resendEmail.trim() || isResending || resendCooldown > 0}
              className="w-full border-2 border-[#1e3a8a] text-[#1e3a8a] py-3 px-4 rounded-lg font-medium hover:bg-[#1e3a8a] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock className="w-5 h-5 mr-2" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Resend Verification
                </>
              )}
            </button>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => setStatus('form')}
              className="text-[#1e3a8a] hover:text-[#1e40af] font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Information Boxes */}
        <div className="mt-8 space-y-4">
          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
            <AlertTriangle className="text-blue-600 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-blue-800 text-sm font-medium">Security Notice</p>
              <p className="text-blue-700 text-sm">Verification tokens expire after 24 hours for your security.</p>
            </div>
          </div>

          {/* Help Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start">
            <Clock className="text-gray-600 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-gray-800 text-sm font-medium">Need Help?</p>
              <p className="text-gray-700 text-sm">Check your spam folder or contact support if you don't receive the email.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationComp
