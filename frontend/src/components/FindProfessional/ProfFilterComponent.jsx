import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Dialog } from '@headlessui/react';
import { Search, Star } from 'lucide-react';
import {
  filterSellersByServiceType,
  filterSellersByServiceArea,
  filterSellersByTypeAndArea,
  filterSellersByTypeAreaAndSkills,
  resetFilterState,
  fetchAllSellers,
  fetchAllSellersComplete
} from '../../store/slices/FilterSlice';
import { businessActivityStructure, serviceAreaOptions } from '../../constants/registerationTypes';

// Create a flattened array of service type options with both id and label
const serviceTypeOptions = businessActivityStructure.map(option => ({
  id: option.id,
  label: option.label
}));
const areaOptions = serviceAreaOptions.map(option => option.value);

// Helper function to get default avatar
function getDefaultAvatar(username) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    username || "User"
  )}&background=E6F0FA&color=01257D&size=144`;
}

// Helper function to get business activity label
function getBusinessActivityLabel(activityId) {
  const activity = businessActivityStructure.find(opt => opt.id === activityId);
  return activity?.label || activityId;
}

// Helper function to get profile picture
function getProfilePicture(professional) {
  if (professional.profile_pic) {
    // Handle both relative and absolute URLs
    if (professional.profile_pic.startsWith('http')) {
      return professional.profile_pic;
    } else {
      // If it's a relative path, prepend the base URL
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const cleanPath = professional.profile_pic.startsWith('/') 
        ? professional.profile_pic.slice(1) 
        : professional.profile_pic;
      return `${BASE_URL}${cleanPath}`;
    }
  }
  return getDefaultAvatar(professional.name);
}

const filters = [
  'Service type',
  'Area',
  'Radius',
  'Rating',
  'Availability',
];

const RESULTS_PER_PAGE = 5;

export default function ProfFilterComponent({ initialFilters = {} }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sellers, loading, error } = useSelector((state) => state.filter);
  const [currentPage, setCurrentPage] = useState(1);
  const [openFilter, setOpenFilter] = useState(null); // 'serviceType' | 'area' | null
  const [selectedServiceType, setSelectedServiceType] = useState(initialFilters.serviceType || '');
  const [selectedServiceTypeLabel, setSelectedServiceTypeLabel] = useState(''); // Store the display label
  const [selectedArea, setSelectedArea] = useState(initialFilters.area || '');
  const [selectedAreaLabel, setSelectedAreaLabel] = useState(''); // Store the display label
  const [selectedRating, setSelectedRating] = useState(initialFilters.minRating || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Only fetch when Apply Filters is clicked
  const [appliedServiceType, setAppliedServiceType] = useState(initialFilters.serviceType || '');
  const [appliedArea, setAppliedArea] = useState(initialFilters.area || '');
  const [appliedRating, setAppliedRating] = useState(initialFilters.minRating || '');

  // Set labels when initial filters are provided
  useEffect(() => {
    if (initialFilters.serviceType) {
      const option = serviceTypeOptions.find(opt => opt.id === initialFilters.serviceType);
      if (option) {
        setSelectedServiceTypeLabel(option.label);
      }
    }
    if (initialFilters.area) {
      const option = serviceAreaOptions.find(opt => opt.value === initialFilters.area);
      if (option) {
        setSelectedAreaLabel(option.label);
      }
    }
  }, [initialFilters]);

  // Auto-apply initial filters
  useEffect(() => {
    if (initialFilters.serviceType || initialFilters.area) {
      // Auto-apply the filters after a short delay to ensure labels are set
      const timer = setTimeout(() => {
        setAppliedServiceType(initialFilters.serviceType || '');
        setAppliedArea(initialFilters.area || '');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialFilters]);

  // Fetch all sellers on mount and when all filters are cleared
  useEffect(() => {
    if (!appliedServiceType && !appliedArea && !appliedRating) {
      dispatch(resetFilterState());
      dispatch(fetchAllSellersComplete({ minRating: appliedRating }));
      return;
    }
    
    // Determine which filter combination to use
    if (appliedServiceType && appliedArea) {
      dispatch(filterSellersByTypeAndArea({
        serviceType: appliedServiceType,
        serviceArea: appliedArea,
        minRating: appliedRating
      }));
    } else if (appliedServiceType) {
      dispatch(filterSellersByServiceType({
        serviceType: appliedServiceType,
        minRating: appliedRating
      }));
    } else if (appliedArea) {
      dispatch(filterSellersByServiceArea({
        serviceArea: appliedArea,
        minRating: appliedRating
      }));
    }
    setCurrentPage(1);
    // eslint-disable-next-line
  }, [appliedServiceType, appliedArea, appliedRating, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(typeof error === 'string' ? error : error.detail || 'An error occurred.');
    }
  }, [error]);

  // Sort sellers by name (A-Z)
  const sortedSellers = Array.isArray(sellers) ? [...sellers].sort((a, b) => a.name.localeCompare(b.name)) : [];

  // Pagination logic
  const totalPages = Math.ceil(sortedSellers.length / RESULTS_PER_PAGE);
  const paginatedSellers = sortedSellers.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  // Dummy rating/reviews
  const dummyRatings = [
    { rating: 4.8, reviews: 120 },
    { rating: 4.5, reviews: 85 },
    { rating: 4.9, reviews: 150 },
    { rating: 4.7, reviews: 95 },
    { rating: 4.6, reviews: 110 },
    { rating: 4.4, reviews: 70 },
    { rating: 5.0, reviews: 24 },
    { rating: 4.9, reviews: 18 },
    { rating: 4.8, reviews: 31 },
    { rating: 5.0, reviews: 12 },
  ];

  // Dialog for filter selection
  const renderDialog = () => {
    if (!openFilter) return null;
    
    let options = [];
    let onSelect = () => {};
    let selected = '';
    let label = '';
    
    if (openFilter === 'serviceType') {
      options = serviceTypeOptions; // Now contains objects with id and label
      onSelect = (option) => { 
        setSelectedServiceType(option.id); 
        setSelectedServiceTypeLabel(option.label);
        setOpenFilter(null); 
        setSearchTerm(''); 
      };
      selected = selectedServiceTypeLabel;
      label = 'Select Service Type';
    } else if (openFilter === 'area') {
      options = serviceAreaOptions.map(option => option.label); // Show labels in dropdown
      onSelect = (val) => { 
        const areaOption = serviceAreaOptions.find(opt => opt.label === val);
        setSelectedArea(areaOption ? areaOption.value : val); 
        setSelectedAreaLabel(val);
        setOpenFilter(null); 
        setSearchTerm(''); 
      };
      selected = selectedAreaLabel;
      label = 'Select Area';
    } else if (openFilter === 'rating') {
      options = [
        { value: '1', label: '1+ stars' },
        { value: '2', label: '2+ stars' },
        { value: '3', label: '3+ stars' },
        { value: '4', label: '4+ stars' },
        { value: '5', label: '5+ stars' }
      ];
      onSelect = (option) => { 
        setSelectedRating(option.value); 
        setOpenFilter(null); 
        setSearchTerm(''); 
      };
      selected = selectedRating ? `${selectedRating}+ stars` : '';
      label = 'Select Minimum Rating';
    }

    // Filter options based on search term
    const filteredOptions = options.filter(option => {
      if (openFilter === 'serviceType') {
        return option.label.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (openFilter === 'rating') {
        return option.label.toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        return option.toLowerCase().includes(searchTerm.toLowerCase());
      }
    });

    return (
      <Dialog open={!!openFilter} onClose={() => { setOpenFilter(null); setSearchTerm(''); }} className="relative z-50">
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded bg-white p-6 max-h-[80vh] flex flex-col">
            <Dialog.Title className="font-semibold text-[#01257D] mb-4">{label}</Dialog.Title>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
              />
            </div>

            {/* Options List with Scroll */}
            <div className="flex-1 overflow-y-auto max-h-60">
              <div className="flex flex-col gap-2">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                    if (openFilter === 'serviceType') {
                      return (
                        <button
                          key={opt.id}
                          className={`px-4 py-2 rounded-md text-left hover:bg-[#F0F4F8] transition-colors ${
                            selected === opt.label 
                              ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                              : 'text-[#111827] cursor-pointer'
                          }`}
                          onClick={() => onSelect(opt)}
                        >
                          {opt.label}
                        </button>
                      );
                    } else if (openFilter === 'rating') {
                      return (
                        <button
                          key={opt.value}
                          className={`px-4 py-2 rounded-md text-left hover:bg-[#F0F4F8] transition-colors ${
                            selected === opt.label 
                              ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                              : 'text-[#111827] cursor-pointer'
                          }`}
                          onClick={() => onSelect(opt)}
                        >
                          {opt.label}
                        </button>
                      );
                    } else {
                      return (
                        <button
                          key={opt}
                          className={`px-4 py-2 rounded-md text-left hover:bg-[#F0F4F8] transition-colors ${
                            selected === opt 
                              ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                              : 'text-[#111827] cursor-pointer'
                          }`}
                          onClick={() => onSelect(opt)}
                        >
                          {opt}
                        </button>
                      );
                    }
                  })
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No options found for "{searchTerm}"
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              className="mt-4 w-full py-2 rounded-md bg-[#E6F0FA] text-[#01257D] font-semibold hover:bg-[#d1e6f5] transition-colors cursor-pointer"
              onClick={() => { setOpenFilter(null); setSearchTerm(''); }}
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  };

  return (
    <section className="w-full max-w-7xl mx-auto py-10 px-4">
      {renderDialog()}
      <h2 className="text-xl md:text-2xl font-bold text-[#111827] mb-4">Find local professionals</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => {
          let isActive = false;
          let display = f;
          if (f === 'Service type' && selectedServiceType) {
            isActive = true;
            display = selectedServiceTypeLabel;
          }
          if (f === 'Area' && selectedArea) {
            isActive = true;
            display = selectedAreaLabel;
          }
          if (f === 'Rating' && selectedRating) {
            isActive = true;
            display = `${selectedRating}+ stars`;
          }
          return (
            <button
              key={f}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none cursor-pointer ${
                (f === 'Service type' || f === 'Area' || f === 'Rating')
                  ? 'bg-[#E6F0FA] text-[#01257D] ' + (isActive ? 'font-bold ring-2 ring-[#01257D]' : '')
                  : 'bg-[#E6F0FA] text-[#01257D] cursor-not-allowed opacity-70'
              }`}
              onClick={() => {
                if (f === 'Service type') setOpenFilter('serviceType');
                else if (f === 'Area') setOpenFilter('area');
                else if (f === 'Rating') setOpenFilter('rating');
              }}
              disabled={!(f === 'Service type' || f === 'Area' || f === 'Rating')}
            >
              {display}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className="px-5 py-2 rounded-md bg-[#01257D] text-white font-semibold text-sm hover:bg-[#2346a0] transition-colors cursor-pointer"
          onClick={() => {
            setAppliedServiceType(selectedServiceType);
            setAppliedArea(selectedArea);
            setAppliedRating(selectedRating);
          }}
        >
          Apply Filters
        </button>
        <button
          className="px-5 py-2 rounded-md bg-[#E6F0FA] text-[#01257D] font-semibold text-sm cursor-pointer"
          onClick={() => {
            setSelectedServiceType('');
            setSelectedServiceTypeLabel(''); // Clear the label
            setSelectedArea('');
            setSelectedAreaLabel(''); // Clear the label
            setSelectedRating('');
            setAppliedServiceType('');
            setAppliedArea('');
            setAppliedRating('');
            dispatch(resetFilterState());
            dispatch(fetchAllSellersComplete());
          }}
        >
          Clear All
        </button>
      </div>
      <h3 className="text-lg font-bold text-[#111827] mb-4">Results</h3>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-[#E6F0FA] border-t-[#01257D] rounded-full animate-spin" />
        </div>
      ) : error ? null : Array.isArray(sellers) && sellers.length === 0 ? (
        <div className="text-center text-[#96C2DB] py-12">No professionals found for the selected filters.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {paginatedSellers.map((pro, idx) => {
              // Use real rating data from API
              const rating = pro.average_rating || 0;
              const reviewCount = pro.rating_count || 0;
              return (
                <div 
                  key={pro.name} 
                  className="flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => navigate(`/professional/${pro.id}`)}
                >
                  <img
                    src={getProfilePicture(pro)}
                    alt={pro.name}
                    className="w-36 h-36 object-cover rounded-xl mb-3"
                  />
                  <div className="font-semibold text-[#111827] text-base">{pro.name}</div>
                  <div className="text-[#6B7280] text-sm mb-1">{getBusinessActivityLabel(pro.business_type)}</div>
                  {/* <div className="text-[#178582] text-sm font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    {rating > 0 ? rating.toFixed(1) : 'No ratings'} 
                  </div> */}
                </div>
              );
            })}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#111827] hover:bg-[#E6F0FA] disabled:opacity-40 cursor-pointer"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-[#111827] font-semibold cursor-pointer ${
                    currentPage === i + 1 ? 'bg-[#E6F0FA]' : ''
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#111827] hover:bg-[#E6F0FA] disabled:opacity-40 cursor-pointer"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
