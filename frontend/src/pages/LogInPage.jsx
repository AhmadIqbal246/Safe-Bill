import React from 'react'
import LogInComp from '../components/AuthComponents/LogInComp'
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar'
import Footer from '../components/mutualComponents/Footer'

export default function LogInPage() {
  return (
    <div>
      <SafeBillHeader/>
      <LogInComp/>
      <Footer/>
    </div>
  )
}
