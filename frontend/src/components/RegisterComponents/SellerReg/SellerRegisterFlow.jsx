import { useState, useEffect } from "react";
import { ChevronDown, Eye, EyeOff, Info, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  registerSellerWithBasicAndBussiness,
  resetAuthState,
  verifySiret,
  resetSiretVerification,
} from "../../../store/slices/AuthSlices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import {
  businessActivityStructure,
  serviceAreaOptions,
  countryCodeOptions,
} from "../../../constants/registerationTypes";

export default function SellerRegisterFlow({role = "seller"}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);
  const siretVerification = useSelector(
    (state) => state.auth.siretVerification
  );

  const initialFormData = {
    email: "",
    phoneNumber: "",
    countryCode: "+33",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    receiveMarketing: false,
    businessNumber: "",
    companyName: "",
    streetAddress: "",
    postalCode: "",
    cityRegion: "",
    contactPersonFirstName: "",
    contactPersonLastName: "",
    businessActivity: "",
    selectedCategories: [],
    selectedSubcategories: [],
    companyPhoneNumber: "",
    selectedServiceAreas: [],
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  
  // New state for hierarchical business activity selection
  const [showBusinessActivityDropdown, setShowBusinessActivityDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showSubcategoriesDropdown, setShowSubcategoriesDropdown] = useState(false);
  const [businessActivitySearchTerm, setBusinessActivitySearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [subcategorySearchTerm, setSubcategorySearchTerm] = useState('');
  
  // New state for multiple service area selection
  const [showServiceAreasDropdown, setShowServiceAreasDropdown] = useState(false);
  const [serviceAreasSearchTerm, setServiceAreasSearchTerm] = useState('');

  const [errors, setErrors] = useState({});
  const [siretStatus, setSiretStatus] = useState("idle"); // idle | loading | success | error
  const [siretError, setSiretError] = useState("");
  const [fieldsDisabled, setFieldsDisabled] = useState(true);
  const [siretVerified, setSiretVerified] = useState(false);

  // Password validation regex: at least 8 chars, one uppercase, one lowercase, one number, one special char
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  // Real-time password validation
  const validatePasswordRealtime = (password, confirmPassword) => {
    let passwordErrors = [];
    let confirmPasswordError = "";
    if (!password) {
      passwordErrors.push(t('registration.password_required'));
    } else {
      if (password.length < 8) {
        passwordErrors.push(t('registration.password_min_length'));
      }
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push(
          t('registration.password_complexity')
        );
      }
      if (!/[a-z]/.test(password)) {
        passwordErrors.push(
          t('registration.password_complexity')
        );
      }
      if (!/\d/.test(password)) {
        passwordErrors.push(t('registration.password_complexity'));
      }
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        passwordErrors.push(
          t('registration.password_complexity')
        );
      }
    }
    if (confirmPassword) {
      if (password !== confirmPassword) {
        confirmPasswordError = t('registration.passwords_not_match');
      }
    } else if (confirmPassword === "") {
      confirmPasswordError = t('registration.confirm_password_required');
    }
    // If passwordErrors is empty, set errors.password to empty string
    setErrors((prev) => ({
      ...prev,
      password: passwordErrors.length > 0 ? passwordErrors : "",
      confirmPassword: confirmPasswordError,
    }));
  };

  const updateFormData = (field, value) => {
    // Integer-only enforcement for businessNumber and phoneNumber
    if (
      (field === "businessNumber" || field === "phoneNumber") &&
      value !== ""
    ) {
      // Allow only digits
      if (!/^\d*$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          [field]: t('registration.only_numbers_allowed_validation'),
        }));
        return;
      } else {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Real-time password validation
    if (field === "password" || field === "confirmPassword") {
      const pwd = field === "password" ? value : formData.password;
      const confPwd =
        field === "confirmPassword" ? value : formData.confirmPassword;
      validatePasswordRealtime(pwd, confPwd);
    } else if (
      errors[field] &&
      field !== "businessNumber" &&
      field !== "phoneNumber"
    ) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSiretChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    setFormData((prev) => ({ ...prev, businessNumber: value }));
    setSiretError("");
    setFieldsDisabled(true);
    setSiretVerified(false);
    dispatch(resetSiretVerification());
    if (value.length !== 14) {
      setSiretError(t('seller_registration.siret_error'));
    }
  };

  const verifySiretHandler = async () => {
    if (formData.businessNumber.length !== 14) {
      setSiretError(t('seller_registration.siret_error'));
      return;
    }
    setSiretError("");
    dispatch(verifySiret(formData.businessNumber));
  };

  useEffect(() => {
    if (siretVerification.result && siretVerification.result.valid) {
      setFormData((prev) => ({
        ...prev,
        companyName: siretVerification.result.company_name || "",
        streetAddress: siretVerification.result.street_address || "",
        postalCode: siretVerification.result.postal_code || "",
        cityRegion: siretVerification.result.region || "",
      }));
      setFieldsDisabled(false);
      setSiretVerified(true);
    } else if (siretVerification.error) {
      setSiretError(siretVerification.error);
      setFieldsDisabled(true);
      setSiretVerified(false);
    }
  }, [siretVerification]);

  const validateStep1 = () => {
    const newErrors = {};

    // Integer validation for businessNumber
    if (!formData.businessNumber.trim()) {
      newErrors.businessNumber = t('seller_registration.business_registration_number_label').replace(' *', '');
    } else if (!/^\d+$/.test(formData.businessNumber)) {
      newErrors.businessNumber = t('registration.only_numbers_allowed_validation');
    }
    // Integer validation for phoneNumber
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = t('seller_registration.phone_number_label').replace(' *', '');
    } else if (!/^\d+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = t('registration.only_numbers_allowed_validation');
    }

    // Password validation rules
    const passwordErrors = [];
    if (!formData.password) {
      passwordErrors.push(t('registration.password_required'));
    } else {
      if (formData.password.length < 8) {
        passwordErrors.push(t('registration.password_min_length'));
      }
      if (!/[A-Z]/.test(formData.password)) {
        passwordErrors.push(
          t('registration.password_complexity')
        );
      }
      if (!/[a-z]/.test(formData.password)) {
        passwordErrors.push(
          t('registration.password_complexity')
        );
      }
      if (!/\d/.test(formData.password)) {
        passwordErrors.push(t('registration.password_complexity'));
      }
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)) {
        passwordErrors.push(
          t('registration.password_complexity')
        );
      }
    }
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('registration.email_required');
    } else {
      // Simple email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t('registration.invalid_email');
      }
    }
    if (!formData.confirmPassword)
      newErrors.confirmPassword = t('registration.confirm_password_required');
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    )
      newErrors.confirmPassword = t('registration.passwords_not_match');
    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the terms";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // At first there were two steps, hence twi type of validations.
  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.businessNumber.trim())
      newErrors.businessNumber = t('seller_registration.business_registration_number_label').replace(' *', '');
    if (!formData.companyName.trim())
      newErrors.companyName = t('seller_registration.company_name_label').replace(' *', '');
    if (!formData.streetAddress.trim()) newErrors.streetAddress = t('seller_registration.street_address_label').replace(' *', '');
    if (!formData.postalCode.trim()) newErrors.postalCode = t('seller_registration.postal_code_label').replace(' *', '');
    if (!formData.cityRegion.trim()) newErrors.cityRegion = t('seller_registration.city_region_label').replace(' *', '');
    if (!formData.contactPersonFirstName.trim())
      newErrors.contactPersonFirstName = t('seller_registration.contact_first_name_label').replace(' *', '');
    if (!formData.contactPersonLastName.trim())
      newErrors.contactPersonLastName = t('seller_registration.contact_last_name_label').replace(' *', '');
    if (!formData.businessActivity)
      newErrors.businessActivity = t('seller_registration.business_activity_label').replace(' *', '');
    if (!formData.selectedServiceAreas || formData.selectedServiceAreas.length === 0)
      newErrors.selectedServiceAreas = t('seller_registration.service_areas_label').replace(' *', '');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const getTitle = () => {
    switch (role) {
      case "professional-buyer":
        return t('seller_registration.title_professional_buyer');
      case "seller":
      default:
        return t('seller_registration.title_seller');
    }
  };

  const getDescription = () => {
    switch (role) {
      case "professional-buyer":
        return t('seller_registration.description_professional_buyer');
      case "seller":
      default:
        return t('seller_registration.description_seller');
    }
  };

  const handleSubmit = () => {
    // Always validate step 1 before submitting
    if (!validateStep1()) {
      return;
    }
    if (validateStep2()) {
      const payload = {
        Basic_Information: {
          username: formData.email.split("@")[0], // or another username logic
          email: formData.email,
          password: formData.password,
          phone_number: formData.phoneNumber,
          role: role,
        },
        Bussiness_information: {
          company_name: formData.companyName,
          siret_number: formData.businessNumber,
          full_address: `${formData.streetAddress}, ${formData.postalCode}, ${formData.cityRegion}`,
          type_of_activity: formData.businessActivity,
          selected_categories: formData.selectedCategories,
          selected_subcategories: formData.selectedSubcategories,
          selected_service_areas: formData.selectedServiceAreas,
          company_contact_person_first_name: formData.contactPersonFirstName,
          company_contact_person_last_name: formData.contactPersonLastName,
        },
      };
      dispatch(registerSellerWithBasicAndBussiness(payload));
    }
  };

  const handlePrevious = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  useEffect(() => {

    if (success) {
      toast.success(
        typeof success === "string"
          ? success
          : success.detail ||
              t('registration.registration_success')
      );
      setFormData(initialFormData);
      setCurrentStep(1);
      setActivitySearchTerm('');
      setAreaSearchTerm('');
      setShowActivityDropdown(false);
      setShowBusinessActivityDropdown(false);
      setShowCategoriesDropdown(false);
      setShowSubcategoriesDropdown(false);
      setShowServiceAreasDropdown(false);
      setBusinessActivitySearchTerm('');
      setCategorySearchTerm('');
      setSubcategorySearchTerm('');
      setServiceAreasSearchTerm('');
      setSiretVerified(false);
      setSiretStatus("idle");
      setSiretError("");
      setFieldsDisabled(true);
      dispatch(resetAuthState());
    } else if (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error.detail || Object.values(error).flat().join(", ")
      );
    }
  }, [success, error, dispatch, t]);

  const steps = [
    { number: 1, title: t('seller_registration.basic_information_step'), active: currentStep >= 1 },
    { number: 2, title: t('seller_registration.documents_step'), active: false },
    { number: 3, title: t('seller_registration.verification_step'), active: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-[#FFFFFF] rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[#111827] mb-2">
              {getTitle()}
            </h1>
            <p className="text-[#111827]">
              {getDescription()}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            {/* Step circles row */}
            <div className="flex justify-between mb-2 relative z-10">
              {steps.map((step, idx) => (
                <div
                  key={step.number}
                  className="flex flex-col items-center w-1/3"
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-base font-bold transition-all duration-200
                      ${
                        currentStep === step.number
                          ? "bg-[#01257D] text-white shadow-lg"
                          : step.active
                          ? "bg-white border-2 border-[#01257D] text-[#01257D]"
                          : "bg-[#96C2DB] text-white"
                      }
                    `}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold text-center ${
                      step.active ? "text-[#01257D]" : "text-[#96C2DB]"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress bar track */}
            <div className="relative h-2 mt-2">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-[#96C2DB] rounded-full -translate-y-1/2" />
              <div
                className="absolute top-1/2 left-0 h-1 bg-[#01257D] rounded-full transition-all duration-300 -translate-y-1/2"
                style={{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                  maxWidth: "100%",
                }}
              />
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('seller_registration.business_registration_number_label')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.businessNumber}
                    onChange={handleSiretChange}
                    placeholder={t('seller_registration.business_registration_number_placeholder')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.businessNumber
                        ? "border-red-500"
                        : "border-gray-300"
                    } ${siretVerified ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={14}
                    disabled={siretVerified}
                  />
                  <button
                    type="button"
                    onClick={verifySiretHandler}
                    className="ml-2 px-3 py-2 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] disabled:opacity-50 cursor-pointer"
                    disabled={
                      formData.businessNumber.length !== 14 ||
                      siretVerification.loading ||
                      siretVerified
                    }
                  >
                    {siretVerification.loading ? t('seller_registration.verifying') : siretVerified ? t('seller_registration.verified') : t('seller_registration.verify')}
                  </button>
                </div>
                {siretError && (
                  <p className="text-red-500 text-sm mt-1">{siretError}</p>
                )}
                {siretVerified && (
                  <p className="text-green-600 text-sm mt-1">{t('seller_registration.siret_success')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {t('seller_registration.company_name_label')}
                  {fieldsDisabled && (
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        {t('seller_registration.siret_tooltip')}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    updateFormData("companyName", e.target.value)
                  }
                  placeholder={t('seller_registration.company_name_placeholder')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.companyName ? "border-red-500" : "border-gray-300"
                  } ${fieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  disabled={fieldsDisabled}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {t('seller_registration.street_address_label')}
                  {fieldsDisabled && (
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        {t('seller_registration.address_tooltip')}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.streetAddress}
                  onChange={(e) => updateFormData("streetAddress", e.target.value)}
                  placeholder={t('seller_registration.street_address_placeholder')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.streetAddress ? "border-red-500" : "border-gray-300"
                  } ${fieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  disabled={fieldsDisabled}
                />
                {errors.streetAddress && (
                  <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {t('seller_registration.postal_code_label')}
                  {fieldsDisabled && (
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        {t('seller_registration.postal_code_tooltip')}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => updateFormData("postalCode", e.target.value)}
                  placeholder={t('seller_registration.postal_code_placeholder')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.postalCode ? "border-red-500" : "border-gray-300"
                  } ${fieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  disabled={fieldsDisabled}
                />
                {errors.postalCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {t('seller_registration.city_region_label')}
                  {fieldsDisabled && (
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        {t('seller_registration.city_region_tooltip')}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.cityRegion}
                  onChange={(e) => updateFormData("cityRegion", e.target.value)}
                  placeholder={t('seller_registration.city_region_placeholder')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.cityRegion ? "border-red-500" : "border-gray-300"
                  } ${fieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  disabled={fieldsDisabled}
                />
                {errors.cityRegion && (
                  <p className="text-red-500 text-sm mt-1">{errors.cityRegion}</p>
                )}
                {siretVerified && (
                  <p className="text-green-600 text-sm mt-1">
                    {t('seller_registration.address_components_populated')}
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {t('seller_registration.address_fields_combined_note')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('seller_registration.contact_first_name_label')}
                  </label>
                  <input
                    type="text"
                    value={formData.contactPersonFirstName}
                    onChange={(e) =>
                      updateFormData("contactPersonFirstName", e.target.value)
                    }
                    placeholder={t('seller_registration.contact_first_name_placeholder')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.contactPersonFirstName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.contactPersonFirstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.contactPersonFirstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('seller_registration.contact_last_name_label')}
                  </label>
                  <input
                    type="text"
                    value={formData.contactPersonLastName}
                    onChange={(e) =>
                      updateFormData("contactPersonLastName", e.target.value)
                    }
                    placeholder={t('seller_registration.contact_last_name_placeholder')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.contactPersonLastName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.contactPersonLastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.contactPersonLastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('seller_registration.phone_number_label')}
                </label>
                <div className="flex">
                  <select
                    value={formData.countryCode}
                    onChange={(e) =>
                      updateFormData("countryCode", e.target.value)
                    }
                    className="px-3 py-2 border border-r-0 border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white sm:w-auto w-36"
                  >
                    {countryCodeOptions.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      updateFormData("phoneNumber", e.target.value)
                    }
                    placeholder={t('seller_registration.phone_number_placeholder')}
                    className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.phoneNumber ? "border-red-500" : "border-gray-300"
                    } sm:w-full w-38`}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('seller_registration.email_label')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder={t('seller_registration.email_address_placeholder')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Business Activity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('seller_registration.business_activity_label')}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`w-full px-3 py-2 border rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.businessActivity ? "border-red-500" : "border-gray-300"
                    }`}
                    onClick={() => setShowBusinessActivityDropdown(!showBusinessActivityDropdown)}
                  >
                    <span className={formData.businessActivity ? 'text-gray-900' : 'text-gray-500'}>
                      {formData.businessActivity ? 
                        businessActivityStructure.find(opt => opt.id === formData.businessActivity)?.label || formData.businessActivity 
                        : t('seller_registration.select_business_activity_placeholder')}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showBusinessActivityDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showBusinessActivityDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder={t('seller_registration.search_business_activity_placeholder')}
                            value={businessActivitySearchTerm}
                            onChange={(e) => setBusinessActivitySearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {businessActivityStructure
                          .filter(option => 
                            option.label.toLowerCase().includes(businessActivitySearchTerm.toLowerCase())
                          )
                          .map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                                formData.businessActivity === option.id 
                                  ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                                  : 'text-gray-700'
                              }`}
                              onClick={() => {
                                updateFormData('businessActivity', option.id);
                                updateFormData('selectedCategories', []);
                                updateFormData('selectedSubcategories', []);
                                setShowBusinessActivityDropdown(false);
                                setBusinessActivitySearchTerm('');
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                {errors.businessActivity && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessActivity}
                  </p>
                )}
              </div>

              {/* Categories Selection (Optional) */}
              {formData.businessActivity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('seller_registration.categories_optional_label')}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                    >
                      <span className={formData.selectedCategories.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.selectedCategories.length > 0 
                          ? t('seller_registration.category_selected_count', { count: formData.selectedCategories.length })
                          : t('seller_registration.select_categories_placeholder')}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showCategoriesDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder={t('seller_registration.search_categories_placeholder')}
                              value={categorySearchTerm}
                              onChange={(e) => setCategorySearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {businessActivityStructure
                            .find(activity => activity.id === formData.businessActivity)
                            ?.categories
                            .filter(category => 
                              category.label.toLowerCase().includes(categorySearchTerm.toLowerCase())
                            )
                            .map((category) => (
                              <button
                                key={category.id}
                                type="button"
                                className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                                  formData.selectedCategories.includes(category.id)
                                    ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                                    : 'text-gray-700'
                                }`}
                                onClick={() => {
                                  const newCategories = formData.selectedCategories.includes(category.id)
                                    ? formData.selectedCategories.filter(id => id !== category.id)
                                    : [...formData.selectedCategories, category.id];
                                  updateFormData('selectedCategories', newCategories);
                                  // Clear subcategories when categories change
                                  updateFormData('selectedSubcategories', []);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{category.label}</span>
                                  {formData.selectedCategories.includes(category.id) && (
                                    <span className="text-[#01257D]">✓</span>
                                  )}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {formData.selectedCategories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.selectedCategories.map(categoryId => {
                        const category = businessActivityStructure
                          .find(activity => activity.id === formData.businessActivity)
                          ?.categories.find(cat => cat.id === categoryId);
                        return category ? (
                          <span
                            key={categoryId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#E6F0FA] text-[#01257D]"
                          >
                            {category.label}
                            <button
                              type="button"
                              onClick={() => {
                                const newCategories = formData.selectedCategories.filter(id => id !== categoryId);
                                updateFormData('selectedCategories', newCategories);
                                // Clear subcategories when categories change
                                updateFormData('selectedSubcategories', []);
                              }}
                              className="ml-1 text-[#01257D] hover:text-[#2346a0]"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Subcategories Selection (Optional) */}
              {formData.selectedCategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('seller_registration.subcategories_optional_label')}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      onClick={() => setShowSubcategoriesDropdown(!showSubcategoriesDropdown)}
                    >
                      <span className={formData.selectedSubcategories.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.selectedSubcategories.length > 0 
                          ? t('seller_registration.subcategory_selected_count', { count: formData.selectedSubcategories.length })
                          : t('seller_registration.select_subcategories_placeholder')}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showSubcategoriesDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showSubcategoriesDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder={t('seller_registration.search_subcategories_placeholder')}
                              value={subcategorySearchTerm}
                              onChange={(e) => setSubcategorySearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {formData.selectedCategories.flatMap(categoryId => {
                            const category = businessActivityStructure
                              .find(activity => activity.id === formData.businessActivity)
                              ?.categories.find(cat => cat.id === categoryId);
                            return category?.subcategories || [];
                          })
                          .filter(subcategory => 
                            subcategory.label.toLowerCase().includes(subcategorySearchTerm.toLowerCase())
                          )
                          .map((subcategory) => (
                            <button
                              key={subcategory.id}
                              type="button"
                              className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                                formData.selectedSubcategories.includes(subcategory.id)
                                  ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                                  : 'text-gray-700'
                              }`}
                              onClick={() => {
                                const newSubcategories = formData.selectedSubcategories.includes(subcategory.id)
                                  ? formData.selectedSubcategories.filter(id => id !== subcategory.id)
                                  : [...formData.selectedSubcategories, subcategory.id];
                                updateFormData('selectedSubcategories', newSubcategories);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span>{subcategory.label}</span>
                                {formData.selectedSubcategories.includes(subcategory.id) && (
                                  <span className="text-[#01257D]">✓</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {formData.selectedSubcategories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.selectedSubcategories.map(subcategoryId => {
                        const subcategory = formData.selectedCategories.flatMap(categoryId => {
                          const category = businessActivityStructure
                            .find(activity => activity.id === formData.businessActivity)
                            ?.categories.find(cat => cat.id === categoryId);
                          return category?.subcategories || [];
                        }).find(sub => sub.id === subcategoryId);
                        return subcategory ? (
                          <span
                            key={subcategoryId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#E6F0FA] text-[#01257D]"
                          >
                            {subcategory.label}
                            <button
                              type="button"
                              onClick={() => {
                                const newSubcategories = formData.selectedSubcategories.filter(id => id !== subcategoryId);
                                updateFormData('selectedSubcategories', newSubcategories);
                              }}
                              className="ml-1 text-[#01257D] hover:text-[#2346a0]"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('seller_registration.service_areas_label')}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`w-full px-3 py-2 border rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.serviceArea ? "border-red-500" : "border-gray-300"
                    }`}
                    onClick={() => setShowServiceAreasDropdown(!showServiceAreasDropdown)}
                  >
                    <span className="text-gray-500">
                      {formData.selectedServiceAreas && formData.selectedServiceAreas.length > 0
                        ? t('seller_registration.service_area_selected_count', { count: formData.selectedServiceAreas.length })
                        : t('seller_registration.choose_service_areas_placeholder')}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showServiceAreasDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showServiceAreasDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder={t('seller_registration.search_service_areas_placeholder')}
                            value={serviceAreasSearchTerm}
                            onChange={(e) => setServiceAreasSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {serviceAreaOptions
                          .filter(option => 
                            option.label.toLowerCase().includes(serviceAreasSearchTerm.toLowerCase())
                          )
                          .map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                                formData.selectedServiceAreas?.includes(option.value)
                                  ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                                  : 'text-gray-700'
                              }`}
                              onClick={() => {
                                const currentServiceAreas = formData.selectedServiceAreas || [];
                                const newServiceAreas = currentServiceAreas.includes(option.value)
                                  ? currentServiceAreas.filter(id => id !== option.value)
                                  : [...currentServiceAreas, option.value];
                                updateFormData('selectedServiceAreas', newServiceAreas);
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
                {formData.selectedServiceAreas && formData.selectedServiceAreas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.selectedServiceAreas.map(serviceAreaId => {
                      const serviceArea = serviceAreaOptions.find(opt => opt.value === serviceAreaId);
                      return (
                        <span
                          key={serviceAreaId}
                          className="bg-[#E6F0FA] text-[#01257D] px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                        >
                          {serviceArea?.label || serviceAreaId}
                          <button
                            type="button"
                            onClick={() => {
                              const newServiceAreas = formData.selectedServiceAreas.filter(id => id !== serviceAreaId);
                              updateFormData('selectedServiceAreas', newServiceAreas);
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
                
                {errors.serviceArea && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.serviceArea}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('seller_registration.password_label')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder={t('seller_registration.password_placeholder')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      Array.isArray(errors.password) &&
                      errors.password.length > 0
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    inputMode="text"
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {t('seller_registration.password_requirements')}
                </p>
                {Array.isArray(errors.password) &&
                  errors.password.length > 0 && (
                    <ul className="text-red-500 text-sm mt-1 list-disc list-inside">
                      {errors.password.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                {typeof errors.password === "string" && errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('seller_registration.confirm_password_label')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateFormData("confirmPassword", e.target.value)
                    }
                    placeholder={t('seller_registration.confirm_password_placeholder')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </span>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.agreeToTerms}
                    onChange={(e) =>
                      updateFormData("agreeToTerms", e.target.checked)
                    }
                    className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                    {t('seller_registration.agree_to_terms')}{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      {t('seller_registration.terms_of_service')}
                    </a>{" "}
                    {t('seller_registration.and')}{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      {t('seller_registration.privacy_policy')}
                    </a>
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-red-500 text-sm">{t('seller_registration.must_agree_to_terms')}</p>
                )}

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={formData.receiveMarketing}
                    onChange={(e) =>
                      updateFormData("receiveMarketing", e.target.checked)
                    }
                    className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label
                    htmlFor="marketing"
                    className="ml-2 text-sm text-gray-700"
                  >
                    {t('seller_registration.professional_directory_question')}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-8 gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                currentStep === 1
                  ? "bg-[#E6F0FA] text-[#01257D] opacity-60 cursor-not-allowed"
                  : "bg-[#E6F0FA] text-[#01257D] hover:bg-[#c7e0fa]"
              }`}
            >
              {t('seller_registration.previous')}
            </button>

            <span className="text-[#96C2DB] text-sm">
              {t('seller_registration.already_registered_question')}{" "}
              <Link
                to="/login"
                className="font-semibold text-[#01257D] hover:underline"
              >
                {t('seller_registration.login_link')}
              </Link>
            </span>

            <button
              onClick={handleSubmit}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center bg-[#01257D] text-white hover:bg-[#2346a0] ${
                loading ? "opacity-80" : ""
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <ClipLoader color="#fff" loading={loading} size={20} />
                  {t('seller_registration.submitting')}
                </span>
              ) : (
                t('seller_registration.create_my_account')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
