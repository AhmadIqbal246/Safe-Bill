import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react'; // or your preferred icon
import axios from 'axios';

function EmailVerificationComp() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  useEffect(() => {
    async function verifyEmail() {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/accounts/verify-email/?uid=${uid}&token=${token}`
        );
        setStatus('success');
        setMessage(res.data.detail || 'Your email has been verified!');
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.detail ||
          'Verification failed. The link may be invalid or expired.'
        );
      }
    }
    if (uid && token) verifyEmail();
    else {
      setStatus('error');
      setMessage('Invalid verification link.');
    }
  }, [uid, token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md border border-gray-200 relative">
        <div className="flex justify-center -mt-14 mb-4">
          <div className="bg-[#0A1128] rounded-full p-5 flex items-center justify-center">
            <Mail className="text-white w-10 h-10" />
          </div>
        </div>
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-[#0A1128] mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-lg font-medium text-gray-900">Verifying your email...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verfication.</h2>
            <p className="text-gray-500 text-center">
              {message}
            </p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Verification Failed</h2>
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
