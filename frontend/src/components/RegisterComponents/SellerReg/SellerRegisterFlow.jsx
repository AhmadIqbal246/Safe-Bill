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
import Select from "react-select";
import { Link } from "react-router-dom";

import {
  skillOptions,
  activityTypeOptions,
  serviceAreaOptions,
  countryCodeOptions,
} from "../../../constants/registerationTypes";

export default function SellerRegisterFlow({role = "seller"}) {
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
    address: "",
    contactPerson: "",
    skills: "",
    activityType: "",
    companyPhoneNumber: "",
    serviceArea: "",
    departmentNumbers: "",
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

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
      passwordErrors.push("Password is required");
    } else {
      if (password.length < 8) {
        passwordErrors.push("Password must be at least 8 characters long.");
      }
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push(
          "Password should contain at least one uppercase letter."
        );
      }
      if (!/[a-z]/.test(password)) {
        passwordErrors.push(
          "Password should contain at least one lowercase letter."
        );
      }
      if (!/\d/.test(password)) {
        passwordErrors.push("Password should contain at least one number.");
      }
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        passwordErrors.push(
          "Password should contain at least one special character."
        );
      }
    }
    if (confirmPassword) {
      if (password !== confirmPassword) {
        confirmPasswordError = "Passwords do not match";
      }
    } else if (confirmPassword === "") {
      confirmPasswordError = "Please confirm your password";
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
          [field]: "Only numbers are Allowed",
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
      setSiretError("SIRET must be exactly 14 digits");
    }
  };

  const verifySiretHandler = async () => {
    if (formData.businessNumber.length !== 14) {
      setSiretError("SIRET must be exactly 14 digits");
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
        address: siretVerification.result.address || "",
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
      newErrors.businessNumber = "Business Registration Number is required";
    } else if (!/^\d+$/.test(formData.businessNumber)) {
      newErrors.businessNumber = "only numbers are allowed";
    }
    // Integer validation for phoneNumber
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "only numbers are allowed";
    }

    // Password validation rules
    const passwordErrors = [];
    if (!formData.password) {
      passwordErrors.push("Password is required");
    } else {
      if (formData.password.length < 8) {
        passwordErrors.push("Password must be at least 8 characters long.");
      }
      if (!/[A-Z]/.test(formData.password)) {
        passwordErrors.push(
          "Password should contain at least one uppercase letter."
        );
      }
      if (!/[a-z]/.test(formData.password)) {
        passwordErrors.push(
          "Password should contain at least one lowercase letter."
        );
      }
      if (!/\d/.test(formData.password)) {
        passwordErrors.push("Password should contain at least one number.");
      }
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)) {
        passwordErrors.push(
          "Password should contain at least one special character."
        );
      }
    }
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      // Simple email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email address";
      }
    }
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    )
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the terms";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // At first there were two steps, hence twi type of validations.
  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.businessNumber.trim())
      newErrors.businessNumber = "Business number / SIRET is required";
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.contactPerson.trim())
      newErrors.contactPerson = "Contact perso name is required";
    if (!formData.skills.trim()) newErrors.skills = "Skills are required";
    if (!formData.activityType)
      newErrors.activityType = "Activity type is required";
    if (!formData.serviceArea)
      newErrors.serviceArea = "Service area is required";
    if (!formData.departmentNumbers.trim())
      newErrors.departmentNumbers = "Department numbers are required";
    // if (!formData.companyPhoneNumber.trim())
    //   newErrors.companyPhoneNumber = "Company phone number is required";

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
        return "Join Safe Bill as a Professional Buyer";
      case "seller":
      default:
        return "Join Safe Bill as a Service Provider";
    }
  };

  const getDescription = () => {
    switch (role) {
      case "professional-buyer":
        return "Complete your registration to start sourcing services and managing your business needs";
      case "seller":
      default:
        return "Complete your registration to start receiving leads and growing your business";
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
          full_address: formData.address,
          type_of_activity: formData.activityType, // bussiness type
          service_area: formData.serviceArea,
          department_numbers: formData.departmentNumbers,
          company_contact_person: formData.contactPerson,
          skills: formData.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
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
    console.log("Success:", success);

    if (success) {
      toast.success(
        typeof success === "string"
          ? success
          : success.detail ||
              "Registration successful. Please check your email to verify your Email."
      );
      setFormData(initialFormData);
      setSelectedSkills([]);
      setCurrentStep(1);
      setActivitySearchTerm('');
      setAreaSearchTerm('');
      setShowActivityDropdown(false);
      setShowAreaDropdown(false);
      dispatch(resetAuthState());
    } else if (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error.detail || Object.values(error).flat().join(", ")
      );
    }
  }, [success, error, dispatch]);

  const steps = [
    { number: 1, title: "Basic Information", active: currentStep >= 1 },
    { number: 2, title: "Documents", active: false },
    { number: 3, title: "Verification", active: false },
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
                  Business Registration Number *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.businessNumber}
                    onChange={handleSiretChange}
                    placeholder="Enter your Business Registration Number"
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
                    {siretVerification.loading ? "Verifying..." : siretVerified ? "Verified" : "Verify"}
                  </button>
                </div>
                {siretError && (
                  <p className="text-red-500 text-sm mt-1">{siretError}</p>
                )}
                {siretVerified && (
                  <p className="text-green-600 text-sm mt-1">✓ SIRET number verified successfully</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Company Name *
                  {fieldsDisabled && (
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Please verify your SIRET number to enter company details
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
                  placeholder="Company name"
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
                  Full Address *
                  {fieldsDisabled && (
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        Please verify your SIRET number to enter address details
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Enter the Address"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  } ${fieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  disabled={fieldsDisabled}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact First Name *
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    updateFormData("contactPerson", e.target.value)
                  }
                  placeholder="Enter Name"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.contactPerson ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.contactPerson && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.contactPerson}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="flex">
                  <select
                    value={formData.countryCode}
                    onChange={(e) =>
                      updateFormData("countryCode", e.target.value)
                    }
                    className="px-3 py-2 border border-r-0 border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
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
                    placeholder="Enter your phone number"
                    className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.phoneNumber ? "border-red-500" : "border-gray-300"
                    }`}
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
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="Enter your email address"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`w-full px-3 py-2 border rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.activityType ? "border-red-500" : "border-gray-300"
                    }`}
                    onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                  >
                    <span className={formData.activityType ? 'text-gray-900' : 'text-gray-500'}>
                      {formData.activityType ? 
                        activityTypeOptions.find(opt => opt.value === formData.activityType)?.label || formData.activityType 
                        : 'Select Activity'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showActivityDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showActivityDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-hidden">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search activity..."
                            value={activitySearchTerm}
                            onChange={(e) => setActivitySearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {activityTypeOptions
                          .filter(option => 
                            option.label.toLowerCase().includes(activitySearchTerm.toLowerCase())
                          )
                          .map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`w-full px-4 py-2 text-left hover:bg-[#F0F4F8] transition-colors ${
                                formData.activityType === option.value 
                                  ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                                  : 'text-gray-700'
                              }`}
                              onClick={() => {
                                updateFormData('activityType', option.value);
                                setShowActivityDropdown(false);
                                setActivitySearchTerm('');
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                {errors.activityType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.activityType}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills *
                </label>
                <Select
                  isMulti
                  name="skills"
                  options={skillOptions}
                  value={selectedSkills}
                  onChange={(selected) => {
                    setSelectedSkills(selected);
                    updateFormData(
                      "skills",
                      selected && selected.length > 0
                        ? selected.map((s) => s.label).join(",")
                        : ""
                    );
                  }}
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
                      borderColor: state.isFocused ? '#01257D' : errors.skills ? '#ef4444' : '#d1d5db',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(1, 37, 125, 0.2)' : 'none',
                      '&:hover': {
                        borderColor: errors.skills ? '#ef4444' : '#01257D'
                      }
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isSelected 
                        ? '#E6F0FA' 
                        : state.isFocused 
                        ? '#F0F4F8' 
                        : 'white',
                      color: state.isSelected ? '#01257D' : '#374151',
                      fontWeight: state.isSelected ? '600' : '400',
                      '&:hover': {
                        backgroundColor: '#F0F4F8'
                      }
                    }),
                    multiValue: (provided) => ({
                      ...provided,
                      backgroundColor: '#E6F0FA',
                      color: '#01257D'
                    }),
                    multiValueLabel: (provided) => ({
                      ...provided,
                      color: '#01257D',
                      fontWeight: '600'
                    }),
                    multiValueRemove: (provided) => ({
                      ...provided,
                      color: '#01257D',
                      '&:hover': {
                        backgroundColor: '#d1e6f5',
                        color: '#01257D'
                      }
                    })
                  }}
                />
                {errors.skills && (
                  <p className="text-red-500 text-sm mt-1">{errors.skills}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Area *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`w-full px-3 py-2 border rounded-md text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.serviceArea ? "border-red-500" : "border-gray-300"
                    }`}
                    onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                  >
                    <span className={formData.serviceArea ? 'text-gray-900' : 'text-gray-500'}>
                      {formData.serviceArea ? 
                        serviceAreaOptions.find(opt => opt.value === formData.serviceArea)?.label || formData.serviceArea 
                        : 'Select Service Area'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showAreaDropdown ? 'rotate-180' : ''}`} />
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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
                                formData.serviceArea === option.value 
                                  ? 'bg-[#E6F0FA] text-[#01257D] font-semibold' 
                                  : 'text-gray-700'
                              }`}
                              onClick={() => {
                                updateFormData('serviceArea', option.value);
                                setShowAreaDropdown(false);
                                setAreaSearchTerm('');
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                {errors.serviceArea && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.serviceArea}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Numbers *
                </label>
                <input
                  type="text"
                  value={formData.departmentNumbers}
                  onChange={(e) => updateFormData("departmentNumbers", e.target.value)}
                  placeholder="Enter department numbers (e.g., 75, 69, 13)"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.departmentNumbers ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <p className="text-gray-500 text-sm mt-1">
                  Enter the department numbers where you provide services (e.g., 75 for Paris, 69 for Lyon)
                </p>
                {errors.departmentNumbers && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.departmentNumbers}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="Create a strong password"
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
                  At least 8 characters with uppercase, lowercase, numbers and
                  special character
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
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateFormData("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm your password"
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
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
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
                    Do you Want to be in Professional Directory?
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Details */}
          {/* {currentStep === 2 && (
<option value="construction">Construction</option>
                    <option value="building_maintenance">Building Maintenance</option>
                    <option value="concrete_treatment">Concrete Treatment</option>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business registeration number *
                </label>
                <input
                  type="text"
                  value={formData.businessNumber}
                  onChange={(e) =>
                    updateFormData("businessNumber", e.target.value)
                  }
                  placeholder="Enter your Business Registeration Number"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.businessNumber ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.businessNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessNumber.replace(
                      "Business number",
                      "SIRET number"
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    updateFormData("companyName", e.target.value)
                  }
                  placeholder="Company name"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.companyName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Enter the Address"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Contact Person *
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    updateFormData("contactPerson", e.target.value)
                  }
                  placeholder="Enter Name"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.contactPerson ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.contactPerson && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.contactPerson}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills *
                </label>
                <Select
                  isMulti
                  name="skills"
                  options={skillOptions}
                  value={selectedSkills}
                  onChange={(selected) => {
                    setSelectedSkills(selected);
                    updateFormData(
                      "skills",
                      selected && selected.length > 0
                        ? selected.map((s) => s.label).join(",")
                        : ""
                    );
                  }}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Type or select skills"
                />
                {errors.skills && (
                  <p className="text-red-500 text-sm mt-1">{errors.skills}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <div className="relative">
                  <select
                    value={formData.activityType}
                    onChange={(e) =>
                      updateFormData("activityType", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none bg-white ${
                      errors.activityType ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Choose a Activity</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="painting">Painting</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.activityType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.activityType}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Phone Number *
                </label>
                <div className="flex">
                  <select
                    value={formData.companyCountryCode}
                    onChange={(e) =>
                      updateFormData("companyCountryCode", e.target.value)
                    }
                    className="px-3 py-2 border border-r-0 border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                  >
                    <option value="+33">+33</option>
                    <option value="+92">+92</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    type="tel"
                    value={formData.companyPhoneNumber}
                    onChange={(e) =>
                      updateFormData("companyPhoneNumber", e.target.value)
                    }
                    placeholder="Enter company phone number"
                    className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.companyPhoneNumber
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.companyPhoneNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.companyPhoneNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Area *
                </label>
                <div className="relative">
                  <select
                    value={formData.serviceArea}
                    onChange={(e) =>
                      updateFormData("serviceArea", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none bg-white ${
                      errors.serviceArea ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Service Area</option>
                    <option value="paris">Paris</option>
                    <option value="lyon">Lyon</option>
                    <option value="marseille">Marseille</option>
                    <option value="toulouse">Toulouse</option>
                    <option value="nice">Nice</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.serviceArea && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.serviceArea}
                  </p>
                )}
              </div>
            </div>
          )} */}

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
              Previous
            </button>

            <span className="text-[#96C2DB] text-sm">
              Already registered?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#01257D] hover:underline"
              >
                Login
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
                  Submitting...
                </span>
              ) : (
                "Create my account"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
