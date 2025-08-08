import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchClientProjects } from '../store/slices/ProjectSlice';
import DashboardSummary from '../components/BuyerDashboard/DashboardSummary';
import CurrentProjects from '../components/BuyerDashboard/CurrentProjects';
import MilestoneApproval from '../components/BuyerDashboard/MilestoneApproval';
import PaymentTracking from '../components/BuyerDashboard/PaymentTracking';
import DocumentsSection from '../components/BuyerDashboard/DocumentsSection';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';

export default function BuyerDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { clientProjects, clientProjectsLoading, clientProjectsError } = useSelector(
    (state) => state.project
  );

  useEffect(() => {
    dispatch(fetchClientProjects());
  }, [dispatch]);

  // Calculate dashboard stats from client projects
  const activeProjects = clientProjects.filter(project => 
    project.status === 'active' || !project.status
  ).length;
  
  const completedProjects = clientProjects.filter(project => 
    project.status === 'completed'
  ).length;
  
  const pendingPayments = clientProjects.filter(project => 
    project.payment_status === 'pending'
  ).length;

  const dashboardStats = {
    activeProjects,
    completedProjects,
    pendingPayments
  };

  if (clientProjectsLoading) {
    return (
      <>
        <SafeBillHeader />
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
          <div>Loading dashboard...</div>
        </div>
      </>
    );
  }

  if (clientProjectsError) {
    return (
      <>
        <SafeBillHeader />
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
          <div>Error loading dashboard: {clientProjectsError}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <SafeBillHeader />
      <div className="p-4 sm:p-8 min-h-screen w-full max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-1">Buyer Dashboard</h2>
            <div className="text-gray-500">Track and manage your service projects</div>
          </div>
          <button 
            onClick={() => navigate('/disputes')}
            className="mt-4 sm:mt-0 px-6 py-3 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] transition-colors font-medium cursor-pointer"
          >
            View All Disputes
          </button>
        </div>
        
        {/* Dashboard Summary - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <DashboardSummary stats={dashboardStats} />
        </div>
        
        {/* Main Content - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <CurrentProjects projects={clientProjects} />
          <MilestoneApproval />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <PaymentTracking projects={clientProjects} />
          <DocumentsSection projects={clientProjects} />
        </div>
        
        <div className="flex justify-center mt-8 sm:mt-10">
          <button className="bg-[#153A7D] text-white border-none rounded-lg px-6 sm:px-8 py-3 font-medium text-sm sm:text-base cursor-pointer hover:bg-[#1a4086] transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </>
  );
}