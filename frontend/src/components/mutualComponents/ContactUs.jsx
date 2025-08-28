import React, { useState, useEffect } from 'react';
import SafeBillHeader from './Navbar/Navbar';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { submitContactMessage, resetFeedbackState } from '../../store/slices/FeedbackSlices';

export default function ContactUs() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.feedback || {});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('contact_us.name_required');
    if (!formData.email.trim()) {
      newErrors.email = t('contact_us.email_required');
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = t('contact_us.invalid_email');
    }
    if (!formData.subject.trim()) newErrors.subject = t('contact_us.subject_required');
    if (!formData.message.trim()) newErrors.message = t('contact_us.message_required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    dispatch(submitContactMessage({
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
    }));
  };

  useEffect(() => {
    if (success) {
      toast.success(t('contact_us.message_sent_success'));
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
      dispatch(resetFeedbackState());
    } else if (error) {
      toast.error(typeof error === 'string' ? error : t('contact_us.message_sent_error'));
      dispatch(resetFeedbackState());
    }
  }, [success, error, dispatch, t]);

  return (
    <div className="flex flex-col min-h-screen">
      <SafeBillHeader />
      <div className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#111827] sm:text-5xl sm:tracking-tight lg:text-6xl">
              {t('contact_us.title')}
            </h2>
            <p className="mt-5 text-xl text-gray-500">
              {t('contact_us.subtitle')}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('contact_us.contact_info_heading')}</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Mail className="flex-shrink-0 w-6 h-6 text-[#01257D]" />
                  <div className="text-sm sm:text-base text-gray-700">
                    <p className="font-medium">{t('contact_us.email_label')}</p>
                    <p>Dummyemail@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="flex-shrink-0 w-6 h-6 text-[#01257D]" />
                  <div className="text-sm sm:text-base text-gray-700">
                    <p className="font-medium">{t('contact_us.phone_label')}</p>
                    <p>+1 234 567 890</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <MapPin className="flex-shrink-0 w-6 h-6 text-[#01257D]" />
                  <div className="text-sm sm:text-base text-gray-700">
                    <p className="font-medium">{t('contact_us.address_label')}</p>
                    <p>{t('contact_us.address_line_1')}</p>
                    <p>{t('contact_us.address_line_2')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('contact_us.send_message_heading')}</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact_us.your_name_label')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder={t('contact_us.your_name_placeholder')}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact_us.your_email_label')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder={t('contact_us.your_email_placeholder')}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact_us.subject_label')}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder={t('contact_us.subject_placeholder')}
                  />
                  {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact_us.message_label')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder={t('contact_us.message_placeholder')}
                  ></textarea>
                  {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
                </div>
                <div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? t('contact_us.sending') : t('contact_us.send_message')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
