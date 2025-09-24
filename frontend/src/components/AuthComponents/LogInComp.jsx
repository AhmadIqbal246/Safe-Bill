import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetAuthState } from "../../store/slices/AuthSlices";
import { toast } from "react-toastify";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function LogInComp() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [emailError, setEmailError] = useState(""); // store i18n key when error exists
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, success, user } = useSelector((state) => state.auth);

  // Get the redirect URL from query parameters
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Do not show validation while typing; only clear any prior error
    if (name === 'email' && emailError) setEmailError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate email before submit
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email)) {
      setEmailError('login.invalid_email');
      return;
    }
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
      toast.success(t("login.login_successful"));
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
            console.warn(t("login.invalid_redirect_url"), redirectUrl);
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
      const errorMap = {
        'No active account found with the given credentials': 'login.no_active_account',
        'Invalid credentials': 'login.invalid_credentials',
      };
      const translateKnown = (msg) => {
        const key = errorMap[msg];
        return key ? t(key) : msg;
      };
      let message = '';
      if (typeof error === 'string') {
        message = translateKnown(error);
      } else if (error?.detail) {
        message = translateKnown(error.detail);
      } else {
        try {
          const parts = Object.values(error).flat();
          message = parts.map(translateKnown).join(', ');
        } catch (e) {
          message = t('common.error');
        }
      }
      toast.error(message);
      dispatch(resetAuthState());
    }
  }, [success, error, user, dispatch, navigate, redirectUrl, t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md border border-gray-200">
        <div className="flex justify-center -mt-14 mb-4">
          <div className="bg-[#01257D] rounded-full p-5 flex items-center justify-center">
            <Mail className="text-white w-10 h-10" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">{t("login.sign_in_to_account")}</h2>
        <form className="space-y-6 mt-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("login.email_address")}</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("login.enter_email")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A1128] focus:border-transparent ${emailError ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {emailError && (
              <p className="text-red-600 text-sm mt-1">{t(emailError)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("login.password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={t("login.enter_password")}
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
          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-[#0A1128] hover:underline">
              {t("login.forgot_password")}
            </Link>
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
                {t("login.signing_in")}
              </span>
            ) : (
              t("login.sign_in")
            )}
          </button>
          {/* <div className="text-center">
            <a href="/forgot-password" className="text-sm text-[#0A1128] hover:underline">
              Forgot password?
            </a>
          </div> */}
        </form>
      </div>
    </div>
  );
}
