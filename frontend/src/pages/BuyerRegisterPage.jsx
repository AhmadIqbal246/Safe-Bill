import React from 'react'
import BuyerRegisterComp from '../components/RegisterComponents/BuyerReg/BuyerRegisterComp'
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar'
import Footer from '../components/mutualComponents/Footer'

export default function BuyerRegisterPage() {
  return (
    <div>
      <SafeBillHeader />
      <BuyerRegisterComp />
      <Footer/>
    </div>
  )
}
