import React from 'react'
import SellerRegisterFlow from '../components/RegisterComponents/SellerReg/SellerRegisterFlow'
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar'
import Footer from '../components/mutualComponents/Footer'

export default function SellerRegisterPage() {
  return (
    <div>
        <SafeBillHeader />
        <SellerRegisterFlow role="seller" />
        <Footer/>
    </div>
  )
}
