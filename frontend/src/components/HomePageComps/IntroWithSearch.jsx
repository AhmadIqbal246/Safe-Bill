import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { businessActivityStructure, serviceAreaOptions } from "../../constants/registerationTypes";
import { useTranslation } from 'react-i18next';
import homeDashboardBg from "../../assets/Circle Background/home-dashboard-bg1.png";
import groupImage from "../../assets/Circle Background/How_To_Keep_Your_Best_Employees-removebg-preview.jpg";

// Create a flattened array of service type options with both id and label
const serviceTypeOptions = businessActivityStructure.map(option => ({
  value: option.id,
  label: option.label
}));

export default function IntroWithSearch() {
  const { t } = useTranslation();
  const [serviceType, setServiceType] = useState("");
  const [area, setArea] = useState("");
  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [serviceTypeSearchTerm, setServiceTypeSearchTerm] = useState("");
  const [areaSearchTerm, setAreaSearchTerm] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const searchBarRef = useRef(null);

  // Handle clicks outside the search bar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setShowServiceTypeDropdown(false);
        setShowAreaDropdown(false);
        setServiceTypeSearchTerm("");
        setAreaSearchTerm("");
      }
    };

    if (showServiceTypeDropdown || showAreaDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showServiceTypeDropdown, showAreaDropdown]);

  const handleSearch = () => {
    if (!serviceType || !area) {
      // Show validation message or prevent search
      return;
    }
    
    if (!user) {
      // Capture the intended destination and redirect to login
      const intendedUrl = `/find-professionals?serviceType=${serviceType}&area=${area}`;
      navigate(`/login?redirect=${encodeURIComponent(intendedUrl)}`);
      return;
    }
    navigate(`/find-professionals?serviceType=${serviceType}&area=${area}`);
  };

  const getServiceTypeLabel = () => {
    const option = serviceTypeOptions.find(opt => opt.value === serviceType);
    return option ? option.label : t('homepage.select_specialty');
  };

  const getAreaLabel = () => {
    const option = serviceAreaOptions.find(opt => opt.value === area);
    return option ? option.label : t('homepage.select_area');
  };

  const isSearchDisabled = !serviceType || !area;

  // Function to split hero title for color styling
  const getHeroTitleParts = () => {
    const title = t('homepage.hero_title');
    // Split the title to apply different colors
    // Pattern: "La confiance au cœur de vos projets" or "Trust at the heart of your projects"
    if (title.includes('au cœur')) {
      // French version
      const parts = title.split(' au cœur ');
      return {
        part1: parts[0] + ' ', // "La confiance "
        part2: 'au cœur', // "au cœur"
        part3: ' ' + parts[1] // " de vos projets"
      };
    } else {
      // English version - split at "at the heart"
      const parts = title.split(' at the heart ');
      if (parts.length === 2) {
        return {
          part1: parts[0] + ' ', // "Trust "
          part2: 'at the heart', // "at the heart"
          part3: ' ' + parts[1] // " of your projects"
        };
      }
      // Fallback if pattern doesn't match
      return {
        part1: title,
        part2: '',
        part3: ''
      };
    }
  };

  const titleParts = getHeroTitleParts();

  return (
    <section 
      className="relative w-full h-auto min-h-[700px] md:h-[650px] overflow-visible md:overflow-hidden"
      style={{
        backgroundImage: `url(${homeDashboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-5 lg:pt-6 pb-48 md:pb-0 lg:pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
          {/* Left Side - Text Content */}
          <div className="flex flex-col space-y-2 md:space-y-3 lg:space-y-3 text-left order-2 lg:order-1 lg:mt-18 mb-8 md:mb-0 lg:mb-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
              <span className="text-[#3535AA]">{titleParts.part1}</span>
              {titleParts.part2 && <span className="text-[#8989C9]">{titleParts.part2}</span>}
              <br />
              {titleParts.part3 && <span className="text-[#3535AA]">{titleParts.part3}</span>}
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 font-normal">
              {t('homepage.hero_subtitle_line')}
            </p>
            <p className="text-base md:text-lg text-gray-700 font-medium">
              {t('homepage.hero_subtitle')}
            </p>
          </div>

          {/* Right Side - Group Image */}
          <div className="flex items-center justify-center lg:justify-end order-1 lg:order-2">
            <div className="relative w-full max-w-sm md:max-w-md lg:w-auto lg:max-w-none">
              <img 
                src={groupImage} 
                alt="Professionals" 
                className="w-full h-auto object-contain lg:scale-120 xl:scale-[1.60]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - Positioned in Lower Middle Area */}
      <div ref={searchBarRef} className="absolute bottom-[-12px] md:bottom-12 lg:bottom-60 left-0 right-30 z-30 w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 search-bar-container">
        <div className="bg-white rounded-[20px] shadow-lg p-2 md:p-5 lg:p-6 flex flex-col md:flex-row items-stretch gap-3 md:gap-4 relative border border-[#8989C9] mb-4 md:mb-0 lg:mb-0">
          <div className="flex-1 flex flex-col min-w-0">
            <label className="text-sm font-medium text-gray-700 mb-2">{t('homepage.service_label')}</label>
            <div className="relative">
              <button
                type="button"
                className="w-full h-12 px-4 border border-gray-300 rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#4A148C] focus:border-transparent overflow-hidden hover:border-gray-400 transition-colors"
                onClick={() => {
                  setShowServiceTypeDropdown(!showServiceTypeDropdown);
                  setShowAreaDropdown(false);
                  setServiceTypeSearchTerm("");
                }}
              >
                <span className={`truncate flex-1 text-left text-sm ${serviceType ? 'text-gray-900' : 'text-gray-500'}`}>
                  {getServiceTypeLabel()}
                </span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${showServiceTypeDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showServiceTypeDropdown && (
                <div 
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-[100] max-h-[200px] md:max-h-60 overflow-hidden"
                  data-dropdown-item
                >
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('homepage.search_service_type')}
                        value={serviceTypeSearchTerm}
                        onChange={(e) => setServiceTypeSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A148C] focus:border-transparent text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {serviceTypeOptions
                      .filter(option => 
                        option.label.toLowerCase().includes(serviceTypeSearchTerm.toLowerCase())
                      )
                      .map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors text-sm ${
                            serviceType === option.value 
                              ? 'bg-[#E6F0FA] text-[#4A148C] font-semibold' 
                              : 'text-gray-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setServiceType(option.value);
                            setShowServiceTypeDropdown(false);
                            setServiceTypeSearchTerm("");
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-w-0">
            <label className="text-sm font-medium text-gray-700 mb-2">{t('homepage.location_label')}</label>
            <div className="relative">
              <button
                type="button"
                className="w-full h-12 px-4 border border-gray-300 rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#4A148C] focus:border-transparent overflow-hidden hover:border-gray-400 transition-colors"
                onClick={() => {
                  setShowAreaDropdown(!showAreaDropdown);
                  setShowServiceTypeDropdown(false);
                  setAreaSearchTerm("");
                }}
              >
                <span className={`truncate flex-1 text-left text-sm ${area ? 'text-gray-900' : 'text-gray-500'}`}>
                  {getAreaLabel()}
                </span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${showAreaDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showAreaDropdown && (
                <div 
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-[100] max-h-[200px] md:max-h-60 overflow-hidden"
                  data-dropdown-item
                >
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('homepage.search_area')}
                        value={areaSearchTerm}
                        onChange={(e) => setAreaSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A148C] focus:border-transparent text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {serviceAreaOptions
                      .filter(option => 
                        option.label.toLowerCase().includes(areaSearchTerm.toLowerCase())
                      )
                      .map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors text-sm ${
                            area === option.value 
                              ? 'bg-[#E6F0FA] text-[#4A148C] font-semibold' 
                              : 'text-gray-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setArea(option.value);
                            setShowAreaDropdown(false);
                            setAreaSearchTerm("");
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            className={`md:mt-7 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-md shadow-sm transition-colors text-sm md:text-base flex-shrink-0 min-w-fit h-12 ${
              isSearchDisabled 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-gray-600 text-white hover:bg-gray-700 cursor-pointer'
            }`}
            onClick={handleSearch}
            disabled={isSearchDisabled}
          >
            <Search className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">{t('actions.find_professional_near_you')}</span>
            <span className="sm:hidden whitespace-nowrap">{t('actions.find_professional')}</span>
          </button>
        </div>
      </div>
      
    </section>
  );
}