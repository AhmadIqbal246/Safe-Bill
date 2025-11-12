import React, { useState, useEffect } from "react";
import { Bell, Menu, X, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser, switchActiveRole } from "../../../store/slices/AuthSlices";
import {
  fetchNotifications,
  markNotificationRead,
} from "../../../store/slices/NotificationSlice";
import { useNotificationWebSocket } from "../../../hooks/useNotificationWebSocket";
import { formatDistanceToNow } from "date-fns";
import SignUpPopup from "./SignUpPopup";
import { useTranslation } from "react-i18next";
import Logo from "../../../assets/Safe_Bill_Dark.png";

export const signedOutNavItems = [
  { label: "navbar.home", href: "/" },
  { label: "navbar.find_professionals", href: "/find-professionals" },
  { label: "navbar.contact", href: "/contact-us" },
];

export const signedInNavItems = [
  { label: "navbar.contact", href: "/contact-us" },
];

export const buyerNavItems = [
  { label: "navbar.find_professionals", href: "/find-professionals" },
  {
    label: "navbar.how_to_accept_project_invite",
    href: "/how-to-accept-project-invite",
  },
  { label: "navbar.contact", href: "/contact-us" },
];

export default function SafeBillHeader({
  onSignIn,
  onJoinNow,
  onSignOut,
  hideSafeBillHeader,
  showSafeBillHeaderOnMobile,
  shiftNavbarLeft,
  navbarRightStyle,
  navbarRightClassName,
  showMobileMenuButton = true,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  // Add separate state for mobile notification dropdown
  const [isMobileNotifDropdownOpen, setIsMobileNotifDropdownOpen] =
    useState(false);
  const [isSignUpPopupOpen, setIsSignUpPopupOpen] = useState(false);

  // i18n
  const { t, i18n } = useTranslation();
  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  // Get auth state from Redux
  const user = useSelector((state) => state.auth.user);
  const isSignedIn = !!user;
  const userName = user ? user.name || user.username || "User" : "User";
  // Prefer uploaded profile picture if available, fallback to existing avatar or null
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const profilePic = user && user.profile_pic ? String(user.profile_pic) : null;
  const computedProfilePic = profilePic
    ? profilePic.startsWith("http")
      ? profilePic
      : `${BASE_URL}${
          profilePic.startsWith("/") ? profilePic.slice(1) : profilePic
        }`
    : null;
  const userAvatar =
    computedProfilePic || (user && user.avatar ? user.avatar : null);
  // Remove console.log to avoid null logging
  const userEmail = user && user.email ? user.email : "";

  // Determine admin panel visibility from session/user
  const adminRoleFlag =
    typeof window !== "undefined" &&
    sessionStorage.getItem("admin_role") === "true";
  const canSeeAdminPanel = !!(
    adminRoleFlag ||
    (user &&
      (user.role === "admin" ||
        user.role === "super-admin" ||
        user.is_admin === true))
  );

  // Visibility based on current role
  const canSeeProjectInvite = !!(user && (user.role === "professional-buyer" || user.role === "buyer"));
  const canSeeSellerDashboard = !!(user && user.role === "seller");

  // Toggle visibility: show only if both seller and professional-buyer are enabled
  // AND user's current role is either seller or professional-buyer
  const canToggleRoles = !!(
    user && 
    Array.isArray(user.available_roles) &&
    user.available_roles.includes("seller") &&
    user.available_roles.includes("professional-buyer") &&
    (user.role === "seller" || user.role === "professional-buyer")
  );

  const handleToggleRole = async () => {
    if (!user) return;
    const targetRole = user.role === "seller" ? "professional-buyer" : "seller";
    
    try {
      const action = await dispatch(switchActiveRole({ targetRole }));
      
      if (action?.error) {
        console.error('Role switch failed:', action.error);
        return;
      }
      
      const updated = action?.payload?.user || null;
      const role = updated?.role || user.role;
      const sellerComplete = !!updated?.seller_onboarding_complete;
      const proBuyerComplete = !!updated?.pro_buyer_onboarding_complete;
      
      // Determine the target URL based on the new role
      let targetUrl = '/';
      if (role === 'seller') {
        targetUrl = !sellerComplete ? '/onboarding' : '/seller-dashboard';
      } else if (role === 'professional-buyer') {
        targetUrl = !proBuyerComplete ? '/onboarding' : '/buyer-dashboard';
      }
      
      // Use React Router navigation - ProtectedRoute will automatically re-evaluate
      navigate(targetUrl);
    } catch (error) {
      console.error('Error in role switch:', error);
    }
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Notifications
  const { notifications, websocketConnected } = useSelector(
    (state) => state.notifications
  );
  const { markNotificationRead: wsMarkNotificationRead } =
    useNotificationWebSocket();

  useEffect(() => {
    if (isSignedIn) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isSignedIn]);
  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  const handleSignOut = async () => {
    try {
      await dispatch(logoutUser());
    } catch (e) {
      // ignore
    }
    try {
      // Clear any auth-related storage flags
      sessionStorage.removeItem("admin_role");
      sessionStorage.removeItem("token");
      // If redux-persist is used, clear persisted state to avoid stale user
      localStorage.removeItem("persist:root");
      localStorage.removeItem("token");
    } catch (e) {
      // ignore storage errors
    }
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    // Force a hard reload to fully reset any persisted UI state
    window.location.replace("/");
  };

  const navItems = isSignedIn ? signedInNavItems : signedOutNavItems;

  // Example: use a default style if shiftNavbarLeft is true, or use the passed style/class
  const leftShiftStyle = shiftNavbarLeft
    ? navbarRightStyle || { marginLeft: 0, justifyContent: "flex-start" }
    : navbarRightStyle;

  const leftShiftClass = shiftNavbarLeft
    ? navbarRightClassName || "pl-8 justify-start"
    : navbarRightClassName || "justify-end";

  // Notification icon logic (reuse from dashboard)
  function getNotificationIconFromNotification(notification) {
    // Prefer stable translation keys so icons don't depend on language
    const key = notification?.translation_key || "";
    if (key.startsWith("notifications.project_")) return "+";
    if (key.startsWith("notifications.payment_")) return "$";
    // Fallback to heuristic on translated text
    const message = translateNotification(notification) || "";
    const lower = message.toLowerCase();
    if (lower.includes("project")) return "+";
    if (lower.includes("approved")) return "✓";
    if (lower.includes("deadline")) return "⏰";
    if (lower.includes("payment")) return "$";
    return "!";
  }

  // Function to translate notification messages dynamically
  function translateNotification(notification) {
    // Check if notification has translation_key field (new format)
    if (notification.translation_key) {
      // Try to parse translation_variables if it's a string
      let variables = notification.translation_variables || {};
      if (typeof variables === 'string') {
        try {
          variables = JSON.parse(variables);
        } catch (e) {
          variables = {};
        }
      }
      
      // Use the full key path with notifications namespace
      return t(notification.translation_key, { ...variables });
    }
    
    // Fallback: Check if message is a translation key (backward compatibility)
    if (notification.message && notification.message.startsWith('notifications.')) {
      // For old notifications, we need to extract variables from the message or use defaults
      // This is a fallback for notifications created before the new system
      let variables = {};
      
      // Try to extract project name from the message if it contains it
      if (notification.message.includes('project_created') || notification.message.includes('invitation_generated')) {
        // For old notifications, we can't get the actual project name, so we'll show a generic message
        variables = { project_name: 'Projet' }; // Generic fallback
      }
      
      return t(notification.message, variables);
    }
    
    // Return plain text message (old notifications without translation)
    return notification.message;
  }

  function renderNotifications(list = notifications) {
    const unreadList = (list || []).filter((n) => !n.is_read);
    if (!unreadList || unreadList.length === 0) {
      return (
        <div className="text-center text-gray-400 p-4">
          {t("navbar.no_unread_notifications")}
        </div>
      );
    }
    return unreadList.slice(0, 5).map((n, idx) => (
      <div
        key={`notif-${n.id}-${idx}`}
        className="flex items-center gap-3 p-2 hover:bg-gray-50"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E6F0FA] text-[#01257D] text-lg font-bold flex-shrink-0">
          {getNotificationIconFromNotification(n)}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-sm text-gray-800">{translateNotification(n)}</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
          </div>
        </div>
        <button
          className="ml-1 mr-2 text-green-600 hover:text-green-800 self-center flex-shrink-0 cursor-pointer"
          title="Mark as read"
          onClick={() => {
            if (websocketConnected) {
              wsMarkNotificationRead(n.id);
            } else {
              dispatch(markNotificationRead(n.id));
            }
          }}
        >
          <CheckCircle size={18} />
        </button>
      </div>
    ));
  }

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            {showSafeBillHeaderOnMobile ? (
              <Link
                to="/"
                className="md:hidden inline-flex items-center cursor-pointer pt-2 -ml-4 mr-1"
              >
                <img
                  src={Logo}
                  alt="Safe Bill"
                  className="h-4 w-auto object-contain"
                />
              </Link>
            ) : (
              !hideSafeBillHeader && (
                <Link
                  to="/"
                  className="inline-flex items-center cursor-pointer pt-4"
                >
                  <img
                    src={Logo}
                    alt="Safe Bill"
                    className="h-6 w-auto object-contain"
                  />
                </Link>
              )
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {canSeeProjectInvite && (
              <Link
                to="/find-professionals"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                {t("navbar.find_professionals")}
              </Link>
            )}
            {canSeeProjectInvite && (
              <Link
                to="/buyer-dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
            )}
            {canSeeSellerDashboard && (
              <Link
                to="/seller-dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
            )}
            {canSeeAdminPanel && (
              <Link
                to="/admin"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Admin Panel
              </Link>
            )}
            {canSeeProjectInvite && (
              <Link
                to="/how-to-accept-project-invite"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                {t("navbar.how_to_accept_project_invite")}
              </Link>
            )}
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>

          {/* Right Side - Desktop */}
          <div
            className={`hidden md:flex items-center space-x-4 ${leftShiftClass}`}
            style={leftShiftStyle}
          >
            {/* Role Toggle Button */}
            {canToggleRoles && (
              <div className="flex items-center mr-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => user.role !== 'seller' && handleToggleRole()}
                    className={`px-3 py-1 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                      user.role === 'seller'
                        ? 'bg-[#01257D] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {t("navbar.seller")}
                  </button>
                  <button
                    onClick={() => user.role !== 'professional-buyer' && handleToggleRole()}
                    className={`px-3 py-1 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                      user.role === 'professional-buyer'
                        ? 'bg-[#01257D] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {t("navbar.pro_buyer")}
                  </button>
                </div>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center mr-2 border border-transparent rounded-md bg-white px-2 py-1">
              <button
                onClick={() => changeLanguage("fr")}
                className={`text-xs cursor-pointer ${
                  i18n.language.startsWith("fr")
                    ? "text-[#01257D] font-bold"
                    : "text-gray-400 font-bold"
                }`}
                title="Français"
              >
                FR
              </button>
              <span className="text-xs text-[#01257D] mx-2 font-bold">|</span>
              <button
                onClick={() => changeLanguage("en")}
                className={`text-xs cursor-pointer ${
                  i18n.language.startsWith("en")
                    ? "text-[#01257D] font-bold"
                    : "text-gray-400 font-bold"
                }`}
                title="English"
              >
                ENG
              </button>
            </div>
            {isSignedIn ? (
              <>
                {/* Notification Bell with Dropdown */}
                <div className="relative">
                  <button
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                    onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 max_h-80 max-h-80 overflow-y-auto">
                      <div className="py-2">{renderNotifications()}</div>
                    </div>
                  )}
                </div>
                {/* User Avatar with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {userAvatar ? (
                        <img
                          src={userAvatar || "/placeholder.svg"}
                          alt={userName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </button>
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="flex flex_col flex-col items-start px-4 py-3 border-b border-gray-100 bg-transparent w-full text-left focus:outline-none"
                          style={{ background: "none", border: "none" }}
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {userName}
                          </p>
                          <p className="text-xs text-gray-500">{userEmail}</p>
                        </button>
                        <Link
                          to={
                            (user.role || user.active_role) === "seller"
                              ? "/profile"
                              : user.role === "admin"
                              ? "/admin"
                              : "/buyer-dashboard"
                          }
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {t("navbar.profile")}
                        </Link>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {t("navbar.settings")}
                        </a>
                        <Link
                          to="/billings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {t("navbar.billing")}
                        </Link>
                        <div className="border-t border-gray-100">
                          <Link
                            to="/delete-account"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t("navbar.delete_my_account")}
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            {t("navbar.sign_out")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Sign In and Join Now Buttons */}
                <button
                  onClick={onSignIn}
                  className="px-6 py-2 text-sm font-medium text-[#01257D] hover:text-[#2346a0] hover:bg-gray-100 rounded-[15px] transition-colors cursor-pointer"
                >
                  <Link to="/login">{t("navbar.sign_in")}</Link>
                </button>
                <button
                  onClick={() => setIsSignUpPopupOpen(true)}
                  className="px-6 py-2 text-sm font-medium text_white text-white bg-[#01257D] hover:bg-[#2346a0]  rounded-[15px] transition-colors cursor-pointer"
                >
                  {t("navbar.sign_up")}
                </button>
              </>
            )}
          </div>

          {/* Mobile Right Side (avatar and bell only, no hamburger) */}
          {!showMobileMenuButton && (
            <div className="flex md:hidden items-center space-x-4">
              {/* Role Toggle Button - Mobile */}
              {canToggleRoles && (
                <div className="flex items-center">
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => user.role !== 'seller' && handleToggleRole()}
                      className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                        user.role === 'seller'
                          ? 'bg-[#01257D] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <span className="hidden sm:inline">{t("navbar.seller")}</span>
                      <span className="sm:hidden">S</span>
                    </button>
                    <button
                      onClick={() => user.role !== 'professional-buyer' && handleToggleRole()}
                      className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                        user.role === 'professional-buyer'
                          ? 'bg-[#01257D] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <span className="hidden sm:inline">{t("navbar.pro_buyer")}</span>
                      <span className="sm:hidden">P</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Language Switcher - Mobile */}
              <div className="flex items-center border border-transparent rounded-md bg-white px-2 py-1">
                <button
                  onClick={() => changeLanguage("fr")}
                  className={`text-xs cursor-pointer ${
                    i18n.language.startsWith("fr")
                      ? "text-[#01257D] font-bold"
                      : "text-gray-400 font-bold"
                  }`}
                  title="Français"
                >
                  FR
                </button>
                <span className="text-xs text-[#01257D] mx-2 font-bold">|</span>
                <button
                  onClick={() => changeLanguage("en")}
                  className={`text-xs cursor-pointer ${
                    i18n.language.startsWith("en")
                      ? "text-[#01257D] font-bold"
                      : "text-gray-400 font-bold"
                  }`}
                  title="English"
                >
                  ENG
                </button>
              </div>
              {isSignedIn ? (
                <>
                  {/* Mobile Notification Bell with Dropdown */}
                  <div className="relative">
                    <button
                      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                      onClick={() =>
                        setIsMobileNotifDropdownOpen(!isMobileNotifDropdownOpen)
                      }
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {isMobileNotifDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                        <div className="py-2">{renderNotifications()}</div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {userAvatar ? (
                          <img
                            src={userAvatar || "/placeholder.svg"}
                            alt={userName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </button>
                    {/* Dropdown Menu (reuse desktop logic) */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex flex-col items-start px-4 py-3 border-b border-gray-100 bg-transparent w-full text-left focus:outline-none"
                            style={{ background: "none", border: "none" }}
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {userName}
                            </p>
                            <p className="text-xs text-gray-500">{userEmail}</p>
                          </button>
                          <Link
                            to={
                              (user.role || user.active_role) === "seller"
                                ? "/profile"
                                : user.role === "admin"
                                ? "/admin"
                                : "/buyer-dashboard"
                            }
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t("navbar.profile")}
                          </Link>
                          <a
                            href="#"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t("navbar.settings")}
                          </a>
                          <Link
                            to="/billings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t("navbar.billing")}
                          </Link>
                          <div className="border-t border-gray-100">
                            <Link
                              to="/delete-account"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t("navbar.delete_my_account")}
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t("navbar.sign_out")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={onSignIn}
                    className="px-4 py-2 text-sm font-medium text-[#01257D] hover:text-[#2346a0] hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  >
                    <Link to="/login">{t("navbar.sign_in")}</Link>
                  </button>
                  <button
                    onClick={() => setIsSignUpPopupOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#01257D] hover:bg-[#2346a0]  rounded-md transition-colors cursor-pointer"
                  >
                    {t("navbar.sign_up")}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          {showMobileMenuButton && (
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {canSeeProjectInvite && (
                <Link
                  to="/find-professionals"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  {t("navbar.find_professionals")}
                </Link>
              )}
              {canSeeSellerDashboard && (
                <Link
                  to="/seller-dashboard"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Dashboard
                </Link>
              )}
              {canSeeAdminPanel && (
                <Link
                  to="/admin"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Admin Panel
                </Link>
              )}
              {canSeeProjectInvite && (
                <Link
                  to="/buyer-dashboard"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Dashboard
                </Link>
              )}
              {canSeeProjectInvite && (
                <Link
                  to="/how-to-accept-project-invite"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  {t("navbar.how_to_accept_project_invite")}
                </Link>
              )}
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  {t(item.label)}
                </Link>
              ))}

              {/* Role Toggle Button - Mobile in menu */}
              {canToggleRoles && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="flex bg-gray-100 rounded-lg p-1 w-full">
                    <button
                      onClick={() => user.role !== 'seller' && handleToggleRole()}
                      className={`flex-1 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                        user.role === 'seller'
                          ? 'bg-[#01257D] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <span className="hidden min-[480px]:inline">{t("navbar.seller")}</span>
                      <span className="min-[480px]:hidden">S</span>
                    </button>
                    <button
                      onClick={() => user.role !== 'professional-buyer' && handleToggleRole()}
                      className={`flex-1 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                        user.role === 'professional-buyer'
                          ? 'bg-[#01257D] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <span className="hidden min-[480px]:inline">{t("navbar.pro_buyer")}</span>
                      <span className="min-[480px]:hidden">P</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Language Switcher - Mobile in menu */}
              <div className="flex items-center border border-transparent rounded-md bg-white px-3 py-1 mx-3">
                <button
                  onClick={() => changeLanguage("fr")}
                  className={`text-xs cursor-pointer ${
                    i18n.language.startsWith("fr")
                      ? "text-[#01257D] font-bold"
                      : "text-gray-400 font-bold"
                  }`}
                >
                  FR
                </button>
                <span className="text-xs text-[#01257D] mx-3 font-bold">|</span>
                <button
                  onClick={() => changeLanguage("en")}
                  className={`text-xs cursor-pointer ${
                    i18n.language.startsWith("en")
                      ? "text-[#01257D] font-bold"
                      : "text-gray-400 font-bold"
                  }`}
                >
                  ENG
                </button>
              </div>

              {/* Mobile Auth Section */}
              <div className="pt-4 pb-3 border-t border-gray-200">
                {isSignedIn ? (
                  <div className="flex items-center px-3">
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden focus:outline-none"
                      >
                        {userAvatar ? (
                          <img
                            src={userAvatar || "/placeholder.svg"}
                            alt={userName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="ml-3 flex flex-col items-start bg-transparent w-auto text-left focus:outline-none"
                      style={{ background: "none", border: "none" }}
                    >
                      <div className="text-base font-medium text-gray-800">
                        {userName}
                      </div>
                      <div className="text-sm font-medium text-gray-500">
                        {userEmail}
                      </div>
                    </button>
                    {/* Mobile Menu Notification Bell with Dropdown */}
                    <div className="ml-auto relative">
                      <button
                        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded_full rounded-full cursor-pointer"
                        onClick={() =>
                          setIsMobileNotifDropdownOpen(
                            !isMobileNotifDropdownOpen
                          )
                        }
                      >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                      {isMobileNotifDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                        <div className="py-2">{renderNotifications()}</div>
                          <div className="py-2">{renderNotifications()}</div>
                        </div>
                      )}
                    </div>
                    {/* Mobile Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-4 top-20 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {userName}
                            </p>
                            <p className="text-xs text-gray-500">{userEmail}</p>
                          </div>
                          <Link
                            to={
                              user.role === "seller"
                                ? "/profile"
                                : user.role === "admin"
                                ? "/admin"
                                : "/buyer-dashboard"
                            }
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t("navbar.profile")}
                          </Link>
                          <a
                            href="#"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t("navbar.settings")}
                          </a>
                          <Link
                            to="/billings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {t("navbar.billing")}
                          </Link>
                          <div className="border-t border-gray-100">
                            <Link
                              to="/delete-account"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t("navbar.delete_my_account")}
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {t("navbar.sign_out")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 px-3">
                    <button
                      onClick={onSignIn}
                      className="w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      <Link to="/login">{t("navbar.sign_in")}</Link>
                    </button>
                    <button
                      onClick={() => setIsSignUpPopupOpen(true)}
                      className="w-full px-3 py-2 text-base font-medium text-white bg-[#01257D] hover:bg-[#2346a0]  rounded-md"
                    >
                      {t("navbar.sign_up")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        ></div>
      )}
      {isNotifDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsNotifDropdownOpen(false)}
        ></div>
      )}
      {isMobileNotifDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMobileNotifDropdownOpen(false)}
        ></div>
      )}

      {/* Sign Up Popup */}
      <SignUpPopup
        isOpen={isSignUpPopupOpen}
        onClose={() => setIsSignUpPopupOpen(false)}
      />
    </header>
  );
}
