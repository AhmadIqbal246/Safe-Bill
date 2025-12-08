import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { logout, checkDeletionEligibility, deleteUserAccount } from '../../store/slices/AuthSlices';
import DeletionEligibility from './DeletionEligibility';
import SafeBillHeader from '../mutualComponents/Navbar/Navbar';

const DeleteAccount = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { accountDeletion } = useSelector(state => state.auth);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check eligibility on component mount
  useEffect(() => {
    dispatch(checkDeletionEligibility());
  }, [dispatch]);

  // Handle eligibility response
  useEffect(() => {
    if (accountDeletion.eligibility) {
      setStep(2);
    }
  }, [accountDeletion.eligibility]);

  // Handle deletion success
  useEffect(() => {
    if (accountDeletion.deletionSuccess) {
      toast.success(t('account_deletion.deleted_successfully'));
      setSuccess(true);
      setStep(5);
      
      setTimeout(() => {
        localStorage.removeItem('token');
        dispatch(logout());
        window.location.href = '/';
      }, 3000);
    }
  }, [accountDeletion.deletionSuccess, dispatch, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.password) {
      setError(t('account_deletion.password_required'));
      return;
    }
    
    if (!formData.confirmPassword) {
      setError(t('account_deletion.confirm_password_required'));
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('account_deletion.passwords_not_match'));
      return;
    }

    setStep(4);
  };

  const handleConfirmDeletion = async () => {
    setError('');
    dispatch(deleteUserAccount(formData));
  };

  const handleCancel = () => {
    setStep(1);
    setFormData({ password: '', confirmPassword: '' });
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    dispatch(checkDeletionEligibility());
  };

  const handleContinueToDeletion = () => {
    setStep(3);
  };

  if (success) {
    return (
      <>
        <SafeBillHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 md:p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{t('account_deletion.deleted_successfully')}</h2>
            <p className="text-gray-600 mb-6">{t('account_deletion.account_permanently_deleted')}</p>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#01257D] mr-2"></div>
              {t('account_deletion.redirecting')}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SafeBillHeader />
      <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#01257D] to-[#2346a0] px-4 md:px-6 py-4">
              <h1 className="text-xl md:text-2xl font-bold text-white">{t('account_deletion.title')}</h1>
              <p className="text-blue-100 mt-1 text-sm">{t('account_deletion.subtitle')}</p>
            </div>
            
            {/* Content */}
            <div className="p-4 md:p-6">
              {/* Step 1: Eligibility Check */}
              {step === 1 && (
                <div>
                  {accountDeletion.loading && (
                    <div className="text-center py-8 md:py-12">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-[#01257D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-[#01257D]"></div>
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{t('account_deletion.checking_eligibility')}</h3>
                      <p className="text-sm md:text-base text-gray-600">{t('account_deletion.please_wait')}</p>
                    </div>
                  )}
                  
                  {accountDeletion.error && (
                    <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-red-800">{t('account_deletion.error_title')}</h3>
                          <p className="text-sm text-red-700 mt-1">{accountDeletion.error.detail || t('account_deletion.failed_to_check')}</p>
                          <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => dispatch(checkDeletionEligibility())}
                              className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              {t('account_deletion.retry')}
                            </button>
                            <button
                              onClick={() => window.history.back()}
                              className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              {t('account_deletion.back_to_dashboard')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Eligibility Display */}
              {step === 2 && (
                <div>
                  {accountDeletion.eligibility && !accountDeletion.eligibility.can_delete && (
                    <DeletionEligibility eligibility={accountDeletion.eligibility} />
                  )}
                  
                  {accountDeletion.eligibility && accountDeletion.eligibility.can_delete && (
                    <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4 md:p-6 mb-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3 md:ml-4 flex-1">
                          <h3 className="text-base md:text-lg font-semibold text-green-800 mb-2">{t('account_deletion.eligible_title')}</h3>
                          <p className="text-sm md:text-base text-green-700 mb-4">{t('account_deletion.eligible_message')}</p>
                          
                          <div className="bg-green-100 rounded-lg p-3 md:p-4 mb-4">
                            <h4 className="text-sm md:text-base text-green-800 font-semibold mb-3 flex items-center">
                              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t('account_deletion.eligibility_criteria_met')}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="flex items-center text-green-700 text-xs md:text-sm">
                                <svg className="w-3 h-3 md:w-4 md:h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {t('account_deletion.no_active_projects')}
                              </div>
                              <div className="flex items-center text-green-700 text-xs md:text-sm">
                                <svg className="w-3 h-3 md:w-4 md:h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {t('account_deletion.no_pending_payments')}
                              </div>
                              <div className="flex items-center text-green-700 text-xs md:text-sm">
                                <svg className="w-3 h-3 md:w-4 md:h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {t('account_deletion.no_active_disputes')}
                              </div>
                              <div className="flex items-center text-green-700 text-xs md:text-sm">
                                <svg className="w-3 h-3 md:w-4 md:h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {t('account_deletion.no_outstanding_balances')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <button
                              onClick={handleContinueToDeletion}
                              className="bg-[#01257D] text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-[#2346a0] transition-colors duration-200 font-medium text-sm md:text-base cursor-pointer"
                            >
                              {t('account_deletion.continue_to_deletion')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Deletion Form */}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{t('account_deletion.confirm_deletion')}</h3>
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">{t('account_deletion.enter_password')}</p>
                    
                    <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-3 md:p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-red-800 mb-2">{t('account_deletion.warning_title')}</h4>
                          <div className="mt-2 text-xs md:text-sm text-red-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>{t('account_deletion.warning_data_deleted')}</li>
                              <li>{t('account_deletion.warning_cannot_recover')}</li>
                              <li>{t('account_deletion.warning_lost')}</li>
                              <li>{t('account_deletion.warning_cannot_undo')}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                          {t('account_deletion.password_label')}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full px-3 md:px-4 py-2 md:py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] ${
                              formData.password ? 'border-[#01257D]' : 'border-gray-300'
                            }`}
                            placeholder={t('account_deletion.enter_your_password')}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                          {t('account_deletion.confirm_password_label')}
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`w-full px-3 md:px-4 py-2 md:py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] ${
                              formData.confirmPassword ? 'border-[#01257D]' : 'border-gray-300'
                            }`}
                            placeholder={t('account_deletion.confirm_your_password')}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
                              <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        
                        {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                          <div className="mt-2 flex items-center text-xs md:text-sm">
                            <svg className="h-3 w-3 md:h-4 md:w-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-600">{t('account_deletion.passwords_not_match')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {(error || accountDeletion.deletionError) && (
                      <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-3 md:p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-xs md:text-sm font-medium text-red-800">{t('account_deletion.error_title')}</h3>
                            <p className="text-xs md:text-sm text-red-700 mt-1">
                              {error || accountDeletion.deletionError?.detail || 'An error occurred'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4 md:pt-6 justify-end">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm md:text-base cursor-pointer"
                      >
                        {t('account_deletion.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={accountDeletion.deletionLoading || formData.password !== formData.confirmPassword}
                        className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base cursor-pointer"
                      >
                        {t('account_deletion.continue_to_confirmation')}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Step 4: Final Confirmation */}
              {step === 4 && (
                <div className="space-y-4 md:space-y-6">
                  <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 md:p-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 md:ml-4">
                        <h3 className="text-lg md:text-xl font-bold text-red-800 mb-2">{t('account_deletion.final_confirmation_title')}</h3>
                        <p className="text-sm md:text-base text-red-700 mb-4">
                          {t('account_deletion.final_confirmation_message')}
                        </p>
                        <div className="bg-red-100 rounded-lg p-3">
                          <p className="text-red-800 text-xs md:text-sm font-medium mb-1">{t('account_deletion.will_delete')}</p>
                          <ul className="text-red-700 text-xs md:text-sm space-y-1">
                            <li>• {t('account_deletion.delete_account')}</li>
                            <li>• {t('account_deletion.delete_projects')}</li>
                            <li>• {t('account_deletion.delete_messages')}</li>
                            <li>• {t('account_deletion.delete_data')}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-end">
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm md:text-base cursor-pointer"
                    >
                      {t('account_deletion.go_back')}
                    </button>
                    <button
                      onClick={handleConfirmDeletion}
                      disabled={accountDeletion.deletionLoading}
                      className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-[#01257D] text-white  rounded-lg  disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base cursor-pointer"
                    >
                      {accountDeletion.deletionLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2 "></div>
                          {t('account_deletion.deleting')}
                        </div>
                      ) : (
                        t('account_deletion.yes_delete_account')
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Processing */}
              {step === 5 && accountDeletion.deletionLoading && (
                <div className="text-center py-8 md:py-12">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-[#01257D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-[#01257D]"></div>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{t('account_deletion.deleting_account')}</h3>
                  <p className="text-sm md:text-base text-gray-600">{t('account_deletion.processing_deletion')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteAccount;