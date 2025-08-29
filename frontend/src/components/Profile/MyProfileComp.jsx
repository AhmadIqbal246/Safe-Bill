import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserProfile,
  updateUserProfile,
} from "../../store/slices/UserProfileSlice";
import { setUser } from "../../store/slices/AuthSlices";
import {
  submitFeedback,
  resetFeedbackState,
} from "../../store/slices/FeedbackSlices";
import { Dialog } from "@headlessui/react";
import Select from "react-select";
import { toast } from "react-toastify";
import { Search, ChevronDown } from "lucide-react";
import {
  businessActivityStructure,
  serviceAreaOptions,
  skillOptions,
} from "../../constants/registerationTypes";
import { useTranslation } from "react-i18next";

function getDefaultAvatar(username) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    username || "User"
  )}&background=E6F0FA&color=01257D&size=96`;
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Utility function to safely get array fields from profile
function getSafeArrayField(profile, fieldName) {
  const value = profile[fieldName];
  return Array.isArray(value) ? value : [];
}

export default function MyProfileComp() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { profile, loading, error, success } = useSelector(
    (state) => state.userProfile
  );
  const {
    loading: feedbackLoading,
    error: feedbackError,
    success: feedbackSuccess,
  } = useSelector((state) => state.feedback);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editPicPreview, setEditPicPreview] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [businessActivitySearchTerm, setBusinessActivitySearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [subcategorySearchTerm, setSubcategorySearchTerm] = useState("");
  const [serviceAreasSearchTerm, setServiceAreasSearchTerm] = useState("");
  const [showBusinessActivityDropdown, setShowBusinessActivityDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showSubcategoriesDropdown, setShowSubcategoriesDropdown] = useState(false);
  const [showServiceAreasDropdown, setShowServiceAreasDropdown] = useState(false);
  const fileInputRef = useRef();

  // Word/character limits
  const USERNAME_MAX_LENGTH = 10;
  const ABOUT_MAX_WORDS = 200;
  const ABOUT_MAX_CHARS = 800;

  // Helper function to count words
  const countWords = (text) => {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).length;
  };

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (success && editModalOpen) {
      setEditModalOpen(false);
      setEditForm(null);
      setEditPicPreview(null);
      toast.success(t('my_profile.profile_updated_successfully'));
      // Refresh the profile data from the API to get the latest data
      dispatch(fetchUserProfile());
      
    }
  }, [success, dispatch, t]);

  useEffect(() => {
    if (feedbackSuccess) {
      toast.success(t('my_profile.feedback_submitted_successfully'));
      dispatch(resetFeedbackState());
      setSelectedRating(null);
      setFeedbackText("");
      setFeedbackEmail("");
    }
    if (feedbackError) {
      toast.error(t('my_profile.failed_submit_feedback'));
      dispatch(resetFeedbackState());
    }
  }, [feedbackSuccess, feedbackError, dispatch, t]);

  const handleRatingClick = (rating) => {
    setSelectedRating(rating);

    // Auto-populate feedback with starting points that users can modify
    const feedbackMessages = {
      Excellent:
        "The platform is working perfectly for my needs. Great user experience and all features are functioning well. ",
      Good: "The platform is good overall. There are some minor improvements that could make it even better. ",
      "Needs Improvement":
        "I've encountered some issues with the platform. There are several areas that need attention and improvement. ",
    };

    setFeedbackText(feedbackMessages[rating] || "");
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!selectedRating) {
      toast.error(t('my_profile.please_select_rating'));
      return;
    }
    if (!feedbackEmail) {
      toast.error(t('my_profile.please_provide_email'));
      return;
    }

    dispatch(
      submitFeedback({
        email: feedbackEmail,
        feedback: feedbackText,
      })
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">{t('my_profile.loading')}</div>;
  }
  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {typeof error === "string" ? error : t('my_profile.failed_load_profile')}
      </div>
    );
  }
  if (!profile) {
    return <div className="text-center py-12 text-gray-400">{t('my_profile.no_profile_data')}</div>;
  }

  // Ensure profile has required fields with safe defaults
  const safeProfile = {
    ...profile,
    type_of_activity: profile.type_of_activity || profile.type_of_activity || "",
    selected_categories: getSafeArrayField(profile, 'selected_categories'),
    selected_subcategories: getSafeArrayField(profile, 'selected_subcategories'),
    selected_service_areas: getSafeArrayField(profile, 'selected_service_areas'),
    // skills: getSafeArrayField(profile, 'skills'),
  };

  const avatarSrc = profile.profile_pic || getDefaultAvatar(profile.username);

  // Prepare initial values for edit form
  const openEditModal = () => {
    setEditForm({
      username: profile.username || "",
      type_of_activity: profile.type_of_activity || "",
      selected_categories: safeProfile.selected_categories,
      selected_subcategories: safeProfile.selected_subcategories,
      selected_service_areas: safeProfile.selected_service_areas,
      //departmentNumbers: profile.department_numbers || "",
      about: profile.about || "",
      // skills: safeProfile.skills,
      profile_pic: null,
    });
    setEditPicPreview(null);
    setEditModalOpen(true);
    setBusinessActivitySearchTerm("");
    setCategorySearchTerm("");
    setSubcategorySearchTerm("");
    setServiceAreasSearchTerm("");
    setShowBusinessActivityDropdown(false);
    setShowCategoriesDropdown(false);
    setShowSubcategoriesDropdown(false);
    setShowServiceAreasDropdown(false);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSkillChange = (selected) => {
    setEditForm((prev) => ({
      ...prev,
      skills: selected ? selected.map((s) => s.label) : [],
    }));
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm((prev) => ({ ...prev, profile_pic: file }));
      setEditPicPreview(URL.createObjectURL(file));
    }
  };

  const handleEditCancel = () => {
    setEditModalOpen(false);
    setEditForm(null);
    setEditPicPreview(null);
    setBusinessActivitySearchTerm("");
    setCategorySearchTerm("");
    setSubcategorySearchTerm("");
    setServiceAreasSearchTerm("");
    setShowBusinessActivityDropdown(false);
    setShowCategoriesDropdown(false);
    setShowSubcategoriesDropdown(false);
    setShowServiceAreasDropdown(false);
  };


  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm) return;

    // Validation for required fields
    const validationErrors = [];
    
    // Validate username
    if (!editForm.username || editForm.username.trim() === '') {
      validationErrors.push(t('my_profile.username_required'));
    } else if (editForm.username.length > USERNAME_MAX_LENGTH) {
      validationErrors.push(t('my_profile.username_too_long', { max: USERNAME_MAX_LENGTH }));
    }
    
    if (!editForm.type_of_activity || editForm.type_of_activity.trim() === '') {
      validationErrors.push(t('my_profile.business_activity_required'));
    }
    
    if (!editForm.selected_service_areas || editForm.selected_service_areas.length === 0) {
      validationErrors.push(t('my_profile.service_areas_required'));
    }

    // Validate about field
    if (editForm.about) {
      if (editForm.about.length > ABOUT_MAX_CHARS) {
        validationErrors.push(t('my_profile.about_too_long_chars', { max: ABOUT_MAX_CHARS }));
      }
      if (countWords(editForm.about) > ABOUT_MAX_WORDS) {
        validationErrors.push(t('my_profile.about_too_many_words', { max: ABOUT_MAX_WORDS }));
      }
    }
    
    // If there are validation errors, show them and return
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast.error(error);
      });
      return;
    }
  
    // Create a more robust data preparation that preserves form values
    const data = {
      username: editForm.username || profile.username,
      type_of_activity: editForm.type_of_activity || profile.type_of_activity,
      about: editForm.about !== undefined ? editForm.about : profile.about,
    };
  
    // Handle array fields more carefully - preserve form values if they exist, even if empty
    // Only fall back to profile values if the form field is null/undefined
    if (editForm.selected_categories !== undefined) {
      data.selected_categories = editForm.selected_categories;
    } else {
      data.selected_categories = profile.selected_categories || [];
    }
  
    if (editForm.selected_subcategories !== undefined) {
      data.selected_subcategories = editForm.selected_subcategories;
    } else {
      data.selected_subcategories = profile.selected_subcategories || [];
    }
  
    if (editForm.selected_service_areas !== undefined) {
      data.selected_service_areas = editForm.selected_service_areas;
    } else {
      data.selected_service_areas = profile.selected_service_areas || [];
    }
  
    // Add profile picture if it exists
    if (editForm.profile_pic) {
      data.profile_pic = editForm.profile_pic;
    }
  
    dispatch(updateUserProfile(data));
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-6">
        <img
          src={avatarSrc}
          alt={profile.username}
          className="w-24 h-24 rounded-full object-cover border-4 border-[#E6F0FA] mb-3"
        />
        <div className="text-xl font-bold text-gray-900">
          {profile.username}
        </div>
        <div className="text-gray-500 font-medium">
          {t('my_profile.business_activity')}:{" "}
          {profile.type_of_activity
            ? businessActivityStructure.find(
                (opt) => opt.id === profile.type_of_activity
              )?.label || capitalize(profile.type_of_activity)
            : t('my_profile.not_specified')}
        </div>
                 {safeProfile.selected_categories.length > 0 && (
           <div className="text-gray-500 font-medium">
             {t('my_profile.categories')}:{" "}
             {safeProfile.selected_categories.map(catId => {
               const activity = businessActivityStructure.find(
                 opt => opt.id === profile.type_of_activity
               );
               const category = activity?.categories?.find(cat => cat.id === catId);
               return category?.label || catId;
             }).join(", ")}
           </div>
         )}
         {safeProfile.selected_subcategories.length > 0 && (
           <div className="text-gray-500 font-medium">
             {t('my_profile.subcategories')}:{" "}
             {safeProfile.selected_subcategories.map(subcatId => {
               const activity = businessActivityStructure.find(
                 opt => opt.id === profile.type_of_activity
               );
               for (const cat of activity?.categories || []) {
                 const subcategory = cat.subcategories?.find(sub => sub.id === subcatId);
                 if (subcategory) return subcategory.label;
               }
               return subcatId;
             }).join(", ")}
           </div>
         )}
        {safeProfile.selected_service_areas.length > 0 && (
          <div className="text-gray-400 text-sm mb-2">
            {t('my_profile.service_areas')}: {safeProfile.selected_service_areas.map(areaId => {
              const area = serviceAreaOptions.find(opt => opt.value === areaId);
              return area?.label || areaId;
            }).join(", ")}
          </div>
        )}
        {/* <div className="text-gray-400 text-sm mb-2">
          {profile.department_numbers
            ? `Service Area Department: ${profile.department_numbers}`
            : "Department numbers not specified"}
        </div> */}
        <button
          className="w-full max-w-xs bg-[#E6F0FA] text-[#01257D] font-semibold py-2 rounded-md mb-2 mt-2 cursor-pointer"
          onClick={openEditModal}
        >
          {t('my_profile.edit_profile')}
        </button>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">{t('my_profile.about')}</h2>
        <div className=" rounded-lg px-4 py-3 text-gray-700 break-words">
          {profile.about || t('my_profile.no_about_info')}
        </div>
      </div>
             {/* <div className="mb-6">
         <h2 className="text-lg font-bold mb-2">Skills</h2>
         <div className="flex flex-wrap gap-2">
           {safeProfile.skills.length > 0 ? (
             safeProfile.skills.map(
               (skill) => (
                 <span
                   key={skill}
                   className="bg-[#E6F0FA] text-[#01257D] px-3 py-1 rounded-full text-sm font-semibold"
                 >
                   {skill}
                 </span>
               )
             )
           ) : (
             <span className="text-gray-400">No skills listed.</span>
           )}
         </div>
       </div> */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">{t('my_profile.contact')}</h2>
        <div className="flex flex-col sm:flex-row gap-6 text-gray-700">
          <div>
            <div className="text-xs text-gray-400 font-semibold">{t('my_profile.email')}</div>
            <div>{profile.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">{t('my_profile.phone')}</div>
            <div>{profile.phone_number}</div>
          </div>
        </div>
      </div>
      {/* Feedback form remains as before, not populated from API */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">{t('my_profile.help_improve')}</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          {["Excellent", "Good", "Needs Improvement"].map((label) => (
            <button
              key={label}
              className={`px-4 py-2 rounded-md border font-semibold text-sm transition-colors bg-white text-gray-700 border-gray-200 hover:bg-[#E6F0FA] cursor-pointer ${
                selectedRating === label
                  ? "bg-[#E6F0FA] text-[#01257D] border-[#01257D]"
                  : ""
              }`}
              type="button"
              onClick={() => handleRatingClick(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mb-4">
          💡 {t('my_profile.select_rating')}
        </div>
        <div className="mb-4">
          <textarea
            className="w-full min-h-[80px] rounded-md border border-gray-200 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#01257D]"
            placeholder={t('my_profile.feedback')}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </div>
        <input
          type="email"
          className="w-full mb-4 rounded-md border border-gray-200 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#01257D] cursor-pointer"
          placeholder={t('my_profile.your_email')}
          value={feedbackEmail}
          onChange={(e) => setFeedbackEmail(e.target.value)}
        />
        <button
          className="w-full bg-[#01257D] text-white font-semibold py-2 rounded-md hover:bg-[#2346a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          onClick={handleFeedbackSubmit}
          disabled={feedbackLoading}
        >
          {feedbackLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t('my_profile.submitting')}
            </div>
          ) : (
            t('my_profile.submit_feedback')
          )}
        </button>
      </div>

      {/* Edit Profile Modal */}
      <Dialog
        open={editModalOpen}
        onClose={handleEditCancel}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg max-h-[90vh] rounded-lg bg-white shadow-xl flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <Dialog.Title className="text-xl font-bold text-[#01257D]">
                {t('my_profile.edit_profile')}
              </Dialog.Title>
            </div>
            {editForm && (
              <form id="edit-profile-form" onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Required fields note */}
                <div className="text-sm text-gray-600 mb-4">
                  <span className="text-red-500">*</span> {t('my_profile.required_fields_note')}
                </div>
                
                <div className="flex flex-col items-center mb-4">
                  <img
                    src={
                      editPicPreview ||
                      profile.profile_pic ||
                      getDefaultAvatar(profile.username)
                    }
                    alt="Profile Preview"
                    className="w-20 h-20 rounded-full object-cover border-4 border-[#E6F0FA] mb-2"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handlePicChange}
                  />
                  <button
                    type="button"
                    className="px-3 py-1 bg-[#E6F0FA] text-[#01257D] rounded text-sm font-semibold cursor-pointer"
                    onClick={() =>
                      fileInputRef.current && fileInputRef.current.click()
                    }
                  >
                    {t('my_profile.upload_new_picture')}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('my_profile.username_label')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D]"
                    value={editForm.username}
                    onChange={(e) =>
                      handleEditChange("username", e.target.value)
                    }
                    maxLength={USERNAME_MAX_LENGTH}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {editForm.username ? `${editForm.username.length}/${USERNAME_MAX_LENGTH} characters` : `${USERNAME_MAX_LENGTH} characters max`}
                  </div>
                </div>
                {/* Business Activity Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('my_profile.business_activity_label')}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full px-3 py-2 border rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                      onClick={() =>
                        setShowBusinessActivityDropdown(!showBusinessActivityDropdown)
                      }
                    >
                      <span
                        className={
                          editForm.type_of_activity
                            ? "text-gray-900"
                            : "text-gray-500"
                        }
                      >
                        {editForm.type_of_activity
                          ? businessActivityStructure.find(
                              (opt) => opt.id === editForm.type_of_activity
                            )?.label || editForm.type_of_activity
                          : t('my_profile.choose_business_activity')}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          showBusinessActivityDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showBusinessActivityDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder={t('my_profile.search_business_activity')}
                              value={businessActivitySearchTerm}
                              onChange={(e) =>
                                setBusinessActivitySearchTerm(e.target.value)
                              }
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {businessActivityStructure
                            .filter((option) =>
                              option.label
                                .toLowerCase()
                                .includes(businessActivitySearchTerm.toLowerCase())
                            )
                            .map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                                  editForm.type_of_activity === option.id
                                    ? "bg-[#E6F0FA] text-[#01257D] font-semibold"
                                    : "text-gray-700"
                                }`}
                                onClick={() => {
                                  handleEditChange("type_of_activity", option.id);
                                  // Reset categories and subcategories when business activity changes
                                  handleEditChange("selected_categories", []);
                                  handleEditChange("selected_subcategories", []);
                                  setShowBusinessActivityDropdown(false);
                                  setBusinessActivitySearchTerm("");
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

                {/* Categories Selection */}
                {editForm.type_of_activity && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('my_profile.categories_label')}
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full px-3 py-2 border rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                        onClick={() =>
                          setShowCategoriesDropdown(!showCategoriesDropdown)
                        }
                      >
                        <span className="text-gray-500">
                          {editForm.selected_categories && editForm.selected_categories.length > 0
                            ? `${editForm.selected_categories.length} ${t('my_profile.selected')}`
                            : t('my_profile.choose_categories')}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform ${
                            showCategoriesDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {showCategoriesDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder={t('my_profile.search_categories')}
                                value={categorySearchTerm}
                                onChange={(e) =>
                                  setCategorySearchTerm(e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {(() => {
                              const activity = businessActivityStructure.find(
                                opt => opt.id === editForm.type_of_activity
                              );
                              const categories = activity?.categories || [];
                              return categories
                                .filter((option) =>
                                  option.label
                                    .toLowerCase()
                                    .includes(categorySearchTerm.toLowerCase())
                                )
                                .map((option) => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                                      editForm.selected_categories?.includes(option.id)
                                        ? "bg-[#E6F0FA] text-[#01257D] font-semibold"
                                        : "text-gray-700"
                                    }`}
                                    onClick={() => {
                                      const currentCategories = editForm.selected_categories || [];
                                      const newCategories = currentCategories.includes(option.id)
                                        ? currentCategories.filter(id => id !== option.id)
                                        : [...currentCategories, option.id];
                                      handleEditChange("selected_categories", newCategories);
                                      // Reset subcategories when categories change
                                      handleEditChange("selected_subcategories", []);
                                    }}
                                  >
                                    {option.label}
                                  </button>
                                ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Display selected categories as tags */}
                    {editForm.selected_categories && editForm.selected_categories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {editForm.selected_categories.map(catId => {
                          const activity = businessActivityStructure.find(
                            opt => opt.id === editForm.type_of_activity
                          );
                          const category = activity?.categories?.find(cat => cat.id === catId);
                          return (
                            <span
                              key={catId}
                              className="bg-[#E6F0FA] text-[#01257D] px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                            >
                              {category?.label || catId}
                              <button
                                type="button"
                                onClick={() => {
                                  const newCategories = editForm.selected_categories.filter(id => id !== catId);
                                  handleEditChange("selected_categories", newCategories);
                                  // Reset subcategories when categories change
                                  handleEditChange("selected_subcategories", []);
                                }}
                                className="text-[#01257D] hover:text-[#2346a0] font-bold"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Subcategories Selection */}
                {editForm.type_of_activity && editForm.selected_categories && editForm.selected_categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('my_profile.subcategories_label')}
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full px-3 py-2 border rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                        onClick={() =>
                          setShowSubcategoriesDropdown(!showSubcategoriesDropdown)
                        }
                      >
                        <span className="text-gray-500">
                          {editForm.selected_subcategories && editForm.selected_subcategories.length > 0
                            ? `${editForm.selected_subcategories.length} ${t('my_profile.selected')}`
                            : t('my_profile.choose_subcategories')}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform ${
                            showSubcategoriesDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {showSubcategoriesDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder={t('my_profile.search_subcategories')}
                                value={subcategorySearchTerm}
                                onChange={(e) =>
                                  setSubcategorySearchTerm(e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {(() => {
                              const activity = businessActivityStructure.find(
                                opt => opt.id === editForm.type_of_activity
                              );
                              const allSubcategories = [];
                              editForm.selected_categories.forEach(catId => {
                                const category = activity?.categories?.find(cat => cat.id === catId);
                                if (category?.subcategories) {
                                  allSubcategories.push(...category.subcategories);
                                }
                              });
                              return allSubcategories
                                .filter((option) =>
                                  option.label
                                    .toLowerCase()
                                    .includes(subcategorySearchTerm.toLowerCase())
                                )
                                .map((option) => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                                      editForm.selected_subcategories?.includes(option.id)
                                        ? "bg-[#E6F0FA] text-[#01257D] font-semibold"
                                        : "text-gray-700"
                                    }`}
                                    onClick={() => {
                                      const currentSubcategories = editForm.selected_subcategories || [];
                                      const newSubcategories = currentSubcategories.includes(option.id)
                                        ? currentSubcategories.filter(id => id !== option.id)
                                        : [...currentSubcategories, option.id];
                                      handleEditChange("selected_subcategories", newSubcategories);
                                    }}
                                  >
                                    {option.label}
                                  </button>
                                ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Display selected subcategories as tags */}
                    {editForm.selected_subcategories && editForm.selected_subcategories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {editForm.selected_subcategories.map(subcatId => {
                          const activity = businessActivityStructure.find(
                            opt => opt.id === editForm.type_of_activity
                          );
                          let subcategoryLabel = subcatId;
                          for (const cat of activity?.categories || []) {
                            const subcategory = cat.subcategories?.find(sub => sub.id === subcatId);
                            if (subcategory) {
                              subcategoryLabel = subcategory.label;
                              break;
                            }
                          }
                          return (
                            <span
                              key={subcatId}
                              className="bg-[#E6F0FA] text-[#01257D] px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                            >
                              {subcategoryLabel}
                              <button
                                type="button"
                                onClick={() => {
                                  const newSubcategories = editForm.selected_subcategories.filter(id => id !== subcatId);
                                  handleEditChange("selected_subcategories", newSubcategories);
                                }}
                                className="text-[#01257D] hover:text-[#2346D] font-bold"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('my_profile.service_areas_label')}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full px-3 py-2 border rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                      onClick={() => setShowServiceAreasDropdown(!showServiceAreasDropdown)}
                    >
                      <span className="text-gray-500">
                        {editForm.selected_service_areas && editForm.selected_service_areas.length > 0
                          ? `${editForm.selected_service_areas.length} ${t('my_profile.selected')}`
                          : t('my_profile.choose_service_areas')}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          showServiceAreasDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showServiceAreasDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder={t('my_profile.search_areas')}
                              value={serviceAreasSearchTerm}
                              onChange={(e) =>
                                setServiceAreasSearchTerm(e.target.value)
                              }
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {serviceAreaOptions
                            .filter((option) =>
                              option.label
                                .toLowerCase()
                                .includes(serviceAreasSearchTerm.toLowerCase())
                            )
                            .map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                                  editForm.selected_service_areas?.includes(option.value)
                                    ? "bg-[#E6F0FA] text-[#01257D] font-semibold"
                                    : "text-gray-700"
                                }`}
                                onClick={() => {
                                  const currentServiceAreas = editForm.selected_service_areas || [];
                                  const newServiceAreas = currentServiceAreas.includes(option.value)
                                    ? currentServiceAreas.filter(id => id !== option.value)
                                    : [...currentServiceAreas, option.value];
                                  handleEditChange("selected_service_areas", newServiceAreas);
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Display selected service areas as tags */}
                  {editForm.selected_service_areas && editForm.selected_service_areas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {editForm.selected_service_areas.map(areaId => {
                        const area = serviceAreaOptions.find(opt => opt.value === areaId);
                        return (
                          <span
                            key={areaId}
                            className="bg-[#E6F0FA] text-[#01257D] px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                          >
                            {area?.label || areaId}
                            <button
                              type="button"
                              onClick={() => {
                                const newServiceAreas = editForm.selected_service_areas.filter(id => id !== areaId);
                                handleEditChange("selected_service_areas", newServiceAreas);
                              }}
                              className="text-[#01257D] hover:text-[#2346D] font-bold"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* <div>
                  <label className="block text-sm font-medium mb-1">
                    Department Numbers (Text Input)
                  </label>
                  <input
                    type="text"
                    value={editForm.departmentNumbers || ""}
                    onChange={(e) =>
                      handleEditChange("departmentNumbers", e.target.value)
                    }
                    placeholder="Enter department numbers (e.g., 75, 69, 13)"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Enter the department numbers where you provide services
                    (e.g., 75 for Paris, 69 for Lyon)
                  </p>
                </div> */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('my_profile.about_label')}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D]"
                    value={editForm.about}
                    onChange={(e) => handleEditChange("about", e.target.value)}
                    maxLength={ABOUT_MAX_CHARS}
                    rows={4}
                    placeholder={t('my_profile.about_placeholder')}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {editForm.about ? (
                      <>
                        {countWords(editForm.about)}/{ABOUT_MAX_WORDS} words • {editForm.about.length}/{ABOUT_MAX_CHARS} characters
                      </>
                    ) : (
                      `${ABOUT_MAX_WORDS} words max • ${ABOUT_MAX_CHARS} characters max`
                    )}
                  </div>
                </div>
                {/* Skills with Enhanced Search */}
                {/* <div>
                  <label className="block text-sm font-medium mb-1">
                    Skills
                  </label>
                  <Select
                    isMulti
                    name="skills"
                    options={skillOptions}
                    value={editForm.skills.map(
                      (skill) =>
                        skillOptions.find((opt) => opt.label === skill) || {
                          value: skill,
                          label: skill,
                        }
                    )}
                    onChange={handleSkillChange}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder="Type or select skills..."
                    isSearchable={true}
                    isClearable={true}
                    menuPlacement="auto"
                    maxMenuHeight={200}
                    noOptionsMessage={() => "No skills found"}
                    loadingMessage={() => "Loading skills..."}
                    closeMenuOnSelect={false}
                    blurInputOnSelect={false}
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        borderColor: state.isFocused ? "#01257D" : "#d1d5db",
                        boxShadow: state.isFocused
                          ? "0 0 0 2px rgba(1, 37, 125, 0.2)"
                          : "none",
                        "&:hover": {
                          borderColor: "#01257D",
                        },
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected
                          ? "#E6F0FA"
                          : state.isFocused
                          ? "#F0F4F8"
                          : "white",
                        color: state.isSelected ? "#01257D" : "#374151",
                        fontWeight: state.isSelected ? "600" : "400",
                        "&:hover": {
                          backgroundColor: "#F0F4F8",
                        },
                      }),
                      multiValue: (provided) => ({
                        ...provided,
                        backgroundColor: "#E6F0FA",
                        color: "#01257D",
                      }),
                      multiValueLabel: (provided) => ({
                        ...provided,
                        color: "#01257D",
                        fontWeight: "600",
                      }),
                      multiValueRemove: (provided) => ({
                        ...provided,
                        color: "#01257D",
                        "&:hover": {
                          backgroundColor: "#d1e6f5",
                          color: "#01257D",
                        },
                      }),
                    }}
                  />
                </div> */}
              </form>
            )}
            {/* Fixed footer with buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 cursor-pointer"
                  onClick={handleEditCancel}
                >
                  {t('quote_management.cancel')}
                </button>
                <button
                  type="submit"
                  form="edit-profile-form"
                  className="px-4 py-2 rounded bg-[#01257D] text-white font-semibold hover:bg-[#2346a0] cursor-pointer"
                >
                  {t('my_profile.submit')}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
