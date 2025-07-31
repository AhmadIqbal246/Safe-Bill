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

export default function BuyerRegisterComp() {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  const initialForm = {
    firstName: "",
    lastName: "",
    address: "",
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
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = "Invalid email address";
      }
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    } else {
      if (form.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long.";
      } else if (!strongPasswordRegex.test(form.password)) {
        newErrors.password =
          "Password must contain uppercase, lowercase, number, and special character.";
      }
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      address: form.address,
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
              "Registration successful. Please check your email to verify your Email."
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
  }, [success, error, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-[#FFFFFF] rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[#111827] mb-2">
              Join Safe Bill as a Buyer
            </h1>
            <p className="text-[#111827]">
              Complete your registration to start using the platform.
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="Enter your first name"
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
                Last Name *
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Enter your last name"
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
                Address *
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter your address"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter your email address"
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
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Create a strong password"
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
                At least 8 characters with uppercase, lowercase, numbers and
                special character
              </p>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm your password"
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
                    Submitting...
                  </span>
                ) : (
                  "Create my account"
                )}
              </button>
            </div>
            {/* <span className="text-[#96C2DB] text-sm text-center block">
              <Link
                to="/professional-buyer"
                className="font-semibold text-[#01257D] hover:underline"
              >
                Register as a Professional Buyer
              </Link>
            </span>
            <span className="text-[#96C2DB] text-sm text-center block">
              <Link
                to="/seller-register"
                className="font-semibold text-[#01257D] hover:underline"
              >
                Register as a Service Provider
              </Link>
            </span> */}
            <span className="text-[#96C2DB] text-sm text-center block">
              Already registered?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#01257D] hover:underline"
              >
                Login
              </Link>
            </span>
          </form>
        </div>
      </div>
    </div>
  );
}
