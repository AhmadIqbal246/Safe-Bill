import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState('');
  
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Check if we have the required parameters
  useEffect(() => {
    if (!uid || !token) {
      setShowError(true);
      setMessage(t('reset_password.invalid_reset_link'));
    }
  }, [uid, token]);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const strength = Object.values(checks).filter(Boolean).length;
    setPasswordStrength(strength);

    const errors = [];
    if (!checks.length) errors.push('At least 8 characters');
    if (!checks.lowercase) errors.push('At least one lowercase letter');
    if (!checks.uppercase) errors.push('At least one uppercase letter');
    if (!checks.numbers) errors.push('At least one number');
    if (!checks.special) errors.push('At least one special character');

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'text-red-500';
    if (passwordStrength <= 3) return 'text-yellow-500';
    if (passwordStrength <= 4) return 'text-blue-500';
    return 'text-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return t('reset_password.weak');
    if (passwordStrength <= 3) return t('reset_password.fair');
    if (passwordStrength <= 4) return t('reset_password.good');
    return t('reset_password.strong');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword.trim()) {
      setShowError(true);
      setMessage(t('reset_password.please_enter_password'));
      return;
    }

    if (passwordErrors.length > 0) {
      setShowError(true);
      setMessage(t('reset_password.fix_password_requirements'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setShowError(true);
      setMessage(t('reset_password.passwords_dont_match'));
      return;
    }

    setIsLoading(true);
    setShowError(false);
    setShowSuccess(false);

    try {
      const response = await axios.post(
        `${backendBaseUrl}api/accounts/password-reset-confirm/`,
        {
          uid: uid,
          token: token,
          new_password: formData.newPassword
        }
      );
      
      setShowSuccess(true);
      setMessage(response.data.detail || t('reset_password.password_reset_success'));
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setShowError(true);
      setMessage(
        error.response?.data?.detail || 
        t('reset_password.failed_to_reset')
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <>
        <SafeBillHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t('reset_password.invalid_reset_link_title')}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center text-[#1e3a8a] hover:text-[#1e40af] font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('reset_password.request_new_reset_link')}
          </Link>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <SafeBillHeader />
    <div className="min-h-screen flex items-center justify-center px-4 py-15">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative">
          {/* Header Icon */}
          <div className="flex justify-center -mt-16 mb-6">
            <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] rounded-full p-4 flex items-center justify-center shadow-lg">
              <Lock className="text-white w-8 h-8" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('reset_password.title')}</h1>
            <p className="text-gray-600 text-base leading-relaxed">
              {t('reset_password.description')}
            </p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
              <CheckCircle className="text-green-600 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">Success</p>
                <p className="text-green-700 text-sm mt-1">{message}</p>
                <p className="text-green-600 text-xs mt-2">{t('reset_password.redirecting_to_login')}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertTriangle className="text-red-600 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm mt-1">{message}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Input */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('reset_password.new_password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all duration-200"
                  placeholder={t('reset_password.new_password_placeholder')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{t('reset_password.password_strength')}:</span>
                    <span className={`text-sm font-semibold ${getPasswordStrengthColor()}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength <= 2 ? 'bg-red-500' :
                        passwordStrength <= 3 ? 'bg-yellow-500' :
                        passwordStrength <= 4 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('reset_password.confirm_new_password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all duration-200"
                  placeholder={t('reset_password.confirm_new_password_placeholder')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-2">
                  {formData.newPassword === formData.confirmPassword ? (
                    <p className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t('reset_password.passwords_match')}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {t('reset_password.passwords_dont_match')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-[#1e3a8a]" />
                {t('reset_password.password_requirements')}
              </h3>
              <div className="space-y-2">
                {[
                  { text: t('reset_password.at_least_8_characters'), check: formData.newPassword.length >= 8 },
                  { text: t('reset_password.at_least_one_lowercase'), check: /[a-z]/.test(formData.newPassword) },
                  { text: t('reset_password.at_least_one_uppercase'), check: /[A-Z]/.test(formData.newPassword) },
                  { text: t('reset_password.at_least_one_number'), check: /\d/.test(formData.newPassword) },
                  { text: t('reset_password.at_least_one_special'), check: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) }
                ].map((requirement, index) => (
                  <div key={index} className="flex items-center text-sm">
                    {requirement.check ? (
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 mr-2 rounded-full border-2 border-gray-300"></div>
                    )}
                    <span className={requirement.check ? 'text-green-700' : 'text-gray-500'}>
                      {requirement.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || passwordErrors.length > 0 || formData.newPassword !== formData.confirmPassword || !formData.newPassword.trim()}
              className="w-full bg-gradient-to-r bg-[#01257D] hover:bg-[#2346a0] text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('reset_password.resetting_password')}
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  {t('reset_password.reset_password')}
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
              className="inline-flex items-center text-[#01257D] hover:text-[#2346a0] font-medium transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              {t('reset_password.back_to_login')}
            </Link>
          </div>
        </div>

        {/* Information Card */}
        <div className="mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
            <div className="bg-blue-500 rounded-full p-2 mr-3 flex-shrink-0">
              <Shield className="text-white w-4 h-4" />
            </div>
            <div>
              <h3 className="text-blue-800 font-semibold text-sm">{t('reset_password.security_notice')}</h3>
              <p className="text-blue-700 text-sm mt-1">
                {t('reset_password.security_notice_description')}
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
