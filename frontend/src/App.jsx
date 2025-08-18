import React from 'react';
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import SellerRegisterPage from "./pages/SellerRegisterPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import LogInPage from "./pages/LogInPage";
import OnBoardingPage from "./pages/OnBoardingPage";
import FindProfessionals from "./pages/FindProfessionals";
import ProtectedRoute from "./store/ProtectedRoute";
import SellerDashboardPage from "./pages/SellerDashboardPage";
import MyQuotesPage from "./pages/MyQuotesPage";
import ProjectCreationPage from "./pages/ProjectCreationPage";
import CurrentProjects from "./pages/CurrentProjects";
import CompletedProjects from "./pages/CompletedProjects";
import MyProfile from "./pages/MyProfile";
import MyDocuments from "./pages/MyDocuments";
import Support from "./pages/Support";
import InviteViewProject from "./pages/InviteViewProject";
import BuyerRegisterPage from "./pages/BuyerRegisterPage";
import ProfessionalBuyerPage from "./pages/ProfessionalBuyerPage";
import NotAuthorized from "./pages/NotAuthorized";
import BuyerDashboardPage from "./pages/BuyerDashboardPage";
import MilestonePage from "./pages/MilestonePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import DisputeSubmit from "./pages/DisputeSubmit";
import DisputesPage from "./pages/DisputesPage";
import DisputeDetailPage from "./pages/DisputeDetailPage";
import SellerDisputesPage from "./pages/SellerDisputesPage";
import AdminPage from "./pages/AdminPage";
import ProfessionalDetailPage from "./components/FindProfessional/ProfessionalDetailPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
        theme="light"
        Bounce
      />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/seller-register" element={<SellerRegisterPage />} />
          <Route path="/buyer-register" element={<BuyerRegisterPage />} />
          <Route path='/email-verification' element={<EmailVerificationPage/>}/>
          <Route path='/login' element={<LogInPage/>}/>
          <Route path='/onboarding' element={<ProtectedRoute><OnBoardingPage/></ProtectedRoute>}/>
          <Route path='/find-professionals' element={<ProtectedRoute><FindProfessionals/></ProtectedRoute>}/>
          <Route path='/seller-dashboard' element={<ProtectedRoute requiredRole="seller"><SellerDashboardPage/></ProtectedRoute>}/>
          <Route path='/my-quotes' element={<ProtectedRoute><MyQuotesPage/></ProtectedRoute>}/>
          <Route path='/project-creation' element={<ProtectedRoute requiredRole="seller"><ProjectCreationPage/></ProtectedRoute>}/>
          <Route path='/current-projects' element={<ProtectedRoute requiredRole="seller"><CurrentProjects/></ProtectedRoute>}/>
          <Route path='/completed-projects' element={<ProtectedRoute requiredRole="seller"><CompletedProjects/></ProtectedRoute>}/>
          <Route path='/profile' element={<ProtectedRoute requiredRole="seller"><MyProfile/></ProtectedRoute>}/>
          <Route path='/my-documents' element={<ProtectedRoute requiredRole="seller"><MyDocuments/></ProtectedRoute>}/>
          <Route path='/milestones' element={<ProtectedRoute requiredRole="seller"><MilestonePage/></ProtectedRoute>}/>
          <Route path='/support' element={<Support/>}/>
          <Route path='/project-invite' element={<ProtectedRoute><InviteViewProject/></ProtectedRoute>}/>
          <Route path='/professional-buyer' element={<ProfessionalBuyerPage/>}/>
          <Route path='/not-authorized' element={<NotAuthorized/>}/>
          <Route path='/buyer-dashboard' element={<ProtectedRoute requiredRole={["buyer", "professional-buyer"]}><BuyerDashboardPage/></ProtectedRoute>}/>
          <Route path='/project/:projectId' element={<ProtectedRoute requiredRole={["buyer", "professional-buyer"]}><ProjectDetailPage/></ProtectedRoute>}/>
          <Route path='/dispute-submit' element={<ProtectedRoute requiredRole={["buyer", "professional-buyer"]}><DisputeSubmit/></ProtectedRoute>}/>
          <Route path='/disputes' element={<ProtectedRoute><DisputesPage/></ProtectedRoute>}/>
          <Route path='/seller-disputes' element={<ProtectedRoute requiredRole="seller"><SellerDisputesPage/></ProtectedRoute>}/>
          <Route path='/dispute/:disputeId' element={<ProtectedRoute><DisputeDetailPage/></ProtectedRoute>}/>
          <Route path='/professional/:professionalId' element={<ProtectedRoute><ProfessionalDetailPage/></ProtectedRoute>}/>
          <Route path='/admin' element={<ProtectedRoute requiredRole="admin"><AdminPage/></ProtectedRoute>}/>
          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </>
  );
}

export default App;
