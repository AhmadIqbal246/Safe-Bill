import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { businessActivityStructure, serviceAreaOptions } from "../../constants/registerationTypes";

// Create a flattened array of service type options with both id and label
const serviceTypeOptions = businessActivityStructure.map(option => ({
  value: option.id,
  label: option.label
}));

export default function IntroWithSearch() {
  const [serviceType, setServiceType] = useState("");
  const [area, setArea] = useState("");
  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [serviceTypeSearchTerm, setServiceTypeSearchTerm] = useState("");
  const [areaSearchTerm, setAreaSearchTerm] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

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
    return option ? option.label : "Select specialty...";
  };

  const getAreaLabel = () => {
    const option = serviceAreaOptions.find(opt => opt.value === area);
    return option ? option.label : "Select area...";
  };

  const isSearchDisabled = !serviceType || !area;

  return (
    <section className="w-full flex flex-col items-center justify-center py-16 px-4 bg-white">
      <h1 className="text-3xl md:text-5xl font-bold text-[#111827] text-center mb-6 leading-tight">
        Trusted platform for<br className="hidden md:block" /> your projects
      </h1>
      <p className="text-base md:text-lg text-[#96C2DB] text-center mb-10">
        Secure payments, transparent tracking, mediation included
      </p>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-4 md:p-6 flex flex-col md:flex-row items-stretch gap-4 md:gap-2">
        <div className="flex-1 flex flex-col min-w-0">
          <label className="text-xs font-medium text-[#111827] mb-1">What service do you need?</label>
          <div className="relative">
            <button
              type="button"
              className="w-full h-10 px-3 border border-gray-200 rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent overflow-hidden"
              onClick={() => {
                setShowServiceTypeDropdown(!showServiceTypeDropdown);
                setShowAreaDropdown(false);
                setServiceTypeSearchTerm("");
              }}
            >
              <span className={`truncate flex-1 text-left ${serviceType ? 'text-gray-900' : 'text-gray-500'}`}>
                {getServiceTypeLabel()}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${showServiceTypeDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showServiceTypeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search service type..."
                      value={serviceTypeSearchTerm}
                      onChange={(e) => setServiceTypeSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
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
                        className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                          serviceType === option.value 
                            ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                            : 'text-gray-700'
                        }`}
                        onClick={() => {
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
          <label className="text-xs font-medium text-[#111827] mb-1">Location</label>
          <div className="relative">
            <button
              type="button"
              className="w-full h-10 px-3 border border-gray-200 rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent overflow-hidden"
              onClick={() => {
                setShowAreaDropdown(!showAreaDropdown);
                setShowServiceTypeDropdown(false);
                setAreaSearchTerm("");
              }}
            >
              <span className={`truncate flex-1 text-left ${area ? 'text-gray-900' : 'text-gray-500'}`}>
                {getAreaLabel()}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${showAreaDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showAreaDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search area..."
                      value={areaSearchTerm}
                      onChange={(e) => setAreaSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
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
                        className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                          area === option.value 
                            ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                            : 'text-gray-700'
                        }`}
                        onClick={() => {
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
          className={`md:mt-5 flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2 font-semibold rounded-md shadow-sm transition-colors text-sm md:text-base flex-shrink-0 min-w-fit ${
            isSearchDisabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-[#01257D] text-white hover:bg-[#2346a0] cursor-pointer'
          }`}
          onClick={handleSearch}
          disabled={isSearchDisabled}
        >
          <Search className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="hidden sm:inline">Find a professional near you</span>
          <span className="sm:hidden">Find Professional</span>
        </button>
      </div>
      
      {/* Click outside to close dropdowns */}
      {(showServiceTypeDropdown || showAreaDropdown) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setShowServiceTypeDropdown(false);
            setShowAreaDropdown(false);
            setServiceTypeSearchTerm("");
            setAreaSearchTerm("");
          }}
        />
      )}
    </section>
  );
}