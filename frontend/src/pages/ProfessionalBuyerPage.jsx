import React from 'react'
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar'
import SellerRegisterFlow from '../components/RegisterComponents/SellerReg/SellerRegisterFlow'

export default function ProfessionalBuyerPage() {
  return (
    <div>
        <SafeBillHeader />
        <SellerRegisterFlow role="professional-buyer" />
    </div>
  )
}
