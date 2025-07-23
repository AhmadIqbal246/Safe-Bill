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
          <Route path='/email-verification' element={<EmailVerificationPage/>}/>
          <Route path='/login' element={<LogInPage/>}/>
          <Route path='/onboarding' element={<ProtectedRoute><OnBoardingPage/></ProtectedRoute>}/>
          <Route path='/find-professionals' element={<ProtectedRoute><FindProfessionals/></ProtectedRoute>}/>
          <Route path='/dashboard' element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
          <Route path='/my-quotes' element={<ProtectedRoute><MyQuotesPage/></ProtectedRoute>}/>


          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </>
  );
}

export default App;
