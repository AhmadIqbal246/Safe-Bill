import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  registerBuyer,
  resetAuthState,
} from "../../../store/slices/AuthSlices";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export default function BuyerRegisterComp() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  const initialForm = {
    firstName: "",
    lastName: "",
    streetAddress: "",
    postalCode: "",
    cityRegion: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation regex: at least 8 chars, one uppercase, one lowercase, one number, one special char
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  const validate = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = t('registration.first_name_required');
    if (!form.lastName.trim()) newErrors.lastName = t('registration.last_name_required');
    if (!form.streetAddress.trim()) newErrors.streetAddress = t('registration.address_required');
    if (!form.postalCode.trim()) newErrors.postalCode = t('registration.postal_code_required');
    if (!form.cityRegion.trim()) newErrors.cityRegion = t('registration.city_region_required');
    if (!form.email.trim()) {
      newErrors.email = t('registration.email_required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = t('registration.invalid_email');
      }
    }
    if (!form.password) {
      newErrors.password = t('registration.password_required');
    } else {
      if (form.password.length < 8) {
        newErrors.password = t('registration.password_min_length');
      } else if (!strongPasswordRegex.test(form.password)) {
        newErrors.password = t('registration.password_complexity');
      }
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = t('registration.confirm_password_required');
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('registration.passwords_not_match');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      username: form.email.split("@")[0],
      first_name: form.firstName,
      last_name: form.lastName,
      address: `${form.streetAddress}, ${form.postalCode}, ${form.cityRegion}`,
      email: form.email,
      password: form.password,
      role: "buyer",
    };
    dispatch(registerBuyer(payload));
  };

  useEffect(() => {
    if (success) {
      toast.success(
        typeof success === "string"
          ? success
          : success.detail ||
              t('registration.registration_success')
      );
      setForm(initialForm);
      dispatch(resetAuthState());
    } else if (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error.detail || Object.values(error).flat().join(", ")
      );
    }
  }, [success, error, dispatch, t]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-[#FFFFFF] rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[#111827] mb-2">
              {t('buyer_registration.title')}
            </h1>
            <p className="text-[#111827]">
              {t('buyer_registration.description')}
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('buyer_registration.first_name_label')}
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder={t('buyer_registration.first_name_placeholder')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('buyer_registration.last_name_label')}
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder={t('buyer_registration.last_name_placeholder')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('buyer_registration.street_address_label')}
              </label>
              <input
                type="text"
                value={form.streetAddress}
                onChange={(e) => handleChange("streetAddress", e.target.value)}
                placeholder={t('buyer_registration.street_address_placeholder')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.streetAddress ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.streetAddress && (
                <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('buyer_registration.postal_code_label')}
              </label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                placeholder={t('buyer_registration.postal_code_placeholder')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.postalCode ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.postalCode && (
                <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('buyer_registration.city_region_label')}
              </label>
              <input
                type="text"
                value={form.cityRegion}
                onChange={(e) => handleChange("cityRegion", e.target.value)}
                placeholder={t('buyer_registration.city_region_placeholder')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.cityRegion ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cityRegion && (
                <p className="text-red-500 text-sm mt-1">{errors.cityRegion}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {t('buyer_registration.address_fields_combined_note')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('buyer_registration.email_label')}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder={t('buyer_registration.email_placeholder')}
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
                {t('buyer_registration.password_label')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={t('buyer_registration.password_placeholder')}
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
                {t('buyer_registration.password_requirements')}
              </p>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('buyer_registration.confirm_password_label')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  placeholder={t('buyer_registration.confirm_password_placeholder')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
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
            <div className="flex justify-center">
              <button
                type="submit"
                className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center bg-[#01257D] text-white hover:bg-[#2346a0] ${
                  loading ? "opacity-80" : ""
                }`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <ClipLoader color="#fff" loading={loading} size={20} />
                    {t('buyer_registration.submitting')}
                  </span>
                ) : (
                  t('buyer_registration.create_account')
                )}
              </button>
            </div>
            <span className="text-[#96C2DB] text-sm text-center block">
              {t('buyer_registration.already_registered')}{" "}
              <Link
                to="/login"
                className="font-semibold text-[#01257D] hover:underline"
              >
                {t('buyer_registration.login')}
              </Link>
            </span>
          </form>
        </div>
      </div>
    </div>
  );
}
