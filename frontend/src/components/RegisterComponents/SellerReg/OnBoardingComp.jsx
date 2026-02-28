import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UploadCloud, X, CheckCircle } from "lucide-react";
import {
  uploadBusinessDocuments,
  resetBusinessDetailState,
} from "../../../store/slices/BussinessDetailSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  connectStripe,
  checkStripeStatus,
  createStripeIdentitySession,
  checkStripeIdentityStatus,
} from "../../../store/slices/ConnectStripe";
import { setUser } from "../../../store/slices/AuthSlices";

// const documents = [
//   { key: "kbis", labelKey: "onboarding.upload_kbis" },
//   {
//     key: "liability_certificate",
//     labelKey: "onboarding.upload_liability_certificate",
//   },
//   { key: "insurance_certificate", labelKey: "onboarding.upload_insurance_certificate" },
//   { key: "id_main_contact", labelKey: "onboarding.upload_id_main_contact" },
//   { key: "rib", labelKey: "onboarding.upload_rib" },
// ];

const requiredDocs = [
  { key: "kbis", labelKey: "onboarding.upload_kbis" },
  {
    key: "liability_certificate",
    labelKey: "onboarding.upload_liability_certificate",
  },
  {
    key: "insurance_certificate",
    labelKey: "onboarding.upload_insurance_certificate",
  },
  { key: "id_main_contact", labelKey: "onboarding.upload_id_main_contact" },
  { key: "rib", labelKey: "onboarding.upload_rib" },
];

