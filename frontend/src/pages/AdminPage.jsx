import React from 'react';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import AdminDashboard from '../components/Admin/AdminDashboard';

export default function AdminPage() {
  return (
    <>
      <SafeBillHeader />
      <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
        <AdminDashboard />
      </div>
    </>
  );
}

