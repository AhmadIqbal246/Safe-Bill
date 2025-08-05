import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function NotAuthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-red-100 rounded-full p-3">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page. This area is restricted to sellers only.
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => navigate('/')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#01257D] hover:bg-[#2346a0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01257D] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
} 