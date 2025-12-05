import React from 'react'
import Billings from '../components/Billings/Billings'
import MainLayout from '../components/Layout/MainLayout'
import { useSelector } from 'react-redux';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import loginBg from '../assets/Circle Background/login-removed-bg.jpg';

export default function BillingsPage() {
    const { user } = useSelector(state => state.auth);
  return (
    <>
      {/* Scrollable Background Image Layer - covers entire viewport */}
      <div
        className="absolute inset-0 -z-10 bg-top bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      {user?.role === 'seller' ? (
        <MainLayout mainBackgroundClass="">
          <Billings/> 
        </MainLayout>
      ) : (
        <>
          <SafeBillHeader/>
          <Billings/>
        </>
      )}
    </>
  )
}
