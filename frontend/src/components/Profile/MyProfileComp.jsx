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

function getDefaultAvatar(username) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    username || "User"
  )}&background=E6F0FA&color=01257D&size=96`;
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function MyProfileComp() {
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
  const [areaSearchTerm, setAreaSearchTerm] = useState("");
  const [showBusinessActivityDropdown, setShowBusinessActivityDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showSubcategoriesDropdown, setShowSubcategoriesDropdown] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (success && editModalOpen) {
      setEditModalOpen(false);
      setEditForm(null);
      setEditPicPreview(null);
      toast.success("Profile updated successfully!");
      // Update auth.user in Redux
      if (editForm) {
        dispatch(setUser({ ...profile, ...editForm }));
      }
    }
  }, [success]);

  useEffect(() => {
    if (feedbackSuccess) {
      toast.success("Feedback submitted successfully!");
      dispatch(resetFeedbackState());
      setSelectedRating(null);
      setFeedbackText("");
      setFeedbackEmail("");
    }
    if (feedbackError) {
      toast.error("Failed to submit feedback.");
      dispatch(resetFeedbackState());
    }
  }, [feedbackSuccess, feedbackError, dispatch]);

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
      toast.error("Please select a rating first");
      return;
    }
    if (!feedbackEmail) {
      toast.error("Please provide your email address");
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
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }
  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {typeof error === "string" ? error : "Failed to load profile."}
      </div>
    );
  }
  if (!profile) {
    return null;
  }

  const avatarSrc = profile.profile_pic || getDefaultAvatar(profile.username);

  // Prepare initial values for edit form
  const openEditModal = () => {
    setEditForm({
      username: profile.username || "",
      type_of_activity: profile.type_of_activity || "",
      selected_categories: Array.isArray(profile.selected_categories) ? profile.selected_categories : [],
      selected_subcategories: Array.isArray(profile.selected_subcategories) ? profile.selected_subcategories : [],
      service_area: profile.service_area || "",
      departmentNumbers: profile.department_numbers || "",
      about: profile.about || "",
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      profile_pic: null,
    });
    setEditPicPreview(null);
    setEditModalOpen(true);
    setBusinessActivitySearchTerm("");
    setCategorySearchTerm("");
    setSubcategorySearchTerm("");
    setAreaSearchTerm("");
    setShowBusinessActivityDropdown(false);
    setShowCategoriesDropdown(false);
    setShowSubcategoriesDropdown(false);
    setShowAreaDropdown(false);
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
    setAreaSearchTerm("");
    setShowBusinessActivityDropdown(false);
    setShowCategoriesDropdown(false);
    setShowSubcategoriesDropdown(false);
    setShowAreaDropdown(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm) return;
    // Use existing values for any blank fields
    const data = {
      username: editForm.username || profile.username,
      type_of_activity: editForm.type_of_activity || profile.type_of_activity,
      selected_categories: editForm.selected_categories && editForm.selected_categories.length > 0
        ? editForm.selected_categories
        : profile.selected_categories,
      selected_subcategories: editForm.selected_subcategories && editForm.selected_subcategories.length > 0
        ? editForm.selected_subcategories
        : profile.selected_subcategories,
      service_area: editForm.service_area || profile.service_area,
      departmentNumbers:
        editForm.departmentNumbers || profile.department_numbers || "",
      about: editForm.about || profile.about,
      skills:
        editForm.skills && editForm.skills.length > 0
          ? editForm.skills
          : profile.skills,
    };
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
          Business Activity:{" "}
          {profile.type_of_activity
            ? businessActivityStructure.find(
                (opt) => opt.id === profile.type_of_activity
              )?.label || capitalize(profile.type_of_activity)
            : "Not specified"}
        </div>
        {profile.selected_categories && profile.selected_categories.length > 0 && (
          <div className="text-gray-500 font-medium">
            Categories:{" "}
            {profile.selected_categories.map(catId => {
              const activity = businessActivityStructure.find(
                opt => opt.id === profile.type_of_activity
              );
              const category = activity?.categories?.find(cat => cat.id === catId);
              return category?.label || catId;
            }).join(", ")}
          </div>
        )}
        {profile.selected_subcategories && profile.selected_subcategories.length > 0 && (
          <div className="text-gray-500 font-medium">
            Subcategories:{" "}
            {profile.selected_subcategories.map(subcatId => {
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
        <div className="text-gray-400 text-sm mb-2">
          {profile.service_area
            ? `Service Area: ${serviceAreaOptions.find(
                (opt) => opt.value === profile.service_area
              )?.label || capitalize(profile.service_area)}`
            : "Service area not specified"}
        </div>
        <div className="text-gray-400 text-sm mb-2">
          {profile.department_numbers
            ? `Service Area Department: ${profile.department_numbers}`
            : "Department numbers not specified"}
        </div>
        <button
          className="w-full max-w-xs bg-[#E6F0FA] text-[#01257D] font-semibold py-2 rounded-md mb-2 mt-2 cursor-pointer"
          onClick={openEditModal}
        >
          Edit
        </button>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">About</h2>
        <div className=" rounded-lg px-4 py-3 text-gray-700 break-words">
          {profile.about || "No about info provided."}
        </div>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {(Array.isArray(profile.skills) ? profile.skills : []).length > 0 ? (
            (Array.isArray(profile.skills) ? profile.skills : []).map(
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
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">Contact</h2>
        <div className="flex flex-col sm:flex-row gap-6 text-gray-700">
          <div>
            <div className="text-xs text-gray-400 font-semibold">Email</div>
            <div>{profile.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Phone</div>
            <div>{profile.phone_number}</div>
          </div>
        </div>
      </div>
      {/* Feedback form remains as before, not populated from API */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Help us improve</h2>
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
          💡 Select a rating to get started, then feel free to add your own
          thoughts below!
        </div>
        <div className="mb-4">
          <textarea
            className="w-full min-h-[80px] rounded-md border border-gray-200 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#01257D]"
            placeholder="Feedback"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </div>
        <input
          type="email"
          className="w-full mb-4 rounded-md border border-gray-200 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#01257D] cursor-pointer"
          placeholder="Your email address"
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
              Submitting...
            </div>
          ) : (
            "Submit Feedback"
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
                Edit Profile
              </Dialog.Title>
            </div>
            {editForm && (
              <form id="edit-profile-form" onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                    Upload New Picture
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    value={editForm.username}
                    onChange={(e) =>
                      handleEditChange("username", e.target.value)
                    }
                  />
                </div>
                {/* Business Activity Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Business Activity
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
                          : "Choose Business Activity"}
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
                              placeholder="Search business activity..."
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
                      Categories (Optional)
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
                            ? `${editForm.selected_categories.length} selected`
                            : "Choose Categories"}
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
                                placeholder="Search categories..."
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
                      Subcategories (Optional)
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
                            ? `${editForm.selected_subcategories.length} selected`
                            : "Choose Subcategories"}
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
                                placeholder="Search subcategories..."
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
                    Service Area
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full px-3 py-2 border rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
                      onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                    >
                      <span
                        className={
                          editForm.service_area
                            ? "text-gray-900"
                            : "text-gray-500"
                        }
                      >
                        {editForm.service_area
                          ? serviceAreaOptions.find(
                              (opt) => opt.value === editForm.service_area
                            )?.label || editForm.service_area
                          : "Choose Service Area"}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          showAreaDropdown ? "rotate-180" : ""
                        }`}
                      />
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
                              onChange={(e) =>
                                setAreaSearchTerm(e.target.value)
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
                                .includes(areaSearchTerm.toLowerCase())
                            )
                            .map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                                  editForm.service_area === option.value
                                    ? "bg-[#E6F0FA] text-[#01257D] font-semibold"
                                    : "text-gray-700"
                                }`}
                                onClick={() => {
                                  handleEditChange(
                                    "service_area",
                                    option.value
                                  );
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
                <div>
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
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    About
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md"
                    value={editForm.about}
                    onChange={(e) => handleEditChange("about", e.target.value)}
                  />
                </div>
                {/* Skills with Enhanced Search */}
                <div>
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
                </div>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-profile-form"
                  className="px-4 py-2 rounded bg-[#01257D] text-white font-semibold hover:bg-[#2346a0] cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
