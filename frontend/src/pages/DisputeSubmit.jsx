import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAvailableProjects, createDispute, clearDisputeErrors } from '../store/slices/DisputeSlice';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import Footer from '../components/mutualComponents/Footer';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import LoginBg from '../assets/Circle Background/login-removed-bg.jpg';

export default function DisputeSubmit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const fileInputRef = useRef();

  // Get pre-selected project from navigation state
  const preselectedProject = location.state?.project;

  // Form state
  const [formData, setFormData] = useState({
    project: preselectedProject?.id || '',
    dispute_type: '',
    title: '',
    description: '',
  });
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});

  // Character limits
  const TITLE_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 1000;

  // Redux state
  const {
    availableProjects,
    availableProjectsLoading,
    availableProjectsError,
    createDisputeLoading,
    createDisputeError
  } = useSelector(state => state.dispute);

  // Dispute type options
  const disputeTypes = [
    { value: 'payment_issue', label: t('dispute_submit.payment_issue') },
    { value: 'quality_issue', label: t('dispute_submit.quality_issue') },
    { value: 'delivery_delay', label: t('dispute_submit.delivery_delay') },
    { value: 'communication_issue', label: t('dispute_submit.communication_issue') },
    { value: 'scope_creep', label: t('dispute_submit.scope_creep') },
    { value: 'other', label: t('dispute_submit.other') },
  ];

  useEffect(() => {
    dispatch(fetchAvailableProjects());
    dispatch(clearDisputeErrors());
  }, [dispatch]);

  useEffect(() => {
    if (createDisputeError) {
      toast.error(createDisputeError);
    }
  }, [createDisputeError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.project) {
      newErrors.project = t('dispute_submit.please_select_project');
    }
    if (!formData.dispute_type) {
      newErrors.dispute_type = t('dispute_submit.please_select_dispute_type');
    }
    if (!formData.title.trim()) {
      newErrors.title = t('dispute_submit.please_enter_title');
    } else if (formData.title.length > TITLE_MAX_LENGTH) {
      newErrors.title = t('dispute_submit.title_max_length');
    }
    if (!formData.description.trim()) {
      newErrors.description = t('dispute_submit.please_provide_description');
    } else if (formData.description.length > DESCRIPTION_MAX_LENGTH) {
      newErrors.description = t('dispute_submit.description_max_length');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const disputeData = {
        ...formData,
        documents
      };

      const result = await dispatch(createDispute(disputeData)).unwrap();
      
      toast.success(t('dispute_submit.dispute_submitted_successfully'));
      
      // Reset form fields instead of navigating
      setFormData({
        project: preselectedProject?.id || '',
        dispute_type: '',
        title: '',
        description: '',
      });
      setDocuments([]);
      setErrors({});
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Failed to create dispute:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (availableProjectsLoading) {
    return (
      <>
        <SafeBillHeader />
        <div className="relative min-h-screen flex items-center justify-center">
          {/* Full-page background layer */}
          <div
            className="absolute inset-0 -z-10 bg-center md:bg-top bg-no-repeat bg-cover"
            style={{ backgroundImage: `url(${LoginBg})` }}
          />
          <div className="text-center relative z-10">
            <div className="text-lg text-gray-500">{t('dispute_submit.loading_projects')}</div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SafeBillHeader />
      <div className="relative min-h-screen p-4">
        {/* Full-page background layer */}
        <div
          className="absolute inset-0 -z-10 bg-center md:bg-top bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${LoginBg})` }}
        />
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            {t('dispute_submit.back')}
          </button>

          {/* Form Container */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-2xl font-bold text-[#2E78A6] mb-8">{t('dispute_submit.title')}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dispute_submit.select_project')}
                </label>
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] transition-colors ${
                    errors.project ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{t('dispute_submit.select_project_placeholder')}</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.reference_number}
                    </option>
                  ))}
                </select>
                {errors.project && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.project}
                  </p>
                )}
              </div>

              {/* Nature of Dispute */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dispute_submit.nature_of_dispute')}
                </label>
                <select
                  name="dispute_type"
                  value={formData.dispute_type}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] transition-colors ${
                    errors.dispute_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{t('dispute_submit.nature_of_dispute_placeholder')}</option>
                  {disputeTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.dispute_type && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.dispute_type}
                  </p>
                )}
              </div>

              {/* Dispute Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dispute_submit.dispute_title')}
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t('dispute_submit.dispute_title_placeholder')}
                  maxLength={TITLE_MAX_LENGTH}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] transition-colors ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="flex justify-between items-center mt-1">
                  <div>
                    {errors.title && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.title}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs ${
                    formData.title.length > TITLE_MAX_LENGTH * 0.9 ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {formData.title.length}/{TITLE_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dispute_submit.description')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  placeholder={t('dispute_submit.description_placeholder')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] transition-colors resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="flex justify-between items-center mt-1">
                  <div>
                    {errors.description && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.description}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs ${
                    formData.description.length > DESCRIPTION_MAX_LENGTH * 0.9 ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dispute_submit.upload_supporting_documents')}
                </label>
                
                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#01257D] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-1">{t('dispute_submit.click_to_upload')}</p>
                  <p className="text-sm text-gray-500">{t('dispute_submit.file_types')}</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* File List */}
                {documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">{t('dispute_submit.selected_files')}:</h4>
                    {documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={createDisputeLoading}
                  className="w-full px-6 py-3 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {createDisputeLoading ? t('dispute_submit.submitting') : t('dispute_submit.submit_dispute')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
