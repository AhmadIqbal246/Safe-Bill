import React, { useState } from "react";
import { UploadCloud, X } from "lucide-react";

const documents = [
  { key: "kbis", label: "Upload KBIS" },
  { key: "liability_certificate", label: "Upload Liability Insurance Certificate" },
  { key: "insurance_certificate", label: "Upload Insurance Certificate" },
  { key: "id_main_contact", label: "Upload ID of Main Contact" },
  { key: "rib", label: "Upload Company Bank Details (RIB)" },
];

export default function OnBoardingComp() {
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
  const [subStep, setSubStep] = useState(1); // 1: documents, 2: bank details

  const handleFileChange = (key, file) => setFiles((prev) => ({ ...prev, [key]: file }));
  const handleRemoveFile = (key) => setFiles((prev) => ({ ...prev, [key]: undefined }));
  const handleBankChange = (e) => setBank({ ...bank, [e.target.name]: e.target.value });

  // Placeholder for final continue handler
  const handleFinalContinue = () => {
    // TODO: handle submit or move to next onboarding step
    // e.g., call API, show toast, etc.
    alert("Proceed to next onboarding step!");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Complete Your Onboarding
          </h1>
          <p className="text-gray-600">
            {subStep === 1
              ? "Please upload the required documents to finish your registration."
              : "Please provide your bank details to finish your registration."}
          </p>
        </div>
        {/* Progress Steps */}
        <div className="relative mb-8">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 rounded-full transform -translate-y-1/2" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-black rounded-full transition-all duration-300"
            style={{
              width: `${((3 - 1) / (5 - 1)) * 100}%`,
              maxWidth: "100%",
              transform: "translateY(-50%)",
            }}
          />
          <div className="relative flex justify-between">
            {["Basic Information", "Business Details", "Documents", "Preferences", "Verification"].map((title, idx) => (
              <div key={title} className="flex flex-col items-center w-1/5">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium z-10
                    ${idx + 1 === 3
                      ? "bg-black text-white"
                      : idx + 1 < 3
                      ? "bg-white border-2 border-black text-black"
                      : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center ${
                    idx + 1 <= 3 ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SubStep 1: Document Uploads */}
        {subStep === 1 && (
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
                            onClick={e => {
                              e.stopPropagation();
                              handleRemoveFile(doc.key);
                            }}
                            tabIndex={-1}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-base">{doc.label}</span>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        onChange={e => handleFileChange(doc.key, e.target.files[0])}
                        tabIndex={-1}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                className="px-6 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer text-gray-400 bg-gray-100"
                disabled
              >
                Previous
              </button>
              <button
                className="px-6 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                onClick={() => setSubStep(2)}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* SubStep 2: Bank Details */}
        {subStep === 2 && (
          <>
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account holder name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="account_holder"
                  value={bank.account_holder}
                  onChange={handleBankChange}
                  placeholder="Enter the Name"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-gray-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  name="iban"
                  value={bank.iban}
                  onChange={handleBankChange}
                  placeholder="IBAN"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-gray-300"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bank_code"
                    value={bank.bank_code}
                    onChange={handleBankChange}
                    placeholder="Bank Code"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="branch_code"
                    value={bank.branch_code}
                    onChange={handleBankChange}
                    placeholder="Branch Code"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RIB key (Clé RIB) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="rib_key"
                    value={bank.rib_key}
                    onChange={handleBankChange}
                    placeholder="Bank Code"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    BIC/SWIFT <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bic"
                    value={bank.bic}
                    onChange={handleBankChange}
                    placeholder="Branch Code"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    value={bank.bank_name}
                    onChange={handleBankChange}
                    placeholder="Bank Code"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bank_address"
                    value={bank.bank_address}
                    onChange={handleBankChange}
                    placeholder="Branch Code"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-gray-300"
                  />
                </div>
              </div>
            </div>
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                className="px-6 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setSubStep(1)}
              >
                Previous
              </button>
              <button
                className="px-6 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                onClick={handleFinalContinue}
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
