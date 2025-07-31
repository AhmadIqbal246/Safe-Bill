import React, { useState, useEffect } from "react";
import { UploadCloud, X, CheckCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  uploadBusinessDocuments,
  resetBusinessDetailState,
} from "../../../store/slices/BussinessDetailSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const documents = [
  { key: "kbis", label: "Upload KBIS" },
  {
    key: "liability_certificate",
    label: "Upload Liability Insurance Certificate",
  },
  { key: "insurance_certificate", label: "Upload Insurance Certificate" },
  { key: "id_main_contact", label: "Upload ID of Main Contact" },
  { key: "rib", label: "Upload Company Bank Details (RIB)" },
];

const requiredDocs = [
  { key: "kbis", label: "KBIS" },
  { key: "liability_certificate", label: "Liability Insurance Certificate" },
  { key: "insurance_certificate", label: "Insurance Certificate" },
  { key: "id_main_contact", label: "ID of Main Contact" },
  { key: "rib", label: "Company Bank Details (RIB)" },
];

export default function OnBoardingComp() {
  const [currentStep, setCurrentStep] = useState(2);
  const [files, setFiles] = useState({});
  const [bank, setBank] = useState({
    account_holder: "",
    iban: "",
    bank_code: "",
    branch_code: "",
    rib_key: "",
    bic: "",
    bank_name: "",
    bank_address: "",
  });
  //const [subStep, setSubStep] = useState(1); // 1: documents, 2: bank details
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(
    (state) => state.businessDetail
  );

  const navigate = useNavigate();

  const handleRoleBasedNavigation = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj.role === 'seller') {
          navigate('/dashboard');
        } else if (userObj.role === 'professional-buyer') {
          navigate('/');
        } else {
          // Default fallback
          navigate('/dashboard');
        }
      } catch (e) {
        // Fallback if user parsing fails
        navigate('/dashboard');
      }
    } else {
      // Fallback if no user in session
      navigate('/dashboard');
    }
  };

  const validateFileTypeAndSize = (key, file) => {
    const maxSize = 7 * 1024 * 1024; // 7 MB
    if (key === "id_main_contact") {
      // Allow both PDF and image files (JPG, PNG, TIFF) for ID
      const allowedTypes = [
        "application/pdf",
        "image/jpeg", 
        "image/png", 
        "image/tiff"
      ];
      if (!allowedTypes.includes(file.type)) {
        return "Only PDF, JPG, PNG, or TIFF files are allowed for ID.";
      }
    } else {
      // Only allow PDF for other documents
      if (file.type !== "application/pdf") {
        return "Only PDF files are allowed for this document.";
      }
    }
    if (file.size > maxSize) {
      return "File size must be under 7 MB.";
    }
    return null;
  };

  const handleFileChange = (key, file) => {
    const errorMsg = validateFileTypeAndSize(key, file);
    setErrors((prev) => ({ ...prev, [key]: errorMsg }));
    if (!errorMsg) {
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };
  const handleRemoveFile = (key) =>
    setFiles((prev) => ({ ...prev, [key]: undefined }));
  const handleBankChange = (e) =>
    setBank({ ...bank, [e.target.name]: e.target.value });

  const validateDocs = () => {
    const newErrors = {};
    requiredDocs.forEach((doc) => {
      if (!files[doc.key]) {
        newErrors[doc.key] = `${doc.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Placeholder for final continue handler
  const handleFinalContinue = () => {
    // TODO: handle submit or move to next onboarding step
    // e.g., call API, show toast, etc.
    alert("Proceed to next onboarding step!");
  };

  const fieldMap = {
    kbis: "kbis",
    liability_certificate: "pro_insurance",
    insurance_certificate: "insurance",
    id_main_contact: "id",
    rib: "rib",
  };

  const handleContinue = () => {
    if (!validateDocs()) return;
    const formData = new FormData();
    Object.keys(fieldMap).forEach((frontKey) => {
      if (files[frontKey]) {
        formData.append(fieldMap[frontKey], files[frontKey]);
      }
    });
    const accessToken = sessionStorage.getItem("access");
    console.log("TOKEN", accessToken);

    dispatch(uploadBusinessDocuments({ formData, accessToken }));
  };

  useEffect(() => {
    if (success) {
      setCurrentStep(3); // Go to verification step
      dispatch(resetBusinessDetailState());
      // Update onboarding_complete in sessionStorage user
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          userObj.onboarding_complete = true;
          sessionStorage.setItem('user', JSON.stringify(userObj));
        } catch (e) {}
      }
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.detail || "An error occurred while uploading documents."
      );
    }
  }, [error]);

  const steps = [
    { number: 1, title: "Basic Information", active: currentStep >= 1 },
    { number: 2, title: "Documents", active: false },
    { number: 3, title: "Verification", active: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
      <div className="bg-[#FFFFFF] rounded-lg shadow-sm p-8 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111827] mb-2">
            Complete Your Registration
          </h1>
          <p className="text-[#111827]">
            {currentStep === 2
              ? "Please upload the required documents to finish your registration."
              : currentStep === 3
              ? "Documents uploaded successfully. Go to Dashboard to start using the platform."
              : ""}
          </p>
        </div>
        {/* Progress Steps */}
        {/* <div className="relative mb-8">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-[#96C2DB] rounded-full transform -translate-y-1/2" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-[#01257D] rounded-full transition-all duration-300"
            style={{
              width: `${((3 - 1) / (5 - 1)) * 100}%`,
              maxWidth: "100%",
              transform: "translateY(-50%)",
            }}
          />
          <div className="relative flex justify-between">
            {["Basic Information", "Documents", "Verification"].map(
              (title, idx) => (
                <div key={title} className="flex flex-col items-center w-1/5">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium z-10
                      ${idx + 1 === 3
                        ? "bg-[#01257D] text-white"
                        : idx + 1 < 3
                        ? "bg-[#FFFFFF] border-2 border-[#01257D] text-[#01257D]"
                        : "bg-[#96C2DB] text-white"
                      }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      idx + 1 <= 3 ? "text-[#01257D]" : "text-[#96C2DB]"
                    }`}
                  >
                    {title}
                  </span>
                </div>
              )
            )}
          </div>
        </div> */}
                  {/* Progress Steps */}
                  <div className="mb-8">
            {/* Step circles row */}
            <div className="flex justify-between mb-2 relative z-10">
              {steps.map((step, idx) => (
                <div key={step.number} className="flex flex-col items-center w-1/3">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-base font-bold transition-all duration-200
                      ${currentStep === step.number
                        ? 'bg-[#01257D] text-white shadow-lg'
                        : step.active
                        ? 'bg-white border-2 border-[#01257D] text-[#01257D]'
                        : 'bg-white border-2 border-[#01257D] text-[#01257D]'}
                    `}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold text-center ${
                      step.active ? 'text-[#01257D]' : 'text-[#01257D]'
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
                  maxWidth: '100%',
                }}
              />
            </div>
          </div>
        {/* SubStep 1: Document Uploads */}
        {currentStep === 2 && (
          <>
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map((doc) => (
                  <div key={doc.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {doc.label} <span className="text-red-500">*</span>
                    </label>
                    <label
                      className="flex flex-col items-center justify-center border-2 border-gray-200 rounded-lg h-40 cursor-pointer hover:border-black transition-colors relative"
                      style={{ minHeight: "150px" }}
                    >
                      <UploadCloud className="w-10 h-10 text-gray-300 mb-2" />
                      {files[doc.key] ? (
                        <div className="flex flex-col items-center">
                          <span className="text-gray-700 text-base truncate max-w-[180px]">
                            {files[doc.key].name}
                          </span>
                          <button
                            type="button"
                            className="mt-2 text-gray-400 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(doc.key);
                            }}
                            tabIndex={-1}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-base">
                          {doc.label}
                        </span>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleFileChange(doc.key, e.target.files[0])
                        }
                        tabIndex={-1}
                      />
                    </label>
                    {errors[doc.key] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[doc.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer bg-[#E6F0FA] text-[#01257D] opacity-60 cursor-not-allowed`}
                disabled
              >
                Previous
              </button>
              <button
                className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer bg-[#01257D] text-white hover:bg-[#2346a0] ${loading ? 'opacity-80' : ''}`}
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? "Uploading..." : "Continue"}
              </button>
            </div>
          </>
        )}
        {/* SubStep 3: Verification Success */}
        {currentStep === 3 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#01257D]">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-[#111827] mb-2 text-center">
              {typeof success === 'string'
                ? success
                : success?.detail || 'We have got details successfully for Verification'}
            </h2>
            <p className="text-[#6B7280] mb-8 text-center">
              {(() => {
                const userStr = sessionStorage.getItem('user');
                if (userStr) {
                  try {
                    const userObj = JSON.parse(userStr);
                    if (userObj.role === 'seller') {
                      return 'Go to your dashboard now to start receiving leads and growing your business';
                    } else if (userObj.role === 'professional-buyer') {
                      return 'Your registration is complete! You can now start using the platform';
                    }
                  } catch (e) {}
                }
                return 'Log in to your dashboard now to start';
              })()}
            </p>
            <button
              className="px-8 py-2 bg-[#01257D] text-white font-semibold rounded-md text-base hover:bg-[#2346a0] transition-colors cursor-pointer"
              onClick={handleRoleBasedNavigation}
            >
              {(() => {
                const userStr = sessionStorage.getItem('user');
                if (userStr) {
                  try {
                    const userObj = JSON.parse(userStr);
                    if (userObj.role === 'seller') {
                      return 'Go to Dashboard';
                    } else if (userObj.role === 'professional-buyer') {
                      return 'Go to Home';
                    }
                  } catch (e) {}
                }
                return 'Go to Dashboard';
              })()}
            </button>
          </div>
        )}
        {/* <div className="flex justify-between mt-8">
          <button
            className="px-6 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer text-[#96C2DB] bg-[#F0F4F8]"
            onClick={() => setSubStep(1)}
          >
            Previous
          </button>
          <button
            className="px-6 py-2 text-sm font-medium text-[#01257D] bg-[#00FFFF] hover:bg-[#96C2DB] rounded-md transition-colors cursor-pointer"
            onClick={handleFinalContinue}
          >
            Continue
          </button>
        </div> */}
      </div>
    </div>
  );
}
