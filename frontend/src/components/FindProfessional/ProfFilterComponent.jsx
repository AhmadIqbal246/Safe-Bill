import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Dialog } from '@headlessui/react';
import { Search } from 'lucide-react';
import {
  filterSellersByServiceType,
  filterSellersByServiceArea,
  filterSellersByTypeAndArea,
  resetFilterState,
  fetchAllSellers
} from '../../store/slices/FilterSlice';
import { activityTypeOptions, serviceAreaOptions } from '../../constants/registerationTypes';

const serviceTypeOptions = activityTypeOptions.map(option => option.label);
const areaOptions = serviceAreaOptions.map(option => option.label);

const filters = [
  'Service type',
  'Area',
  'Radius',
  'Rating',
  'Availability',
];

const RESULTS_PER_PAGE = 5;

export default function ProfFilterComponent() {
  const dispatch = useDispatch();
  const { sellers, loading, error } = useSelector((state) => state.filter);
  const [currentPage, setCurrentPage] = useState(1);
  const [openFilter, setOpenFilter] = useState(null); // 'serviceType' | 'area' | null
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Only fetch when Apply Filters is clicked
  const [appliedServiceType, setAppliedServiceType] = useState('');
  const [appliedArea, setAppliedArea] = useState('');

  // Fetch all sellers on mount and when all filters are cleared
  useEffect(() => {
    if (!appliedServiceType && !appliedArea) {
      dispatch(resetFilterState());
      dispatch(fetchAllSellers());
      return;
    }
    if (appliedServiceType && appliedArea) {
      dispatch(filterSellersByTypeAndArea({
        serviceType: appliedServiceType,
        serviceArea: appliedArea
      }));
    } else if (appliedServiceType) {
      dispatch(filterSellersByServiceType(appliedServiceType));
    } else if (appliedArea) {
      dispatch(filterSellersByServiceArea(appliedArea));
    }
    setCurrentPage(1);
    // eslint-disable-next-line
  }, [appliedServiceType, appliedArea, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(typeof error === 'string' ? error : error.detail || 'An error occurred.');
    }
  }, [error]);

  // Sort sellers by name (A-Z)
  const sortedSellers = [...(sellers || [])].sort((a, b) => a.name.localeCompare(b.name));

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
      options = serviceTypeOptions;
      onSelect = (val) => { setSelectedServiceType(val); setOpenFilter(null); setSearchTerm(''); };
      selected = selectedServiceType;
      label = 'Select Service Type';
    } else if (openFilter === 'area') {
      options = areaOptions;
      onSelect = (val) => { setSelectedArea(val); setOpenFilter(null); setSearchTerm(''); };
      selected = selectedArea;
      label = 'Select Area';
    }

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                  filteredOptions.map((opt) => (
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
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No options found for "{searchTerm}"
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              className="mt-4 w-full py-2 rounded-md bg-[#E6F0FA] text-[#01257D] font-semibold hover:bg-[#d1e6f5] transition-colors"
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
            display = selectedServiceType;
          }
          if (f === 'Area' && selectedArea) {
            isActive = true;
            display = selectedArea;
          }
          return (
            <button
              key={f}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none cursor-pointer ${
                (f === 'Service type' || f === 'Area')
                  ? 'bg-[#E6F0FA] text-[#01257D] ' + (isActive ? 'font-bold ring-2 ring-[#01257D]' : '')
                  : 'bg-[#E6F0FA] text-[#01257D] cursor-not-allowed opacity-70'
              }`}
              onClick={() => {
                if (f === 'Service type') setOpenFilter('serviceType');
                else if (f === 'Area') setOpenFilter('area');
              }}
              disabled={!(f === 'Service type' || f === 'Area')}
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
          }}
        >
          Apply Filters
        </button>
        <button
          className="px-5 py-2 rounded-md bg-[#E6F0FA] text-[#01257D] font-semibold text-sm cursor-pointer"
          onClick={() => {
            setSelectedServiceType('');
            setSelectedArea('');
            setAppliedServiceType('');
            setAppliedArea('');
            dispatch(resetFilterState());
            dispatch(fetchAllSellers());
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
      ) : error ? null : sellers && sellers.length === 0 ? (
        <div className="text-center text-[#96C2DB] py-12">No professionals found for the selected filters.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {paginatedSellers.map((pro, idx) => {
              const dummy = dummyRatings[(currentPage - 1) * RESULTS_PER_PAGE + idx] || { rating: 4.5, reviews: 50 };
              return (
                <div key={pro.name} className="flex flex-col items-center text-center">
                  <img
                    src={`https://api.dicebear.com/7.x/micah/svg?seed=${pro.name}`}
                    alt={pro.name}
                    className="w-36 h-36 object-cover rounded-xl mb-3"
                  />
                  <div className="font-semibold text-[#111827] text-base">{pro.name}</div>
                  <div className="text-[#6B7280] text-sm mb-1">{pro.business_type}</div>
                  <div className="text-[#178582] text-sm font-semibold">
                    {dummy.rating} <span className="text-[#6B7280] font-normal">({dummy.reviews})</span>
                  </div>
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
