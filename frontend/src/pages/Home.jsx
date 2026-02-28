import React from 'react'
import { useState } from 'react'
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar'
import IntroWithSearch from '../components/HomePageComps/IntroWithSearch'
import FeatureComp from '../components/HomePageComps/FeatureComp'
import TrustedProfessionals from '../components/HomePageComps/TrustedProfessionals'
import ServicesCards from '../components/HomePageComps/ServicesCards'
import Footer from '../components/mutualComponents/Footer'
import HowItWorks from '../components/HomePageComps/HowItWorks'
import WhyChooseUs from '../components/HomePageComps/WhyChooseUs'

export default function Home() {
    const [isSignedIn, setIsSignedIn] = useState(false)

    const handleSignIn = () => {
      setIsSignedIn(true)
    }
  
    const handleJoinNow = () => {
      setIsSignedIn(true)
    }
  
    const handleSignOut = () => {
      setIsSignedIn(false)
    }
  
    return (
      <div className="min-h-screen bg-gray-50">
        <SafeBillHeader
          isSignedIn={isSignedIn}
          userAvatar="/placeholder.svg?height=32&width=32"
          userName="John Doe"
          onSignIn={handleSignIn}
          onJoinNow={handleJoinNow}
          onSignOut={handleSignOut}
        />
        <IntroWithSearch/>
        <HowItWorks/>
        <WhyChooseUs/>
        <FeatureComp/>
        <TrustedProfessionals/>
        <ServicesCards/>
        <Footer/>

      </div>
    )
}
