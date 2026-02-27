import React from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { submitCallbackRequest, resetFeedbackState } from '../../store/slices/FeedbackSlices';
import { useTranslation } from 'react-i18next';

export default function CallbackForm({ open, onClose, defaultRole }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(state => state.feedback);
  const { user } = useSelector(state => state.auth);

  const [form, setForm] = React.useState({
    company_name: '',
    siret_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (!open) {
      setForm({ company_name: '', siret_number: '', first_name: '', last_name: '', email: '', phone: '' });
      setErrors({});
      if (success || error) dispatch(resetFeedbackState());
    }
  }, [open]);

  // Show localized toast notifications on success/error
  React.useEffect(() => {
    if (success) {
      toast.success(t('callback.success_toast', 'Callback request submitted successfully!'));
    }
  }, [success, t]);

  React.useEffect(() => {
    if (error) {
      const message = typeof error === 'string' ? error : t('callback.error_toast', 'Failed to submit callback request.');
      toast.error(message);
    }
  }, [error, t]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    // SIRET validation: only allow digits and limit to 14 characters
    if (name === 'siret_number') {
      const digitsOnly = value.replace(/\D/g, ''); // Remove non-digits
      const limitedValue = digitsOnly.slice(0, 14); // Limit to 14 digits

      setForm(prev => ({ ...prev, [name]: limitedValue }));

      // Clear error when user starts typing
      if (errors.siret_number) {
        setErrors(prev => ({ ...prev, siret_number: '' }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate SIRET number
    const newErrors = {};
    if (form.siret_number && form.siret_number.length !== 14) {
      newErrors.siret_number = t('callback.siret_error', 'SIRET number must be exactly 14 digits');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const role = user?.role || defaultRole || '';
    await dispatch(submitCallbackRequest({ ...form, role }));
    // Close on success
    setTimeout(() => {
      if (!loading && !error) {
        onClose?.();
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{t('callback.title', 'Request a Callback')}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">✕</button>
        </div>

        {error && (
          <div className="mb-3 text-red-600 text-sm">{typeof error === 'string' ? error : t('callback.error', 'Something went wrong')}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('callback.company_name', 'Company name')}</label>
            <input name="company_name" value={form.company_name} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('callback.siret', 'SIRET')}</label>
            <input
              name="siret_number"
              value={form.siret_number}
              onChange={handleChange}
              placeholder={t('callback.siret_placeholder', 'Enter 14-digit SIRET number')}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D] ${errors.siret_number ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.siret_number && (
              <p className="mt-1 text-sm text-red-600">{errors.siret_number}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('callback.first_name', 'First name')}</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('callback.last_name', 'Last name')}</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D]" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('callback.email', 'Email address')}</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('callback.phone', 'Phone number')}</label>
              <input name="phone" value={form.phone} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D]" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">{t('callback.cancel', 'Cancel')}</button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-md bg-[#01257D] text-white hover:bg-[#2346a0] cursor-pointer disabled:opacity-60">
              {loading ? t('callback.submitting', 'Submitting...') : t('callback.submit', 'Submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


