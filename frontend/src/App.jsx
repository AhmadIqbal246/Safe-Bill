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
import DashboardPage from "./pages/DashboardPage";
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
          <Route path='/dashboard' element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
          <Route path='/my-quotes' element={<ProtectedRoute><MyQuotesPage/></ProtectedRoute>}/>
          <Route path='/project-creation' element={<ProtectedRoute><ProjectCreationPage/></ProtectedRoute>}/>
          <Route path='/current-projects' element={<ProtectedRoute><CurrentProjects/></ProtectedRoute>}/>
          <Route path='/completed-projects' element={<ProtectedRoute><CompletedProjects/></ProtectedRoute>}/>
          <Route path='/profile' element={<ProtectedRoute><MyProfile/></ProtectedRoute>}/>
          <Route path='/my-documents' element={<ProtectedRoute><MyDocuments/></ProtectedRoute>}/>
          <Route path='/support' element={<Support/>}/>
          <Route path='/project-invite' element={<ProtectedRoute><InviteViewProject/></ProtectedRoute>}/>
          <Route path='/professional-buyer' element={<ProfessionalBuyerPage/>}/>
          
          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </>
  );
}

export default App;
