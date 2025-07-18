import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetAuthState } from "../../store/slices/AuthSlices";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function LogInComp() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success, user } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  useEffect(() => {
    if (success && user) {
      toast.success("Login successful!");
      setTimeout(() => {
        dispatch(resetAuthState());
        navigate("/");
      }, 1500);
    } else if (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error.detail || Object.values(error).flat().join(", ")
      );
      dispatch(resetAuthState());
    }
  }, [success, error, user, dispatch, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md border border-gray-200">
        <div className="flex justify-center -mt-14 mb-4">
          <div className="bg-[#0A1128] rounded-full p-5 flex items-center justify-center">
            <Mail className="text-white w-10 h-10" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">Sign in to your account</h2>
        <form className="space-y-6 mt-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A1128] focus:border-transparent border-gray-300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A1128] focus:border-transparent border-gray-300"
                required
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
          </div>
          <button
            type="submit"
            className="w-full px-6 py-2 text-sm font-medium text-white bg-[#0A1128] hover:bg-[#001F54] rounded-md transition-colors flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
          <div className="text-center">
            <a href="/forgot-password" className="text-sm text-[#0A1128] hover:underline">
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
