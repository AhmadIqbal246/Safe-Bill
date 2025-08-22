import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react'; // or your preferred icon
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function EmailVerificationComp() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    async function verifyEmail() {
      try {
        const res = await axios.get(
          `${backendBaseUrl}api/accounts/verify-email/?uid=${uid}&token=${token}`
        );
        setStatus('success');
        setMessage(res.data.detail || t('email_verification.email_verified'));
        setTimeout(() => navigate('/login'), 2000);
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.detail ||
          t('email_verification.verification_failed_message')
        );
      }
    }
    if (uid && token) verifyEmail();
    else {
      setStatus('error');
      setMessage(t('email_verification.invalid_link'));
    }
  }, [uid, token, navigate, t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md border border-gray-200 relative">
        <div className="flex justify-center -mt-14 mb-4">
          <div className="bg-[#01257D] rounded-full p-5 flex items-center justify-center">
            <Mail className="text-white w-10 h-10" />
          </div>
        </div>
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-[#01257D] mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-lg font-medium text-gray-900">{t('email_verification.verifying_email')}</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('email_verification.email_verification')}</h2>
            <p className="text-gray-500 text-center">
              {message}
            </p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">{t('email_verification.verification_failed')}</h2>
            <p className="text-gray-500 text-center">
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailVerificationComp
