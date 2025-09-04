import React from 'react'
import Billings from '../components/Billings/Billings'
import MainLayout from '../components/Layout/MainLayout'
import { useSelector } from 'react-redux';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';

export default function BillingsPage() {
    const { user } = useSelector(state => state.auth);
  return (
    <>
    {user?.role === 'seller' ? (
    <MainLayout>
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
