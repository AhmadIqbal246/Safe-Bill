import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  ChevronLeft,
  MapPin,
  Shield,
  FileCheck,
  Users,
  ChevronDown,
  Search,
} from "lucide-react";
import axios from "axios";
import SafeBillHeader from "../mutualComponents/Navbar/Navbar";
// import QuoteRequestDialog from "./QuoteRequestDialog";
import Chat from "../mutualComponents/Chat/Chat";
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedContact, toggleChat } from '../../store/slices/ChatSlice';
import {
  businessActivityStructure,
  serviceAreaOptions,
} from "../../constants/registerationTypes";
import { useTranslation } from 'react-i18next';
import { fetchEligibleProjectsForRating, submitSellerRating } from '../../store/slices/ProjectSlice';
import { toast } from 'react-toastify';
import ProjectStatusBadge from '../common/ProjectStatusBadge';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get default avatar
function getDefaultAvatar(username) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    username || "User"
  )}&background=E6F0FA&color=01257D&size=96`;
}

// Helper function to safely get array fields
function getSafeArrayField(profile, fieldName) {
  const value = profile[fieldName];
  return Array.isArray(value) ? value : [];
}

// Helper function to get business activity label
function getBusinessActivityLabel(activityId) {
  const activity = businessActivityStructure.find(
    (opt) => opt.id === activityId
  );
  return activity?.label || activityId;
}

function getCategoryLabel(categoryId) {
  for (const activity of businessActivityStructure) {
    const category = activity.categories.find((cat) => cat.id === categoryId);
    if (category) {
      return category.label;
    }
  }
  return categoryId; // fallback to ID if not found
}

// Helper function to get subcategory label from businessActivityStructure
function getSubcategoryLabel(subcategoryId) {
  for (const activity of businessActivityStructure) {
    for (const category of activity.categories) {
      const subcategory = category.subcategories.find(
        (sub) => sub.id === subcategoryId
      );
      if (subcategory) {
        return subcategory.label;
      }
    }
  }
  return subcategoryId; // fallback to ID if not found
}

// Helper function to get service area label
function getServiceAreaLabel(areaId) {
  const area = serviceAreaOptions.find((opt) => opt.value === areaId);
  return area?.label || areaId;
}

export default function ProfessionalDetailPage() {
  const { t } = useTranslation();
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [ratingValue, setRatingValue] = useState(0);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const { eligibleProjectsBySeller, eligibleProjectsLoading, eligibleProjectsError, ratingSubmitting, ratingError } = useSelector(state => state.project);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfessionalDetails = async () => {
      try {
        setLoading(true);
        // Use the new API endpoint to fetch only the specific seller's details
        const response = await axios.get(
          `${BASE_URL}api/accounts/seller/${professionalId}/`
        );

        if (response.data) {
          setProfessional(response.data);
        } else {
          setError("Professional not found");
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError("Professional not found");
        } else {
          setError("Failed to load professional details");
        }
        console.error("Error fetching professional details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalDetails();
    dispatch(fetchEligibleProjectsForRating(professionalId))
      .unwrap()
      .catch((err) => {
        toast.error(err?.detail || 'Failed to load eligible projects');
      });
  }, [professionalId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E6F0FA] border-t-[#01257D] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">
            {error || "Professional not found"}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#01257D] text-white rounded-md hover:bg-[#2346a0] transition-colors"
          >
            {t('actions.go_back')}
          </button>
        </div>
      </div>
    );
  }
  const submitRating = async () => {
    if (!selectedProjectId || !ratingValue) {
      toast.info('Select a project and rating');
      return;
    }
    dispatch(submitSellerRating({ sellerId: professionalId, projectId: selectedProjectId, rating: ratingValue, comment: '' }))
      .unwrap()
      .then(() => {
        toast.success('Thanks for your rating!');
        setRatingValue(0);
        setSelectedProjectId('');
      })
      .catch((err) => {
        toast.error(err?.detail || 'Failed to submit rating');
      });
  };

  // Ensure professional has required fields with safe defaults
  const safeProfessional = {
    ...professional,
    // skills: getSafeArrayField(professional, 'skills'),
    selected_service_areas: getSafeArrayField(
      professional,
      "selected_service_areas"
    ),
    categories: getSafeArrayField(professional, "categories"),
    subcategories: getSafeArrayField(professional, "subcategories"),
  };

  // Get profile picture
  const getProfilePicture = () => {
    if (professional.profile_pic) {
      // Handle both relative and absolute URLs
      if (professional.profile_pic.startsWith("http")) {
        return professional.profile_pic;
      } else {
        // If it's a relative path, prepend the base URL
        // Remove leading slash from profile_pic to avoid double slashes
        const cleanPath = professional.profile_pic.startsWith("/")
          ? professional.profile_pic.slice(1)
          : professional.profile_pic;
        return `${BASE_URL}${cleanPath}`;
      }
    }
    return getDefaultAvatar(professional.name);
  };

  const handleRequestQuote = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}api/chat/start-quote/${professionalId}/`,
        {},
        { headers: { Authorization: `Bearer ${sessionStorage.getItem('access')}` } }
      );
      const { project_id } = res.data;

      // Build a minimal contact object compatible with ChatWindow
      const contact = {
        id: `quote-${project_id}-${professionalId}`,
        contact_info: {
          id: professional.id,
          username: professional.name,
          first_name: professional.first_name || '',
          last_name: professional.last_name || '',
          email: professional.email || '',
        },
        project_info: {
          id: project_id,
          name: professional.name || 'Quote Chat',
        },
        last_message_text: '',
        last_message_at: null,
        unread_count: 0,
      };

      dispatch(setSelectedContact(contact));
      dispatch(toggleChat());
    } catch (err) {
      console.error('Failed to start quote chat:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SafeBillHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="p-8 mb-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img
                src={getProfilePicture()}
                alt={professional.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#E6F0FA]"
              />
            </div>

            <h1 className="text-3xl font-bold text-[#111827] mb-2">
              {professional.name}
            </h1>

            <p className="text-lg text-gray-600 mb-3">
              {getBusinessActivityLabel(professional.business_type) ||
                t('professional_detail.professional_services')}
            </p>

            <div className="flex items-center justify-center mb-4">
              <MapPin className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-gray-600 mr-4">
                {safeProfessional.selected_service_areas.length > 0
                  ? t('professional_detail.serving_areas', { count: safeProfessional.selected_service_areas.length })
                  : t('professional_detail.service_areas_not_specified')}
              </span>
                          <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span className="font-semibold text-[#111827]">
                {professional.average_rating > 0 ? professional.average_rating.toFixed(1) : t('professional_detail.no_ratings')}
              </span>
              {/* <span className="text-gray-500 ml-1">
                ({professional.rating_count} {professional.rating_count === 1 ? t('professional_detail.review') : t('professional_detail.reviews')})
              </span> */}
            </div>
            </div>

            <button
              onClick={handleRequestQuote}
              className="bg-[#E2F4FE] text-[#01257D] px-8 py-3 rounded-lg font-semibold hover:bg-[#2346a0] hover:text-white transition-colors cursor-pointer"
            >
              {t('actions.request_quote')}
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">
            {t('professional_detail.about_section')}
          </h2>
          <p className="rounded-lg px-4 py-3 text-gray-700 leading-relaxed break-words">
            {professional.about || t('professional_detail.no_about_info')}
          </p>
        </div>

        {/* Rate Seller Section */}
        <div className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">{t('professional_detail.rating_section')}</h2>
          <div className="flex flex-col gap-6">
            {/* Star Rating */}
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-700 mr-3">{t('professional_detail.rating_label')}</span>
              {[1,2,3,4,5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${ratingValue >= star ? 'bg-[#01257D] text-white' : 'bg-[#E6F0FA] text-[#01257D] hover:bg-[#c7e0fa]'}`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Project Selection Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('professional_detail.select_project_to_rate')}
              </label>
              <button
                type="button"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              >
                <span className={selectedProjectId ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedProjectId ? 
                    (() => {
                      const project = (eligibleProjectsBySeller[professionalId] || []).find(p => String(p.id) === String(selectedProjectId));
                      return project ? project.name : t('professional_detail.select_project');
                    })()
                    : t('professional_detail.select_project')
                  }
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showProjectDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('professional_detail.search_projects')}
                        value={projectSearchTerm}
                        onChange={(e) => setProjectSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {(eligibleProjectsBySeller[professionalId] || [])
                      .filter(project => 
                        project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
                      )
                      .map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          className={`w-full px-4 py-3 text-left hover:bg-[#F0F4F8] transition-colors border-b border-gray-100 last:border-b-0 ${
                            String(selectedProjectId) === String(project.id)
                              ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                              : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setSelectedProjectId(String(project.id));
                            setShowProjectDropdown(false);
                            setProjectSearchTerm('');
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{project.name}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {t('professional_detail.reference')} {project.reference_number}
                              </div>
                            </div>
                            <div className="ml-3">
                              <ProjectStatusBadge status={project.status} size="small" />
                            </div>
                          </div>
                        </button>
                      ))}
                    {(eligibleProjectsBySeller[professionalId] || []).length === 0 && (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        {t('professional_detail.no_eligible_projects')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={submitRating}
              disabled={!ratingValue || !selectedProjectId || ratingSubmitting}
              className="bg-[#01257D] text-white px-6 py-3 rounded-lg disabled:opacity-50 cursor-pointer font-medium hover:bg-[#2346a0] transition-colors self-start"
            >
              {ratingSubmitting ? t('professional_detail.submitting') : t('professional_detail.submit_rating')}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">{t('professional_detail.rating_instructions')}</p>
        </div>

        {/* Skills Section */}
        {/* <div className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#111827] mb-6">
            Skills & Services
          </h2>
          <div className="flex flex-wrap gap-3">
            {safeProfessional.skills.length > 0 ? (
              safeProfessional.skills.map((skill, index) => (
                <span
                  key={`skill-${index}`}
                  className="px-4 py-2 bg-[#E6F0FA] text-[#01257D] rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-gray-400">No skills listed.</span>
            )}
          </div>
        </div> */}
        <div className="p-8 mb-8 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-[#111827] mb-6">{t('professional_detail.categories_title')}</h2>
          <div className="flex flex-wrap gap-2">
            {safeProfessional.categories.length > 0 ? (
              safeProfessional.categories.map((category, index) => (
                <span
                  key={`category-${index}`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {getCategoryLabel(category)}
                </span>
              ))
            ) : (
              <span className="text-gray-400">{t('professional_detail.no_categories')}</span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#111827] mb-6">
            {t('professional_detail.subcategories_title')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {safeProfessional.subcategories.length > 0 ? (
              safeProfessional.subcategories.map((subcategory, index) => (
                <span
                  key={`subcategory-${index}`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {getSubcategoryLabel(subcategory)}
                </span>
              ))
            ) : (
              <span className="text-gray-400">{t('professional_detail.no_subcategories')}</span>
            )}
          </div>
        </div>

        {/* Service Areas Section */}
        <div className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#111827] mb-6">
            {t('professional_detail.service_areas_title')}
          </h2>
          {/* <div className="relative mb-4">
            <input
              type="text"
              placeholder="Enter your location to check availability"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
            />
            <ChevronLeft className="absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400" />
          </div> */}
          <div className="flex flex-wrap gap-2">
            {safeProfessional.selected_service_areas.length > 0 ? (
              safeProfessional.selected_service_areas.map((areaId, index) => (
                <span
                  key={`area-${index}`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {getServiceAreaLabel(areaId)}
                </span>
              ))
            ) : (
              <span className="text-gray-400">{t('professional_detail.no_service_areas')}</span>
            )}
          </div>
        </div>

        {/* Guarantees Section */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-[#111827] mb-6">{t('professional_detail.guarantees_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <FileCheck className="w-8 h-8 text-[#01257D] mx-auto mb-2" />
              <p className="font-semibold text-[#111827]">{t('professional_detail.kyc_validated')}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <Shield className="w-8 h-8 text-[#01257D] mx-auto mb-2" />
              <p className="font-semibold text-[#111827]">{t('professional_detail.insured')}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <Shield className="w-8 h-8 text-[#01257D] mx-auto mb-2" />
              <p className="font-semibold text-[#111827]">
                {t('professional_detail.professional_liability')}
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <Users className="w-8 h-8 text-[#01257D] mx-auto mb-2" />
              <p className="font-semibold text-[#111827]">
                {t('professional_detail.trusted_by_proconnect')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Chat Overlay */}
      <Chat />
    </div>
  );
}
