import React from 'react'
import ProfFilterComponent from '../components/FindProfessional/ProfFilterComponent'
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar'
import Footer from '../components/mutualComponents/Footer'
import GeoFilterComponent from '../components/FindProfessional/GeoFilterComponent'

export default function FindProfessionals() {
  return (
    <div>
      <SafeBillHeader/>
      <ProfFilterComponent/>
      <GeoFilterComponent/>
      <Footer/>
    </div>
  )
}
