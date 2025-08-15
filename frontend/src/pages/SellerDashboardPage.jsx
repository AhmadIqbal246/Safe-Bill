import React from 'react';
import MainLayout from '../components/Layout/MainLayout';
import Dashboard from '../components/SellerDashboard/Dashboard';
import Chat from '../components/mutualComponents/Chat/Chat';

export default function DashboardPage() {

  return (
    <MainLayout>
        <Dashboard/>
        <Chat />
    </MainLayout>
  );
}
