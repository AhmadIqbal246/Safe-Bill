import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ProfFilterComponent from '../components/FindProfessional/ProfFilterComponent'
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar'
import Footer from '../components/mutualComponents/Footer'
import GeoFilterComponent from '../components/FindProfessional/GeoFilterComponent'

export default function FindProfessionals() {
  const location = useLocation();
  const [initialFilters, setInitialFilters] = useState({});

  useEffect(() => {
    // Parse URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const serviceType = searchParams.get('serviceType');
    const area = searchParams.get('area');
    
    if (serviceType || area) {
      setInitialFilters({
        serviceType: serviceType || '',
        area: area || ''
      });
    }
  }, [location.search]);

  return (
    <div>
      <SafeBillHeader/>
      <ProfFilterComponent initialFilters={initialFilters} />
      <GeoFilterComponent/>
      <Footer/>
    </div>
  )
}
