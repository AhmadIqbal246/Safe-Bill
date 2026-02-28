import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchClientProjects } from '../store/slices/ProjectSlice';
import { fetchBalance, fetchBillings } from '../store/slices/PaymentSlice';
import DashboardSummary from '../components/BuyerDashboard/DashboardSummary';
import CurrentProjects from '../components/BuyerDashboard/CurrentProjects';
import PendingProjects from '../components/BuyerDashboard/PendingProjects';
import ApprovedProjects from '../components/BuyerDashboard/ApprovedProjects';
import MilestoneApproval from '../components/BuyerDashboard/MilestoneApproval';
import PaymentTracking from '../components/BuyerDashboard/PaymentTracking';
import DocumentsSection from '../components/BuyerDashboard/DocumentsSection';
import ReceiptsSection from '../components/BuyerDashboard/ReceiptsSection';
import CompletedProjectsSection from '../components/BuyerDashboard/CompletedProjectsSection';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import Chat from '../components/mutualComponents/Chat/Chat';
import { useTranslation } from 'react-i18next';
import CallbackForm from '../components/mutualComponents/CallbackForm';
import loginRemovedBg from '../assets/Circle Background/buyer-dashboard-bg.png';

export default function BuyerDashboardPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [callbackOpen, setCallbackOpen] = React.useState(false);
  const { clientProjects, clientProjectsLoading, clientProjectsError } = useSelector(
    (state) => state.project
  );
  const { balance, balanceLoading, balanceError, billings } = useSelector(
    (state) => state.payment
  );
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchClientProjects());
    dispatch(fetchBalance());
    // Fetch billing data for PaymentTracking component
    dispatch(fetchBillings());
  }, [dispatch, user]);

  // Calculate dashboard stats from client projects
  const activeProjects = clientProjects.filter(project => 
    project.status === 'in_progress'
  ).length;
  
  const completedProjects = clientProjects.filter(project => 
    project.status === 'completed'
  ).length;
  
  const pendingPayments = clientProjects.filter(project => 
    project.payment_status === 'pending'
  ).length;

  // Get the amount held in escrow from balance data
  const paymentsHeldForProjects = balance?.held_in_escrow || 0;
  const currency = balance?.currency || 'USD';

  const dashboardStats = {
    activeProjects,
    completedProjects,
    pendingPayments,
    paymentsHeldForProjects,
    currency
  };

  if (clientProjectsLoading) {
    return (
      <>
        <SafeBillHeader />
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
          <div className="w-full max-w-7xl mx-auto">
            {/* Loading Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold mb-1">{t('buyer_dashboard.title')}</h2>
                <div className="text-gray-500">{t('buyer_dashboard.subtitle')}</div>
              </div>
              <div className="mt-4 sm:mt-0 px-6 py-3 bg-gray-200 text-gray-400 rounded-lg font-medium">
                {t('buyer_dashboard.view_all_disputes')}
              </div>
            </div>
            
            {/* Loading Dashboard Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
            
            {/* Loading Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Loading Current Projects */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Loading Milestone Approval */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="border border-gray-100 rounded p-3">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Loading Payment Tracking */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-36 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Loading Documents Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Loading Support Button */}
            <div className="flex justify-center mt-8 sm:mt-10">
              <div className="h-12 bg-gray-200 rounded-lg w-40"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (clientProjectsError) {
    return (
      <>
        <SafeBillHeader />
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
          <div className="w-full max-w-7xl mx-auto">
            {/* Error Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold mb-1">{t('buyer_dashboard.title')}</h2>
                <div className="text-gray-500">{t('buyer_dashboard.subtitle')}</div>
              </div>
            </div>
            
            {/* Error Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-red-800 mb-2">{t('buyer_dashboard.failed_load_dashboard')}</h3>
              <p className="text-red-600 mb-4">
                {typeof clientProjectsError === 'string' ? clientProjectsError : t('buyer_dashboard.unexpected_error')}
              </p>
              <button 
                onClick={() => dispatch(fetchClientProjects())}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer"
              >
                {t('buyer_dashboard.try_again')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SafeBillHeader />
      <div className="relative -m-6 min-h-screen">
        {/* Full-page background layer */}
        <div
          className="absolute inset-0 -z-10 bg-top bg-no-repeat bg-contain md:bg-[length:100%]"
          style={{ backgroundImage: `url(${loginRemovedBg})` }}
        />
        <div className="p-4 sm:p-8 min-h-screen w-full max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="ml-6 mt-2 sm:ml-0 sm:mt-0">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-1">{t('buyer_dashboard.title')}</h2>
            <div className="text-gray-500">{t('buyer_dashboard.subtitle')}</div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mt-4 sm:mt-0">
            <button 
              onClick={() => navigate('/accept-project-invite')}
              className="px-6 py-3 bg-[#B0B0DB] text-white rounded-lg hover:bg-[#9a9ac7] transition-colors font-medium cursor-pointer w-[70%] sm:w-auto"
            >
              {t('buyer_dashboard.accept_project_invite')}
            </button>
            <button 
              onClick={() => navigate('/disputes')}
              className="px-6 py-3 bg-[#2E78A6] text-white rounded-lg hover:bg-[#256a94] transition-colors font-medium cursor-pointer w-[70%] sm:w-auto"
            >
              {t('buyer_dashboard.view_all_disputes')}
            </button>
          </div>
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
        
        {/* Pending and Approved Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <PendingProjects projects={clientProjects} />
          <ApprovedProjects projects={clientProjects} />
        </div>
                {/* Completed Projects Section */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <CompletedProjectsSection />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <PaymentTracking 
            billings={billings} 
          />
          <DocumentsSection projects={clientProjects} />
        </div>

        {/* Receipts Section */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <ReceiptsSection />
        </div>


        
        <div className="flex justify-center mt-8 sm:mt-10">
          <button className="bg-[#2E78A6] text-white border-none rounded-lg px-6 sm:px-8 py-3 font-medium text-sm sm:text-base cursor-pointer hover:bg-[#256a94] transition-colors" onClick={() => navigate('/contact-us')}>
            {t('buyer_dashboard.contact_support')}
          </button>
        </div>
        </div>
      </div>
      
      {/* Chat Component */}
      <Chat />
      <CallbackForm open={callbackOpen} onClose={() => setCallbackOpen(false)} defaultRole={'professional-buyer'} />
    </>
  );
}