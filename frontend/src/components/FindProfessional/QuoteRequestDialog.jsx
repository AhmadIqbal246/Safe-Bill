import React, { useState } from 'react';
import { X, Send, User, Mail } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QuoteRequestDialog = ({ isOpen, onClose, professional }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Get current user's email from session storage
  const getCurrentUserEmail = () => {
    try {
      const user = sessionStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.email || '';
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return '';
  };

  const currentUserEmail = getCurrentUserEmail();
  const professionalEmail = professional?.email || '';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.body.trim()) {
      setError(t('quote_request.fill_required_fields'));
      return;
    }

    if (!currentUserEmail) {
      setError(t('quote_request.unable_get_email'));
      return;
    }

    if (!professionalEmail) {
      setError(t('quote_request.unable_get_professional_email'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData = {
        from_email: currentUserEmail,
        to_email: professionalEmail,
        subject: formData.subject.trim(),
        body: formData.body.trim(),
        professional_id: professional.id
      };

      const response = await axios.post(
        `${BASE_URL}api/feedback/quote-request/`,
        requestData
      );

      if (response.status === 201) {
        setSuccess(true);
        setFormData({ subject: '', body: '' });
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error sending quote request:', err);
      setError(err.response?.data?.detail || t('quote_request.failed_send_request'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ subject: '', body: '' });
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{t('quote_request.title')}</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mx-4 mt-4">
            <div className="flex items-center text-green-800">
              <Send className="w-5 h-5 mr-2" />
              <span className="font-medium">{t('quote_request.success_title')}</span>
            </div>
            <p className="text-green-600 text-sm mt-1">
              {t('quote_request.success_message')}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-4 mt-4">
            <div className="flex items-center text-red-800">
              <X className="w-5 h-5 mr-2" />
              <span className="font-medium">{t('quote_request.error_title')}</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Email Information */}
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span className="font-medium">{t('quote_request.from_label')}</span>
              <span className="ml-2 text-gray-800">{currentUserEmail || t('quote_request.loading')}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2" />
              <span className="font-medium">{t('quote_request.to_label')}</span>
              <span className="ml-2 text-gray-800">{professionalEmail || t('quote_request.loading')}</span>
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              {t('quote_request.subject_label')}
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder={t('quote_request.subject_placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          {/* Body Field */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
              {t('quote_request.message_label')}
            </label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              placeholder={t('quote_request.message_placeholder')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent resize-none"
              required
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.subject.trim() || !formData.body.trim()}
              className="flex-1 px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('actions.sending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('actions.send_request')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteRequestDialog;
