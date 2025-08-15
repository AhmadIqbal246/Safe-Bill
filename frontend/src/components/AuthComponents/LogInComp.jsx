import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetAuthState } from "../../store/slices/AuthSlices";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

export default function LogInComp() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, success, user } = useSelector((state) => state.auth);

  // Get the redirect URL from query parameters
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  // Debug function to check current user data
  const debugUserData = () => {
    const storedUser = sessionStorage.getItem('user');
    const storedAccess = sessionStorage.getItem('access');
    console.log('=== DEBUG USER DATA ===');
    console.log('Stored user:', storedUser);
    console.log('Stored access:', storedAccess);
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log('Parsed user:', parsedUser);
      console.log('User role:', parsedUser.role);
      console.log('Role comparison tests:');
      console.log('role === "buyer":', parsedUser.role === 'buyer');
      console.log('role === "professional-buyer":', parsedUser.role === 'professional-buyer');
      console.log('role.includes("buyer"):', parsedUser.role && parsedUser.role.includes('buyer'));
    }
    console.log('=====================');
  };

  useEffect(() => {
    if (success && user) {
      toast.success("Login successful!");
      console.log("User data:", user);
      console.log("User role:", user.role);
      console.log("User role type:", typeof user.role);
      console.log("User onboarding status:", user.onboarding_complete);
      
      setTimeout(() => {
        dispatch(resetAuthState());
        
        // Determine where to redirect after successful login
        let targetUrl = "/"; // default fallback
        
        if (user.onboarding_complete === false && 
          (user.role === 'seller' || user.role === 'professional-buyer')) {
          targetUrl = "/onboarding";
        } else if (redirectUrl) {
          // If there's a redirect URL, use it (with validation)
          try {
            const decodedUrl = decodeURIComponent(redirectUrl);
            // Basic validation to ensure it's a relative URL
            if (decodedUrl.startsWith('/') && !decodedUrl.includes('://')) {
              targetUrl = decodedUrl;
            }
          } catch (error) {
            console.warn('Invalid redirect URL:', redirectUrl);
            // Fall back to dashboard
          }
        } else if (user.onboarding_complete !== false) {
          // Role-based default landing pages
          if (user.role === 'admin') {
            targetUrl = '/admin';
          } else if (user.role === 'professional-buyer') {
            targetUrl = '/buyer-dashboard';
          } else if (user.role === 'seller') {
            targetUrl = '/seller-dashboard';
          }
        } else if (user.role === 'buyer') {
          targetUrl = '/buyer-dashboard';
        } else if (user.role === 'admin') {
          targetUrl = '/admin';
        }
        
        navigate(targetUrl);
      }, 1500);
    } else if (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error.detail || Object.values(error).flat().join(", ")
      );
      dispatch(resetAuthState());
    }
  }, [success, error, user, dispatch, navigate, redirectUrl]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md border border-gray-200">
        <div className="flex justify-center -mt-14 mb-4">
          <div className="bg-[#01257D] rounded-full p-5 flex items-center justify-center">
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
            className="w-full px-6 py-2 text-sm font-medium text-white bg-[#01257D] rounded-md transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#01257D] cursor-pointer"
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
          {/* <div className="text-center">
            <a href="/forgot-password" className="text-sm text-[#0A1128] hover:underline">
              Forgot password?
            </a>
          </div> */}
          
          {/* Debug button - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={debugUserData}
                className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Debug: Check User Data
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
