import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CameraCaptureModal = ({ isOpen, onClose, onCapture }) => {
  const { t } = useTranslation();
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      // Stop stream when modal closes
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setCapturedImage(null);
      setError('');
    }
  }, [isOpen]);

  // Restart video when capturedImage is cleared (retake)
  useEffect(() => {
    if (!capturedImage && videoRef.current && stream) {
      // Reconnect and play video when retaking
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      // Ensure video element is playing
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
        });
      }
    }
  }, [capturedImage, stream]);

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(t('project_creation.camera_access_error'));
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video directly without flipping for accurate document capture
      // The video preview is flipped for user experience, but the captured image should be correct
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `quote_${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          setCapturedImage(file);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    // Force video element to reconnect to stream
    if (videoRef.current && stream) {
      // Reconnect the video element to the stream
      videoRef.current.srcObject = null;
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Error playing video after retake:', err);
          });
        }
      }, 100);
    } else if (!stream) {
      // Restart camera if stream was stopped
      startCamera();
    }
  };

  const usePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg sm:rounded-lg shadow-xl w-full max-w-2xl sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-white border-opacity-20 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 border-opacity-30 bg-white bg-opacity-90 backdrop-blur-lg z-10 rounded-t-lg flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            {t('project_creation.capture_photo')}
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
        <div className="p-3 sm:p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            )}

            {!capturedImage ? (
              // Camera preview
              <div className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden flex-1 min-h-0 -mx-3 sm:-mx-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 px-4 py-3 sm:py-2 bg-[#2E78A6] text-white rounded-lg font-medium active:bg-[#256a94] hover:bg-[#256a94] transition-colors cursor-pointer text-sm sm:text-base touch-manipulation"
                  >
                    {t('project_creation.capture_photo')}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg active:bg-gray-50 hover:bg-gray-50 transition-colors cursor-pointer text-sm sm:text-base touch-manipulation"
                  >
                    {t('actions.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              // Captured image preview
              <div className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 -mx-3 sm:-mx-4 flex items-center justify-center">
                  <img
                    src={URL.createObjectURL(capturedImage)}
                    alt="Captured"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg active:bg-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('project_creation.retake')}
                  </button>
                  <button
                    onClick={usePhoto}
                    className="flex-1 px-4 py-3 sm:py-2 bg-[#2E78A6] text-white rounded-lg font-medium active:bg-[#256a94] hover:bg-[#256a94] transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                  >
                    <Check className="w-4 h-4" />
                    {t('project_creation.use_photo')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureModal;

