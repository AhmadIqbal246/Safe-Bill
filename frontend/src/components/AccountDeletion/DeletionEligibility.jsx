import React from 'react';

const DeletionEligibility = ({ eligibility }) => {
  if (!eligibility || eligibility.can_delete) {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Account Deletion Not Eligible</h3>
          <p className="text-red-700 mb-4">{eligibility.message}</p>
          
          <div className="space-y-3">
            {eligibility.active_projects > 0 && (
              <div className="flex items-center justify-between bg-red-100 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-red-800 font-medium">Active Projects</span>
                </div>
                <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {eligibility.active_projects}
                </span>
              </div>
            )}
            
            {eligibility.pending_payments > 0 && (
              <div className="flex items-center justify-between bg-red-100 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-red-800 font-medium">Pending Payments</span>
                </div>
                <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-sm font-semibold">
                  {eligibility.pending_payments}
                </span>
              </div>
            )}
            
            {eligibility.active_disputes > 0 && (
              <div className="flex items-center justify-between bg-red-100 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800 font-medium">Active Disputes</span>
                </div>
                <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-sm font-semibold">
                  {eligibility.active_disputes}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-4 bg-red-100 rounded-lg">
            <h4 className="text-red-800 font-semibold mb-3">❌ Account Deletion Not Eligible</h4>
            <p className="text-red-700 text-sm mb-3">Your account cannot be deleted at this time due to the following restrictions:</p>
            
            <div className="space-y-2">
              {eligibility.active_projects > 0 && (
                <div className="flex items-center justify-between bg-red-200 rounded-lg p-2">
                  <span className="text-red-800 text-sm">Active Projects</span>
                  <span className="bg-red-300 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    {eligibility.active_projects}
                  </span>
                </div>
              )}
              {eligibility.pending_payments > 0 && (
                <div className="flex items-center justify-between bg-red-200 rounded-lg p-2">
                  <span className="text-red-800 text-sm">Pending Payments</span>
                  <span className="bg-red-300 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    {eligibility.pending_payments}
                  </span>
                </div>
              )}
              {eligibility.active_disputes > 0 && (
                <div className="flex items-center justify-between bg-red-200 rounded-lg p-2">
                  <span className="text-red-800 text-sm">Active Disputes</span>
                  <span className="bg-red-300 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                    {eligibility.active_disputes}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-red-200 rounded-lg">
              <h5 className="text-red-800 font-semibold mb-2">To delete your account, you need to:</h5>
              <ul className="text-red-700 text-sm space-y-1">
                {eligibility.active_projects > 0 && (
                  <li>• Complete or cancel all active projects</li>
                )}
                {eligibility.pending_payments > 0 && (
                  <li>• Wait for all pending payments to be processed</li>
                )}
                {eligibility.active_disputes > 0 && (
                  <li>• Resolve all active disputes</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletionEligibility;
