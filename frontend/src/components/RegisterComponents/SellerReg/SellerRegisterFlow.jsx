import { useState, useEffect } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  registerSellerWithBasicAndBussiness,
  resetAuthState,
} from "../../../store/slices/AuthSlices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import Select from "react-select";
import { Link } from "react-router-dom";

const skillOptions = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "painting", label: "Painting" },
  { value: "carpentry", label: "Carpentry" },
  { value: "cleaning", label: "Cleaning" },
  // ...add more
];

export default function SellerRegisterFlow() {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

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
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    // if (!formData.firstName.trim())
    //   newErrors.firstName = "First name is required";
    // if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    if (formData.password !== formData.confirmPassword)
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

  const handleSubmit = () => {
    if (validateStep2()) {
      const payload = {
        Basic_Information: {
          username: formData.email.split("@")[0], // or another username logic
          email: formData.email,
          password: formData.password,
          phone_number: formData.phoneNumber,
          role: "seller",
        },
        Bussiness_information: {
          company_name: formData.companyName,
          siret_number: formData.businessNumber,
          full_address: formData.address,
          type_of_activity: formData.activityType, // bussiness type
          service_area: formData.serviceArea,
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
          : success.detail || "Registration successful. Please check your email to verify your Email."
      );
      setFormData(initialFormData);
      setSelectedSkills([]);
      setCurrentStep(1);
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
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Join Safe Bill as a Service Provider
            </h1>
            <p className="text-gray-600">
              Complete your registration to start receiving leads and growing
              your business
            </p>
          </div>

          {/* Progress Steps */}
          <div className="relative mb-8">
            {/* Progress bar */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 rounded-full transform -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-black rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                maxWidth: "100%",
                transform: "translateY(-50%)",
              }}
            />
            {/* Step circles */}
            <div className="relative flex justify-between">
              {steps.map((step, idx) => (
                <div
                  key={step.number}
                  className="flex flex-col items-center w-1/5"
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium z-10
            ${
              currentStep === step.number
                ? "bg-black text-white"
                : step.active
                ? "bg-white border-2 border-black text-black"
                : "bg-gray-200 text-gray-500"
            }`}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      step.active ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SIRET Number *
                </label>
                <input
                  type="text"
                  value={formData.businessNumber}
                  onChange={(e) =>
                    updateFormData("businessNumber", e.target.value)
                  }
                  placeholder="Enter your SIRET Number"
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
                  Full Address *
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
                    <option value="+33">+33</option>
                    <option value="+92">+92</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      updateFormData("phoneNumber", e.target.value)
                    }
                    placeholder="Enter your phone number"
                    className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.phoneNumber ? "border-red-500" : "border-gray-300"
                    }`}
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
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
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
                  At least 8 characters with uppercase, lowercase, and numbers
                </p>
                {errors.password && (
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
                    onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                    placeholder="Confirm your password"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.confirmPassword ? "border-red-500" : "border-gray-300"
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
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SIRET Number *
                </label>
                <input
                  type="text"
                  value={formData.businessNumber}
                  onChange={(e) =>
                    updateFormData("businessNumber", e.target.value)
                  }
                  placeholder="Enter your SIRET Number"
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
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Already registered?{" "}
              <Link
                to="/login"
                className="font-medium text-gray-800 hover:underline"
              >
                Login
              </Link>
            </span>

            <button
              onClick={handleSubmit}
              className="px-6 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors cursor-pointer flex items-center justify-center"
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