export default function OnBoardingComp() {
  const { t } = useTranslation();
  const [files] = useState({});
  // const [bank] = useState({
  //   account_holder: "",
  //   iban: "",
  //   bank_code: "",
  //   branch_code: "",
  //   rib_key: "",
  //   bic: "",
  //   bank_name: "",
  //   bank_address: "",
  // });
  //const [subStep, setSubStep] = useState(1); // 1: documents, 2: bank details
  // const [errors] = useState({});

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Added error handling for user object
  if (!user) {
    return <div>Loading...</div>;
  }
  
  // Added: prefer role for onboarding branching; fallback to active_role
  const role = user?.role || user?.active_role;
  const proBuyerComplete = user?.pro_buyer_onboarding_complete === true;
  const sellerComplete = user?.seller_onboarding_complete === true;
  
  // Calculate the correct step based on current role and onboarding status
  const correctStep = useMemo(() => {
    try {
      if (!role) return 1;
      
      if (role === "seller" && sellerComplete) {
        return 3; // Show completion for sellers
      } else if (role === "professional-buyer" && proBuyerComplete) {
        return 3; // Show completion for pro buyers
      } else if (role === "seller" && !sellerComplete) {
        return 2; // Show Stripe Connect for sellers
      } else if (role === "professional-buyer" && !proBuyerComplete) {
        return 2; // Show Stripe Identity for pro buyers
      } else {
        return 1; // Default to step 1
      }
    } catch (error) {
      console.error('Error calculating correctStep:', error);
      return 1; // Fallback to step 1
    }
  }, [role, sellerComplete, proBuyerComplete]);

  // Use derived state instead of local state to prevent re-renders
  const currentStep = correctStep;

  // Debug logging for onboarding status (only when values change)
  useEffect(() => {
    console.log('OnBoardingComp Debug:', {
      role,
      sellerComplete,
      proBuyerComplete,
      currentStep,
      user: user ? {
        seller_onboarding_complete: user.seller_onboarding_complete,
        pro_buyer_onboarding_complete: user.pro_buyer_onboarding_complete
      } : null
    });
  }, [role, sellerComplete, proBuyerComplete, currentStep, user]);
  const { loading, error, success } = useSelector(
    (state) => state.businessDetail
  );
  const {
    loading: stripeLoading,
    error: stripeError,
    success: stripeSuccess,
    statusLoading: stripeStatusLoading,
    statusError: stripeStatusError,
    statusData: stripeStatusData,
    identityLoading: stripeIdentityLoading,
    identityError: stripeIdentityError,
    identitySuccess: stripeIdentitySuccess,
    identityStatusLoading: _stripeIdentityStatusLoading,
    identityStatusError: stripeIdentityStatusError,
    identityStatusData: stripeIdentityStatusData,
  } = useSelector(
    (state) =>
      state.stripe || {
        loading: false,
        error: null,
        success: null,
        statusLoading: false,
        statusError: null,
        statusData: null,
        identityLoading: false,
        identityError: null,
        identitySuccess: null,
        identityStatusLoading: false,
        identityStatusError: null,
        identityStatusData: null,
      }
  );

  const navigate = useNavigate();

  // Added: immediately redirect verified users away from onboarding
  useEffect(() => {
    if (role === "professional-buyer" && proBuyerComplete) {
      navigate("/");
    }
    if (role === "seller" && sellerComplete) {
      // Optional: redirect sellers with completed onboarding straight to dashboard
      // navigate("/seller-dashboard");
    }
  }, [role, proBuyerComplete, sellerComplete, navigate]);

  // No need for useEffect since we're using derived state

  const handleRoleBasedNavigation = useCallback(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if ((userObj.role || userObj.active_role) === "seller") {
          navigate("/seller-dashboard");
        } else if ((userObj.role || userObj.active_role) === "professional-buyer") {
          navigate("/");
        } else {
          // Default fallback
          navigate("/seller-dashboard");
        }
      } catch {
        // Fallback if user parsing fails
        navigate("/seller-dashboard");
      }
    } else {
      // Fallback if no user in session
      navigate("/seller-dashboard");
    }
  }, [navigate]);

  // const validateFileTypeAndSize = (key, file) => {
  //   const maxSize = 7 * 1024 * 1024; // 7 MB
  //   if (key === "id_main_contact") {
  //     // Allow both PDF and image files (JPG, PNG, TIFF) for ID
  //     const allowedTypes = [
  //       "application/pdf",
  //       "image/jpeg",
  //       "image/png",
  //       "image/tiff"
  //     ];
  //     if (!allowedTypes.includes(file.type)) {
  //       return t('onboarding.file_type_error_id');
  //     }
  //   } else {
  //     // Only allow PDF for other documents
  //     if (file.type !== "application/pdf") {
  //       return t('onboarding.file_type_error_pdf');
  //     }
  //   }
  //   if (file.size > maxSize) {
  //     return t('onboarding.file_size_error');
  //   }
  //   return null;
  // };

  // const handleFileChange = (key, file) => {
  //   const errorMsg = validateFileTypeAndSize(key, file);
  //   setErrors((prev) => ({ ...prev, [key]: errorMsg }));
  //   if (!errorMsg) {
  //     setFiles((prev) => ({ ...prev, [key]: file }));
  //   }
  // };
  // const handleRemoveFile = (key) =>
  //   setFiles((prev) => ({ ...prev, [key]: undefined }));
  // const handleBankChange = (e) =>
  //   setBank({ ...bank, [e.target.name]: e.target.value });

  const validateDocs = () => {
    const newErrors = {};
    requiredDocs.forEach((doc) => {
      if (!files[doc.key]) {
        newErrors[doc.key] = `${t(doc.labelKey)} is required`;
      }
    });
    // setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Placeholder for final continue handler
  // const handleFinalContinue = () => {
  //   // TODO: handle submit or move to next onboarding step
  //   // e.g., call API, show toast, etc.
  //   alert("Proceed to next onboarding step!");
  // };

  const fieldMap = {
    kbis: "kbis",
    liability_certificate: "pro_insurance",
    insurance_certificate: "insurance",
    id_main_contact: "id",
    rib: "rib",
  };

  const handleContinue = () => {
    // For sellers, check if Stripe Connect onboarding is complete before proceeding
    if (
      role === "seller" &&
      stripeStatusData &&
      !sellerComplete
    ) {
      return;
    }

    // For professional buyers, check if identity verification is complete
    if (
      role === "professional-buyer" &&
      stripeIdentityStatusData &&
      !stripeIdentityStatusData.identity_verified
    ) {
      return;
    }

    // For professional buyers, prevent proceeding if verification failed, was canceled, or requires input
    if (
      role === "professional-buyer" &&
      stripeIdentityStatusData &&
      (stripeIdentityStatusData.identity_status === "failed" ||
        stripeIdentityStatusData.identity_status === "canceled" ||
        stripeIdentityStatusData.identity_status === "requires_input")
    ) {
      return;
    }

    if (!validateDocs()) return;
    const formData = new FormData();
    Object.keys(fieldMap).forEach((frontKey) => {
      if (files[frontKey]) {
        formData.append(fieldMap[frontKey], files[frontKey]);
      }
    });
    const accessToken = sessionStorage.getItem("access");

    dispatch(uploadBusinessDocuments({ formData, accessToken }));
  };

  useEffect(() => {
    if (success) {
      // Reset business detail state after successful upload
      dispatch(resetBusinessDetailState());
      // Note: currentStep is now derived from role and onboarding status
      // No need to manually set it
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
  }, [error, t]);

  const steps = [
    { number: 1, title: "Basic Information", active: currentStep >= 1 },
    {
      number: 2,
      title: role === "seller" ? "Connect Stripe" : "Identity Verification",
      active: false,
    },
    { number: 3, title: "Verification", active: false },
  ];

  const handleStripeConnect = () => {
    const accessToken = sessionStorage.getItem("access");
    dispatch(connectStripe({ accessToken }));
  };

  const handleStripeIdentityVerification = () => {
    const accessToken = sessionStorage.getItem("access");
    dispatch(createStripeIdentitySession({ accessToken }));
  };

  // Handle Stripe Connect response
  useEffect(() => {
    if (stripeSuccess?.account_link) {
      window.location.href = stripeSuccess.account_link;
    }
    if (stripeError) {
      toast.error("Failed to connect with Stripe");
    }
  }, [stripeSuccess, stripeError]);

  // Handle Stripe Identity response
  useEffect(() => {
    if (stripeIdentitySuccess?.session_url) {
      // Redirect to Stripe Identity verification
      window.location.href = stripeIdentitySuccess.session_url;
    }
    if (stripeIdentityError) {
      toast.error("Failed to create identity verification session");
    }
  }, [stripeIdentitySuccess, stripeIdentityError]);

  // Check Stripe status when component mounts (after returning from Stripe)
  useEffect(() => {
    const checkStripeOnboardingStatus = () => {
      const accessToken = sessionStorage.getItem("access");
      if (accessToken) {
          if (role === "seller") {
          dispatch(checkStripeStatus({ accessToken }));
        } else if (role === "professional-buyer") {
          dispatch(checkStripeIdentityStatus({ accessToken }));
        }
      }
    };

    // Check if we're returning from Stripe onboarding or identity verification
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get("return_from_stripe") === "true" ||
      urlParams.get("return_from_stripe_identity") === "true" ||
      currentStep === 2
    ) {
      checkStripeOnboardingStatus();
    }
  }, [dispatch, currentStep, role]);

  // Fetch status immediately when component first mounts
  useEffect(() => {
    const fetchStatusOnMount = () => {
      const accessToken = sessionStorage.getItem("access");
      if (accessToken) {
          if (role === "seller") {
          dispatch(checkStripeStatus({ accessToken }));
        } else if (role === "professional-buyer") {
          dispatch(checkStripeIdentityStatus({ accessToken }));
        }
      }
    };

    // Fetch status immediately when component mounts
    fetchStatusOnMount();
  }, [dispatch, role]);

  // Handle Stripe status check response
  useEffect(() => {
    if (stripeStatusData) {
      console.log("Stripe Status Data:", stripeStatusData);
      console.log("Account Status:", stripeStatusData.account_status);
      console.log("Onboarding Complete:", stripeStatusData.onboarding_complete);

      // If backend reports completion, immediately merge into auth.user to refresh UI
      if (stripeStatusData.onboarding_complete === true || stripeStatusData.seller_onboarding_complete === true) {
        try {
          const currentUserStr = sessionStorage.getItem("user");
          const currentUser = currentUserStr ? JSON.parse(currentUserStr) : user;
          const mergedUser = {
            ...(currentUser || {}),
            seller_onboarding_complete: true,
          };
          dispatch(setUser(mergedUser));
        } catch (e) {
          // no-op if session storage parsing fails
        }
      }

      if (sellerComplete) {
        // Stripe onboarding is complete, step will be automatically set to 3
        // No need to manually set currentStep
      } else if (
        stripeStatusData.account_status &&
        stripeStatusData.account_status.toLowerCase() === "onboarding"
      ) {
        // User hasn't started Stripe onboarding yet, don't show any error messages
        // Just show the status display without error messages
        console.log("Status is onboarding - hiding status display");
      } else {
        // User has started onboarding but it's incomplete
        // No toast message needed since we display the status details in the UI
        console.log("Status is not onboarding - showing status display");
      }
    }

    if (stripeStatusError) {
      toast.error("Failed to check Stripe status");
    }
  }, [stripeStatusData, stripeStatusError]);

  // Handle Stripe Identity status check response
  useEffect(() => {
    if (stripeIdentityStatusData) {
      console.log("Stripe Identity Status Data:", stripeIdentityStatusData);
      console.log(
        "Identity Verified:",
        stripeIdentityStatusData.identity_verified
      );
      console.log(
        "Verification Status:",
        stripeIdentityStatusData.identity_status
      );

      // If backend reports identity verified, immediately merge into auth.user to refresh UI
      if (stripeIdentityStatusData.identity_verified === true || stripeIdentityStatusData.pro_buyer_onboarding_complete === true) {
        try {
          const currentUserStr = sessionStorage.getItem("user");
          const currentUser = currentUserStr ? JSON.parse(currentUserStr) : user;
          const mergedUser = {
            ...(currentUser || {}),
            pro_buyer_onboarding_complete: true,
          };
          dispatch(setUser(mergedUser));
        } catch (e) {
          // no-op if session storage parsing fails
        }
      }

      if (stripeIdentityStatusData.identity_verified) {
        // Identity verification is complete, step will be automatically set to 3
        // No need to manually set currentStep
      } else if (stripeIdentityStatusData.identity_status === "failed") {
        toast.error("Identity verification failed. Please try again.");
      } else if (stripeIdentityStatusData.identity_status === "canceled") {
        toast.error("Identity verification was canceled. Please try again.");
      } else if (
        stripeIdentityStatusData.identity_status === "requires_input"
      ) {
        toast.error("Additional information required. Please try again.");
      }
    }

    if (stripeIdentityStatusError) {
      toast.error("Failed to check identity verification status");
    }
  }, [stripeIdentityStatusData, stripeIdentityStatusError]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
      <div className="bg-[#FFFFFF] rounded-lg shadow-sm p-8 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111827] mb-2">
            {t("onboarding.title")}
          </h1>
          <p className="text-[#111827]">
            {currentStep === 2
              ? role === "seller"
                ? t(
                    "onboarding.description_stripe_connect",
                    "Connect your Stripe account to start receiving payments"
                  )
                : t(
                    "onboarding.description_identity_verification",
                    "Verify your identity to access all platform features"
                  )
              : currentStep === 3
              ? t("onboarding.description_verification")
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
            {steps.map((step) => (
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
                          : "bg-white border-2 border-[#01257D] text-[#01257D]"
                      }
                    `}
                >
                  {step.number}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold text-center ${
                    step.active ? "text-[#01257D]" : "text-[#01257D]"
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
        {/* SubStep 1: Connect Stripe */}
        {currentStep === 2 && (
          <>
            {/* <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map((doc) => (
                  <div key={doc.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t(doc.labelKey)} <span className="text-red-500">*</span>
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
                          {t(doc.labelKey)}
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
            </div> */}

            {/* Stripe Status Display - Only show if status is not "onboarding" */}
            {role === "seller" ? (
              <>
                {stripeStatusData &&
                  stripeStatusData.account_status &&
                  stripeStatusData.account_status !== "onboarding" &&
                  stripeStatusData.account_status.toLowerCase() !==
                    "onboarding" && (
                    <div className="mb-6">
                      <div
                        className={`border rounded-lg p-4 ${
                          sellerComplete
                            ? "border-green-200 bg-green-50"
                            : "border-yellow-200 bg-yellow-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4
                              className={`font-semibold ${
                                sellerComplete
                                  ? "text-green-800"
                                  : "text-yellow-800"
                              }`}
                            >
                              {sellerComplete
                                ? t(
                                    "onboarding.stripe_complete_title",
                                    "Stripe Setup Complete"
                                  )
                                : t(
                                    "onboarding.stripe_incomplete_title",
                                    "Stripe Setup Incomplete"
                                  )}
                            </h4>
                            <p
                              className={`text-sm mt-1 ${
                                sellerComplete
                                  ? "text-green-700"
                                  : "text-yellow-700"
                              }`}
                            >
                              {sellerComplete
                                ? "Your Stripe account is ready to receive payments"
                                : t(
                                    "onboarding.stripe_incomplete_default",
                                    "Your Stripe account setup is not yet complete."
                                  )}
                            </p>
                            {!sellerComplete && (
                              <div className="mt-2 text-sm text-yellow-700">
                                <p className="font-medium">
                                  Missing requirements:
                                </p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {!stripeStatusData.details_submitted && (
                                    <li>Account details not submitted</li>
                                  )}
                                  {!stripeStatusData.charges_enabled && (
                                    <li>Charges not enabled</li>
                                  )}
                                  {!stripeStatusData.payouts_enabled && (
                                    <li>Payouts not enabled</li>
                                  )}
                                  {stripeStatusData.currently_due &&
                                    stripeStatusData.currently_due.length >
                                      0 && (
                                      <li>
                                        <span className="font-medium">
                                          Currently due:
                                        </span>{" "}
                                        {stripeStatusData.currently_due.join(
                                          ", "
                                        )}
                                      </li>
                                    )}
                                  {stripeStatusData.past_due &&
                                    stripeStatusData.past_due.length > 0 && (
                                      <li>
                                        <span className="font-medium">
                                          Past due:
                                        </span>{" "}
                                        {stripeStatusData.past_due.join(", ")}
                                      </li>
                                    )}
                                  {stripeStatusData.eventually_due &&
                                    stripeStatusData.eventually_due.length >
                                      0 && (
                                      <li>
                                        <span className="font-medium">
                                          Eventually due:
                                        </span>{" "}
                                        {stripeStatusData.eventually_due.join(
                                          ", "
                                        )}
                                      </li>
                                    )}
                                </ul>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const accessToken =
                                sessionStorage.getItem("access");
                              dispatch(checkStripeStatus({ accessToken }));
                            }}
                            disabled={stripeStatusLoading}
                            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            {stripeStatusLoading
                              ? t("onboarding.checking", "Checking...")
                              : t(
                                  "onboarding.refresh_status",
                                  "Refresh Status"
                                )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <></>
            )}

            {/* Conditional Content Based on User Role */}
            {role === "seller" ? (
              /* Stripe Connect Section for Sellers */
              <div className="mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-[#01257D] mb-2">
                      {t(
                        "onboarding.stripe_connect_title",
                        "Connect Your Stripe Account"
                      )}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {t(
                        "onboarding.stripe_connect_description",
                        "Connect your Stripe account to start receiving payments securely."
                      )}
                    </p>
                  </div>

                  {/* Stripe Benefits */}
                  <div className="bg-[#E6F0FA] rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-[#01257D] mb-3 text-center">
                      {t(
                        "onboarding.stripe_benefits_title",
                        "Why Connect with Stripe?"
                      )}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#01257D] rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">
                          {t(
                            "onboarding.secure_payments",
                            "Bank-level security for all transactions"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#01257D] rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">
                          {t(
                            "onboarding.fast_settlements",
                            "Get paid within 2 business days"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#01257D] rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">
                          {t(
                            "onboarding.global_reach",
                            "Accept payments from 40+ countries"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#01257D] rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">
                          {t(
                            "onboarding.easy_integration",
                            "Easy integration with your business"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stripe Connect Button */}
                  <div className="text-center">
                    <button
                      className={`bg-[#01257D] cursor-pointer text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#2346a0] transition-colors flex items-center gap-2 mx-auto ${
                        stripeLoading ? "opacity-80" : ""
                      }`}
                      onClick={handleStripeConnect}
                      disabled={stripeLoading}
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.274 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.407-2.354 1.407-1.852 0-4.963-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                      </svg>
                      {stripeLoading
                        ? t("onboarding.connecting", "Connecting...")
                        : t("onboarding.connect_stripe", "Connect with Stripe")}
                    </button>
                    <p className="text-xs text-gray-500 mt-3">
                      {t(
                        "onboarding.stripe_connect_note",
                        "You will be redirected to Stripe to complete the setup process"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Stripe Identity Verification Section for Professional Buyers */
              <div className="mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-[#01257D] mb-2">
                      {t(
                        "onboarding.stripe_identity_title",
                        "Verify Your Identity"
                      )}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {t(
                        "onboarding.stripe_identity_description",
                        "Complete identity verification to access all platform features securely."
                      )}
                    </p>
                  </div>

                  {/* Identity Verification Benefits */}
                  <div className="bg-[#E6F0FA] rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-[#01257D] mb-3 text-center">
                      {t(
                        "onboarding.identity_benefits_title",
                        "Why Verify Your Identity?"
                      )}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#01257D] rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">
                          {t(
                            "onboarding.secure_platform",
                            "Enhanced security for your account"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#01257D] rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">
                          {t(
                            "onboarding.full_access",
                            "Access to all professional features"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#01257D] rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">
                          {t(
                            "onboarding.trusted_verification",
                            "Trusted verification process"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#01257D] rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">
                          {t(
                            "onboarding.compliance",
                            "Meet regulatory compliance requirements"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Identity Verification Button */}
                  <div className="text-center">
                    {/* Show status message if verification failed, was canceled, or requires input (treat as failed) */}
                    {stripeIdentityStatusData &&
                      (stripeIdentityStatusData.identity_status === "failed" ||
                        stripeIdentityStatusData.identity_status ===
                          "canceled" ||
                        stripeIdentityStatusData.identity_status ===
                          "requires_input") && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 text-sm">
                            {stripeIdentityStatusData.identity_status ===
                            "canceled"
                              ? t(
                                  "onboarding.verification_canceled",
                                  "Identity verification was canceled. Please try again."
                                )
                              : t(
                                  "onboarding.verification_failed",
                                  "Identity verification failed. Please try again."
                                )}
                          </p>
                        </div>
                      )}

                    {/* Show processing message if verification is in progress */}
                    {stripeIdentityStatusData &&
                      stripeIdentityStatusData.identity_status ===
                        "processing" && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-blue-700 text-sm">
                            {t(
                              "onboarding.verification_processing",
                              "Your identity verification is being processed. Please wait..."
                            )}
                          </p>
                        </div>
                      )}

                    {/* Note: requires_input handled above as failure */}

                    <button
                      className={`${
                        stripeIdentityStatusData &&
                        (stripeIdentityStatusData.identity_status ===
                          "failed" ||
                          stripeIdentityStatusData.identity_status ===
                            "canceled" ||
                          stripeIdentityStatusData.identity_status ===
                            "requires_input")
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-[#01257D] hover:bg-[#2346a0]"
                      } cursor-pointer text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto ${
                        stripeIdentityLoading ? "opacity-80" : ""
                      }`}
                      onClick={handleStripeIdentityVerification}
                      disabled={stripeIdentityLoading}
                    >
                      {stripeIdentityStatusData &&
                      stripeIdentityStatusData.identity_status ===
                        "processing" ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      )}
                      {stripeIdentityLoading
                        ? t(
                            "onboarding.creating_session",
                            "Creating Session..."
                          )
                        : stripeIdentityStatusData &&
                          (stripeIdentityStatusData.identity_status ===
                            "failed" ||
                            stripeIdentityStatusData.identity_status ===
                              "canceled" ||
                            stripeIdentityStatusData.identity_status ===
                              "requires_input")
                        ? t("onboarding.try_again", "Try Again")
                        : stripeIdentityStatusData &&
                          stripeIdentityStatusData.identity_status ===
                            "processing"
                        ? t("onboarding.processing", "Processing...")
                        : t(
                            "onboarding.start_verification",
                            "Start Verification"
                          )}
                    </button>
                    <p className="text-xs text-gray-500 mt-3">
                      {stripeIdentityStatusData &&
                      stripeIdentityStatusData.identity_status === "processing"
                        ? t(
                            "onboarding.processing_note",
                            "Please wait while we process your verification"
                          )
                        : stripeIdentityStatusData &&
                          stripeIdentityStatusData.identity_status === "not_started"
                        ? t(
                            "onboarding.identity_not_started_note",
                            "Your identity verification has not started. Click the button above to begin."
                          )
                        : t(
                            "onboarding.identity_verification_note",
                            "Click to start identity verification with Stripe"
                          )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors bg-[#E6F0FA] text-[#01257D] opacity-60 cursor-not-allowed`}
                disabled
              >
                Previous
              </button>
              <button
                className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer bg-[#01257D] text-white hover:bg-[#2346a0] ${
                  loading ||
                  (role === "seller" &&
                    stripeStatusData &&
                    !sellerComplete) ||
                  (role === "professional-buyer" &&
                    stripeIdentityStatusData &&
                    !stripeIdentityStatusData.identity_verified) ||
                  (role === "professional-buyer" &&
                    stripeIdentityStatusData &&
                    (stripeIdentityStatusData.identity_status === "failed" ||
                      stripeIdentityStatusData.identity_status === "canceled" ||
                      stripeIdentityStatusData.identity_status ===
                        "requires_input"))
                    ? "opacity-80"
                    : ""
                }`}
                onClick={handleContinue}
                disabled={
                  loading ||
                  (role === "seller" &&
                    stripeStatusData &&
                    !sellerComplete) ||
                  (role === "professional-buyer" &&
                    stripeIdentityStatusData &&
                    !stripeIdentityStatusData.identity_verified) ||
                  (role === "professional-buyer" &&
                    stripeIdentityStatusData &&
                    (stripeIdentityStatusData.identity_status === "failed" ||
                      stripeIdentityStatusData.identity_status === "canceled" ||
                      stripeIdentityStatusData.identity_status ===
                        "requires_input"))
                }
              >
                {loading ? t("onboarding.uploading") : t("onboarding.continue")}
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
              {typeof success === "string"
                ? success
                : success?.detail || t("onboarding.verification_success")}
            </h2>
            <p className="text-[#6B7280] mb-8 text-center">
              {(() => {
                const userStr = sessionStorage.getItem("user");
                if (userStr) {
                  try {
                    const userObj = JSON.parse(userStr);
                    if ((userObj.role || userObj.active_role) === "seller") {
                      return t("onboarding.go_to_dashboard_seller");
                    } else if ((userObj.role || userObj.active_role) === "professional-buyer") {
                      return t("onboarding.go_to_home_professional_buyer");
                    }
                  } catch {
                    // Ignore parsing errors
                  }
                }
                return t("onboarding.go_to_dashboard_default");
              })()}
            </p>
            <button
              className="px-8 py-2 bg-[#01257D] text-white font-semibold rounded-md text-base hover:bg-[#2346a0] transition-colors cursor-pointer"
              onClick={handleRoleBasedNavigation}
            >
              {(() => {
                const userStr = sessionStorage.getItem("user");
                if (userStr) {
                  try {
                    const userObj = JSON.parse(userStr);
                    if ((userObj.role || userObj.active_role) === "seller") {
                      return t("onboarding.go_to_dashboard");
                    } else if ((userObj.role || userObj.active_role) === "professional-buyer") {
                      return t("onboarding.go_to_home");
                    }
                  } catch {
                    // Ignore parsing errors
                  }
                }
                return t("onboarding.go_to_dashboard");
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
