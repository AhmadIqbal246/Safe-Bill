import React, { useState, useRef } from 'react';
import { X, Camera, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CameraCaptureModal from './CameraCaptureModal';

const QuoteUploadModal = ({ isOpen, onClose, onFileSelect }) => {
  const { t } = useTranslation();
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return;
      }
      onFileSelect(file);
      handleClose();
    }
  };

  const handleClose = () => {
    setShowCameraModal(false);
    onClose();
  };

  const handleModeSelect = (mode) => {
    if (mode === 'camera') {
      setShowCameraModal(true);
    } else if (mode === 'file') {
      fileInputRef.current?.click();
    }
  };

  const handleCameraCapture = (file) => {
    onFileSelect(file);
    setShowCameraModal(false);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg sm:rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-white border-opacity-20">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 border-opacity-30 sticky top-0 bg-white bg-opacity-90 backdrop-blur-lg z-10 rounded-t-lg">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            {t('project_creation.upload_quote_title')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center">
              {t('project_creation.select_upload_method')}
            </p>
            <button
              onClick={() => handleModeSelect('camera')}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 sm:py-3 border-2 border-gray-300 rounded-lg active:border-[#2E78A6] active:bg-[#F6FAFD] hover:border-[#2E78A6] hover:bg-[#F6FAFD] transition-colors cursor-pointer touch-manipulation"
            >
              <Camera className="w-6 h-6 sm:w-6 sm:h-6 text-[#2E78A6]" />
              <span className="font-medium text-sm sm:text-base text-gray-700">
                {t('project_creation.take_photo')}
              </span>
            </button>
            <button
              onClick={() => handleModeSelect('file')}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 sm:py-3 border-2 border-gray-300 rounded-lg active:border-[#2E78A6] active:bg-[#F6FAFD] hover:border-[#2E78A6] hover:bg-[#F6FAFD] transition-colors cursor-pointer touch-manipulation"
            >
              <Upload className="w-6 h-6 sm:w-6 sm:h-6 text-[#2E78A6]" />
              <span className="font-medium text-sm sm:text-base text-gray-700">
                {t('project_creation.upload_from_device')}
              </span>
            </button>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

export default QuoteUploadModal;

