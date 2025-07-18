import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import SellerRegisterPage from "./pages/SellerRegisterPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import LogInPage from "./pages/LogInPage";

import Profile from "./pages/Profile";
import Directory from "./pages/Directory"
import SellerDashboard from "./pages/Seller-Dashboard/Dashboard"

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
          <Route path='/profile' element={<Profile/>}/>
          <Route path='/directory' element={<Directory/>}/>
          <Route path='/seller-dashboard' element={<SellerDashboard/>}/>
          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </>
  );
}

export default App;
