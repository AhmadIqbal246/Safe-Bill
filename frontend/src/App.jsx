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

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FloatingAIAssistant from "./components/mutualComponents/FloatingAIAssistant";
import { useSelector } from "react-redux";

function App() {
  const user = useSelector(state => state.auth.user);
  const isAuthenticated = !!user;

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
          <Route path='/email-verification' element={<EmailVerificationPage />} />
          <Route path='/login' element={<LogInPage />} />
          <Route path='/onboarding' element={<ProtectedRoute><OnBoardingPage /></ProtectedRoute>} />
          <Route path='/find-professionals' element={<ProtectedRoute><FindProfessionals /></ProtectedRoute>} />

          {/* Add more routes as needed */}
        </Routes>
        {isAuthenticated && <FloatingAIAssistant />}
      </Router>
    </>
  );
}

export default App;
