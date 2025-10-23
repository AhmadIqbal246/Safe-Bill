import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, checkDeletionEligibility, deleteUserAccount } from '../../store/slices/AuthSlices';
import DeletionEligibility from './DeletionEligibility';

const DeleteAccount = () => {
  const dispatch = useDispatch();
  const { accountDeletion } = useSelector(state => state.auth);
  const [step, setStep] = useState(1); // 1: eligibility check, 2: eligibility display, 3: form, 4: confirmation, 5: processing
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
      setStep(2); // Move to eligibility display
    }
  }, [accountDeletion.eligibility]);

  // Handle deletion success
  useEffect(() => {
    if (accountDeletion.deletionSuccess) {
      setSuccess(true);
      setStep(5);
      
      // Clear token and logout after successful deletion
      localStorage.removeItem('token');
      dispatch(logout());
      
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  }, [accountDeletion.deletionSuccess, dispatch]);

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
      setError('Password is required');
      return;
    }
    
    if (!formData.confirmPassword) {
      setError('Confirm password is required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setStep(4); // Move to confirmation
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
    // Re-check eligibility when canceling
    dispatch(checkDeletionEligibility());
  };

  const handleContinueToDeletion = () => {
    setStep(3); // Move to password form
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Deleted Successfully</h2>
          <p className="text-gray-600 mb-6">Your account has been permanently deleted.</p>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#01257D] mr-2"></div>
            Redirecting to home page...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#01257D] to-[#2346a0] px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Delete My Account</h1>
            <p className="text-blue-100 mt-1">Permanently remove your account and all associated data</p>
          </div>
          <div className="p-6">
            {/* Step 1: Eligibility Check */}
          {step === 1 && (
            <div>
              {accountDeletion.loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#01257D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01257D]"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Checking Eligibility</h3>
                  <p className="text-gray-600">Please wait while we verify your account status...</p>
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
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700 mt-1">{accountDeletion.error.detail || 'Failed to check eligibility'}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => dispatch(checkDeletionEligibility())}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Retry
                        </button>
                        <button
                          onClick={() => window.history.back()}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors duration-200"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back to Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!accountDeletion.loading && !accountDeletion.error && !accountDeletion.eligibility && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#01257D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#01257D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Initializing Account Deletion</h3>
                  <p className="text-gray-600 mb-6">Preparing to check your account status...</p>
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                  </button>
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
                <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-6 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Account Deletion Eligible</h3>
                      <p className="text-green-700 mb-4">Your account meets all requirements for deletion.</p>
                      
                      <div className="bg-green-100 rounded-lg p-4 mb-4">
                        <h4 className="text-green-800 font-semibold mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Eligibility Criteria Met
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center text-green-700 text-sm">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            No active projects
                          </div>
                          <div className="flex items-center text-green-700 text-sm">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            No pending payments
                          </div>
                          <div className="flex items-center text-green-700 text-sm">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            No active disputes
                          </div>
                          <div className="flex items-center text-green-700 text-sm">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            No outstanding balances
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={handleContinueToDeletion}
                          className="bg-[#01257D] text-white px-6 py-3 rounded-lg hover:bg-[#2346a0] transition-colors duration-200 font-medium"
                        >
                          Continue to Deletion
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm Account Deletion</h3>
                <p className="text-gray-600 mb-6">Please enter your password to confirm this irreversible action.</p>
                
                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800">Warning: This action is irreversible</h4>
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>All your data will be permanently deleted</li>
                          <li>You cannot recover your account</li>
                          <li>All projects, payments, and messages will be lost</li>
                          <li>This action cannot be undone</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent transition-all duration-200 ${
                          formData.password ? 'border-[#01257D]' : 'border-gray-300'
                        }`}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent transition-all duration-200 ${
                          formData.confirmPassword ? 'border-[#01257D]' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {/* Password mismatch error under confirm password */}
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <div className="mt-2 flex items-center">
                        <svg className="h-4 w-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-600 text-sm">Passwords do not match</p>
                      </div>
                    )}
                  </div>
                </div>

                {(error || accountDeletion.deletionError) && (
                  <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <p className="text-sm text-red-700 mt-1">
                          {error || accountDeletion.deletionError?.detail || 'An error occurred'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 sm:flex-none px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={accountDeletion.deletionLoading || formData.password !== formData.confirmPassword}
                    className="flex-1 sm:flex-none px-6 py-3 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  >
                    Continue to Confirmation
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Step 4: Final Confirmation */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-red-800 mb-2">Final Confirmation</h3>
                    <p className="text-red-700 mb-4">
                      Are you absolutely sure you want to delete your account? This action is irreversible and all your data will be permanently lost.
                    </p>
                    <div className="bg-red-100 rounded-lg p-3">
                      <p className="text-red-800 text-sm font-medium">This will permanently delete:</p>
                      <ul className="text-red-700 text-sm mt-1 space-y-1">
                        <li>• Your account and profile</li>
                        <li>• All projects and payments</li>
                        <li>• All messages and communications</li>
                        <li>• All associated data</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 sm:flex-none px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Go Back
                </button>
                <button
                  onClick={handleConfirmDeletion}
                  disabled={accountDeletion.deletionLoading}
                  className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                >
                  {accountDeletion.deletionLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Yes, Delete My Account'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Processing */}
          {step === 5 && accountDeletion.deletionLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#01257D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01257D]"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deleting Your Account</h3>
              <p className="text-gray-600">Please wait while we process your account deletion...</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
