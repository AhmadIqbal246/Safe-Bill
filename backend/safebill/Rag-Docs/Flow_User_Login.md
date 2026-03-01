---
# Document Identity
doc_id: flow_user_login_001
title: User Login Flow
category: Flow
feature: User Login

# Audience & Access
user_roles: All
difficulty: Beginner
prerequisites: [Flow_User_Registration]

# Content Classification
topics: [Login, Authentication, JWT Token, Session Management]
keywords: [login, sign in, authenticate, credentials, token]
use_cases: [User accessing account, Session establishment, Authentication]

# Relationships
related_docs: [Flow_User_Registration, Flow_User_Logout, Feature_JWT_Token_Management, Feature_Token_Refresh_Mechanism, Error_Login_Errors, Guide_How_To_Login, Policy_Password_Security]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# User Login Flow

## Document Metadata
- **Feature**: User Login
- **Category**: User Flow
- **User Roles**: All (Seller, Buyer, Professional Buyer)
- **Average Duration**: 1-2 minutes
- **Prerequisites**: Registered account, verified email, correct credentials

---

## Quick Summary

The user login flow is the process by which registered users authenticate themselves and gain access to the Safe Bill platform. Users provide their email and password, the system validates these credentials, and if correct, issues JWT tokens that authenticate subsequent requests. The system supports both access tokens (short-lived) and refresh tokens (long-lived) for secure session management.

**Key Points:**
- Login requires verified email and correct password
- System issues JWT access token and refresh token
- Access token is valid for 24 hours
- Refresh token is valid for 7 days
- Tokens are used to authenticate all subsequent API requests
- Users can switch roles after login

---

## When This Applies

**Use this document when:**
- You're logging into your Safe Bill account
- You want to understand how authentication works
- You need to troubleshoot login issues
- You want to know about JWT tokens
- You're integrating login into your workflow

**Do NOT use this document for:**
- Creating a new account (see Flow_User_Registration)
- Resetting a forgotten password (see Flow_Password_Reset)
- Logging out (see Flow_User_Logout)
- Refreshing your token (see Feature_Token_Refresh_Mechanism)
- Understanding token expiration (see Error_Token_Expiration_Handling)

---

## Flow Overview

The login flow is straightforward: user provides credentials, system validates them, and issues authentication tokens if valid.

**Flow Stages:**
1. **Credential Entry** - User enters email and password
2. **Validation** - System validates credentials
3. **Token Generation** - System generates JWT tokens
4. **Token Return** - Tokens sent to user
5. **Session Establishment** - User is authenticated
6. **Dashboard Access** - User can access platform

**Success Criteria:**
- User credentials are correct
- Email is verified
- System returns access token and refresh token
- User can make authenticated API requests
- User can access dashboard

---

## Visual Flow Diagram

```
User Visits Login Page
        ↓
[Enter Email & Password]
        ↓
[Click Login Button]
        ↓
[System Validates Credentials]
        ↓
[Email Verified?] → NO → [Show Error: Email Not Verified]
        ↓ YES
[Password Correct?] → NO → [Show Error: Invalid Credentials]
        ↓ YES
[Generate JWT Tokens]
        ↓
[Return Access Token & Refresh Token]
        ↓
[Store Tokens in Browser]
        ↓
[Redirect to Dashboard]
        ↓
[User Can Access Platform]
```

---

## Detailed Steps

### Step 1: Enter Login Credentials

**Actor**: User  
**Action**: User enters email and password on login form  
**Input Required**: 
- Email address (registered on platform)
- Password (associated with email)

**Validation**: Client-side format validation  
**Success Output**: Form is ready for submission  
**Failure Output**: Validation errors displayed

**What you do:**
You navigate to the login page and enter your email address and password in the provided fields.

**What happens:**
As you type, the system performs basic validation (email format, password not empty). The login button becomes enabled when both fields have content.

**What you see:**
- Email field with placeholder "Enter your email"
- Password field with masked characters (dots/asterisks)
- "Remember me" checkbox (optional)
- Login button
- "Forgot password?" link
- "Don't have an account? Register" link

**Technical Details:**
- Frontend form validation
- Email format checked using regex
- Password field is masked for security
- No server communication at this stage
- Form state managed by frontend framework

**Example:**
```
Email: marie.dupont@company.fr
Password: SecurePass123!
Remember me: [checked]
```

---

### Step 2: Submit Login Form

**Actor**: User  
**Action**: User clicks the "Login" or "Sign In" button  
**Input Required**: Email and password  
**Validation**: Server-side credential validation  
**Success Output**: JWT tokens generated and returned  
**Failure Output**: Error message explaining why login failed

**What you do:**
After entering your credentials, you click the "Login" or "Sign In" button.

**What happens:**
Your credentials are sent to the server, which validates them against the database. If they match, the server generates JWT tokens. If they don't match, an error is returned.

**What you see:**
- Loading spinner while processing
- Success: Redirect to dashboard
- Error: Message explaining what went wrong

**Technical Details:**
- POST request to `/api/accounts/login/`
- Server validates:
  - Email exists in database
  - Email is verified (is_email_verified = True)
  - Password matches hashed password in database
  - Account is active (not deleted)
- If valid:
  - Access token generated (24-hour expiration)
  - Refresh token generated (7-day expiration)
  - Tokens returned in response
- If invalid:
  - Generic error returned (doesn't reveal if email exists)
  - No tokens generated

**Example Request:**
```json
{
  "email": "marie.dupont@company.fr",
  "password": "SecurePass123!"
}
```

**Example Response (Success):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 42,
    "email": "marie.dupont@company.fr",
    "role": "seller",
    "available_roles": ["seller", "professional-buyer"],
    "active_role": "seller"
  }
}
```

**Example Response (Failure):**
```json
{
  "detail": "Invalid email or password"
}
```

---

### Step 3: Store Authentication Tokens

**Actor**: System  
**Action**: System stores JWT tokens in browser for future requests  
**Input Required**: Access token and refresh token from server  
**Validation**: Tokens are valid JWT format  
**Success Output**: Tokens stored securely in browser  
**Failure Output**: N/A

**What you do:**
Nothing - the system automatically stores the tokens.

**What happens:**
The browser receives the JWT tokens and stores them locally. The access token is used for all API requests. The refresh token is stored separately and used to get a new access token when the current one expires.

**What you see:**
Nothing visible - this happens in the background.

**Technical Details:**
- Access token typically stored in:
  - localStorage (persistent across browser sessions)
  - Or sessionStorage (cleared when browser closes)
  - Or secure HTTP-only cookies (recommended)
- Refresh token stored separately in secure storage
- Tokens are included in Authorization header for subsequent requests
- Format: `Authorization: Bearer <access_token>`

**Storage Example:**
```javascript
// Access token stored in localStorage
localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')

// Refresh token stored separately
localStorage.setItem('refresh_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')

// User data stored
localStorage.setItem('user', JSON.stringify({
  id: 42,
  email: 'marie.dupont@company.fr',
  role: 'seller'
}))
```

---

### Step 4: Redirect to Dashboard

**Actor**: System  
**Action**: System redirects user to appropriate dashboard based on role  
**Input Required**: Valid authentication tokens  
**Validation**: Tokens are valid and user is authenticated  
**Success Output**: User is redirected to dashboard  
**Failure Output**: N/A

**What you do:**
Nothing - the system automatically redirects you.

**What happens:**
After successful login, the system determines your primary role and redirects you to the appropriate dashboard. Sellers see the seller dashboard, buyers see the buyer dashboard.

**What you see:**
- Brief loading screen
- Redirect to dashboard URL
- Dashboard loads with your information

**Technical Details:**
- Frontend checks user.role from response
- Routes to appropriate dashboard component:
  - Seller role → `/seller-dashboard`
  - Buyer role → `/buyer-dashboard`
  - Professional buyer role → `/professional-buyer-dashboard`
  - Admin role → `/admin-dashboard`
- Dashboard component loads user data using access token
- Subsequent API requests include access token in Authorization header

---

### Step 5: Access Platform Features

**Actor**: User  
**Action**: User can now access all platform features  
**Input Required**: Valid access token  
**Validation**: Token is valid and not expired  
**Success Output**: API requests are authenticated and processed  
**Failure Output**: If token expires, user is prompted to refresh or re-login

**What you do:**
You can now use all platform features: view projects, create quotes, chat with clients, manage payments, etc.

**What happens:**
Every API request you make includes your access token. The server validates the token and processes your request if it's valid.

**What you see:**
- Full access to dashboard
- Can view projects, messages, payments
- Can create new projects
- Can manage account settings

**Technical Details:**
- All API requests include: `Authorization: Bearer <access_token>`
- Server validates token signature and expiration
- If token is valid, request is processed
- If token is expired, user gets 401 Unauthorized response
- Frontend should then refresh token or redirect to login

**Example API Request:**
```
GET /api/projects/my-projects/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Alternative Paths

### Path: Email Not Verified

**When it happens**: User tries to log in but hasn't verified their email yet  
**Different steps**:
1. User enters correct email and password
2. System checks: is_email_verified = False
3. System shows error: "Please verify your email before logging in"
4. User clicks "Resend Verification Email"
5. New verification email is sent
6. User verifies email
7. User can now log in

**Outcome**: User must verify email before accessing platform

---

### Path: Account Deleted

**When it happens**: User tries to log in with a deleted account  
**Different steps**:
1. User enters email and password
2. System checks: account is in deleted_users table
3. System shows error: "This account has been deleted"
4. User cannot log in
5. User can contact support to restore account (within retention period)

**Outcome**: User cannot access platform, must contact support

---

### Path: Remember Me Enabled

**When it happens**: User checks "Remember me" during login  
**Different steps**:
1. User checks "Remember me" checkbox
2. User logs in normally
3. System stores refresh token in persistent storage
4. Next time user visits, system automatically logs them in
5. User doesn't need to enter credentials again

**Outcome**: User is automatically logged in on next visit (within 7 days)

---

## Success Indicators

- ✅ Login form accepts credentials
- ✅ System validates credentials correctly
- ✅ Access token is generated and returned
- ✅ Refresh token is generated and returned
- ✅ Tokens are stored in browser
- ✅ User is redirected to dashboard
- ✅ User can make authenticated API requests
- ✅ User can access all features

---

## Failure Indicators

- ❌ Login form shows validation errors
- ❌ "Invalid email or password" error appears
- ❌ "Email not verified" error appears
- ❌ User is not redirected to dashboard
- ❌ API requests return 401 Unauthorized
- ❌ User cannot access protected features

---

## Common Questions

**Q: What's the difference between access token and refresh token?**  
A: The access token is short-lived (24 hours) and used for all API requests. The refresh token is long-lived (7 days) and used only to get a new access token when the current one expires. This design improves security by limiting the damage if an access token is compromised.

**Q: How long can I stay logged in?**  
A: You can stay logged in for up to 7 days (the refresh token expiration period). After 7 days, you'll need to log in again. If you use the platform regularly, your refresh token is automatically extended.

**Q: What happens if I close my browser?**  
A: If tokens are stored in sessionStorage, they're cleared when you close the browser and you'll need to log in again. If tokens are stored in localStorage or cookies, you'll remain logged in when you reopen the browser (depending on your "Remember me" setting).

**Q: Can I log in from multiple devices?**  
A: Yes, you can log in from multiple devices simultaneously. Each device gets its own set of tokens. Logging out on one device doesn't affect your login on other devices.

**Q: What if I forget my password?**  
A: Click the "Forgot password?" link on the login page. You'll receive an email with a password reset link. See Flow_Password_Reset for detailed instructions.

**Q: Is my password sent to the server?**  
A: Yes, your password is sent to the server over HTTPS (encrypted). The server never stores your actual password - it only stores a hashed version. The server compares the hash of your entered password with the stored hash.

**Q: What if someone else logs in with my credentials?**  
A: If you suspect unauthorized access, change your password immediately. You can also log out from all devices in your account settings. See Guide_How_To_Secure_Your_Account for more information.

**Q: Can I stay logged in on a shared computer?**  
A: Not recommended. Don't check "Remember me" on shared computers. Always log out when you're done. See Guide_How_To_Logout for instructions.

**Q: Why do I need to verify my email to log in?**  
A: Email verification confirms that you own the email address and can receive communications. It prevents fake accounts and ensures we can contact you about important account activities.

---

## What Can Go Wrong

### Error: Invalid Email or Password
**When it happens**: You enter an email that doesn't exist or a password that doesn't match  
**Error message**: "Invalid email or password"  
**What it means**: Either the email isn't registered on Safe Bill, or the password is incorrect. The system doesn't tell you which one for security reasons.  
**How to fix**:
1. Double-check your email address for typos
2. Make sure you're using the correct password
3. If you forgot your password, click "Forgot password?"
4. If you don't have an account, click "Register"

**Prevention**: Write down your credentials in a secure location. Use a password manager to store your password.

**Example**: You try to log in with marie.dupont@company.fr but you registered with marie.dupont.pro@company.fr. Solution: Use the correct email address.

---

### Error: Email Not Verified
**When it happens**: You try to log in but haven't verified your email yet  
**Error message**: "Please verify your email before logging in"  
**What it means**: Your account exists but your email hasn't been confirmed. You need to click the verification link in the email you received during registration.  
**How to fix**:
1. Check your email for the verification message
2. Click the verification link in the email
3. If you don't see the email, click "Resend Verification Email"
4. Check your spam/junk folder
5. Try logging in again after verification

**Prevention**: Verify your email immediately after registration. Don't wait more than 24 hours or the link will expire.

**Example**: You registered yesterday but didn't verify your email. Solution: Check your email for the verification link and click it.

---

### Error: Account Locked
**When it happens**: You enter the wrong password multiple times  
**Error message**: "Account temporarily locked due to multiple failed login attempts. Try again in 15 minutes."  
**What it means**: For security, the system locks your account after several failed login attempts to prevent brute-force attacks.  
**How to fix**:
1. Wait 15 minutes before trying again
2. Make sure you're using the correct password
3. If you forgot your password, click "Forgot password?" (this doesn't count as a failed attempt)
4. If you still can't log in, contact support

**Prevention**: Be careful when entering your password. Use a password manager to avoid typos.

**Example**: You try to log in 5 times with the wrong password. Your account is locked for 15 minutes. Solution: Wait 15 minutes, then try again with the correct password.

---

### Error: Server Error (500)
**When it happens**: The server encounters an unexpected error while processing your login  
**Error message**: "Server error. Please try again later."  
**What it means**: Something went wrong on the server side. This is not your fault.  
**How to fix**:
1. Wait a few minutes and try again
2. Try a different browser
3. Clear your browser cache and cookies
4. If the problem persists, contact support

**Prevention**: This is a server issue, not something you can prevent. Just try again later.

---

### Error: Network Error
**When it happens**: Your internet connection is lost or very slow  
**Error message**: "Network error. Please check your connection and try again."  
**What it means**: The login request couldn't reach the server due to connection issues.  
**How to fix**:
1. Check your internet connection
2. Try a different network (WiFi vs mobile data)
3. Restart your router
4. Try again in a few minutes
5. If still not working, contact your internet provider

**Prevention**: Ensure you have a stable internet connection before attempting to log in.

---

## Important Rules

### Rule 1: Email Must Be Verified Before Login
**What it means**: You cannot log in unless you've verified your email address by clicking the verification link.  
**Why it exists**: Email verification confirms you own the email address and can receive communications. It prevents fake accounts.  
**Example**: 
- You register with marie.dupont@company.fr
- You receive verification email
- You must click the link to verify
- Only then can you log in

**Exception**: None - email verification is required for all accounts.

---

### Rule 2: Credentials Are Case-Sensitive
**What it means**: Your email and password are case-sensitive. "Password123" is different from "password123".  
**Why it exists**: Case sensitivity improves password security by requiring more precise input.  
**Example**: 
- ✅ Correct: SecurePass123!
- ❌ Incorrect: securepass123! (lowercase 's')

**Exception**: Email addresses are technically case-insensitive by email standards, but Safe Bill treats them as case-sensitive for consistency.

---

### Rule 3: Access Token Expires After 24 Hours
**What it means**: Your access token is only valid for 24 hours. After that, you need to refresh it or log in again.  
**Why it exists**: Short-lived tokens improve security. If a token is compromised, it's only valid for 24 hours.  
**Example**: 
- You log in at 10:00 AM Monday
- Your access token expires at 10:00 AM Tuesday
- After that, you need to refresh your token or log in again

**Exception**: None - all access tokens expire after 24 hours.

---

### Rule 4: Refresh Token Expires After 7 Days
**What it means**: Your refresh token is only valid for 7 days. After that, you must log in again.  
**Why it exists**: Long-lived tokens allow you to stay logged in without re-entering credentials, but they eventually expire for security.  
**Example**: 
- You log in on Monday
- Your refresh token expires the following Monday
- After that, you must log in again

**Exception**: None - all refresh tokens expire after 7 days.

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not provide passwordless login** - You must use email and password. Biometric or social login not currently supported.
- **Does not support account recovery without email** - If you lose access to your email, you cannot recover your account.
- **Does not allow login with username** - You must use your email address, not a username.
- **Does not support two-factor authentication** - Login only requires email and password.
- **Does not remember login across different browsers** - Each browser maintains its own token storage.

**Alternative Solutions:**
- For **passwordless login**, see Feature_Social_Login (when available)
- For **two-factor authentication**, see Feature_Two_Factor_Authentication (when available)
- For **account recovery**, see Guide_How_To_Recover_Account
- For **changing email**, see Guide_How_To_Change_Email

---

## Troubleshooting

### Problem: Login Button Doesn't Work
**Symptoms**: You click the login button but nothing happens  
**Possible causes**:
1. JavaScript is disabled in your browser
2. Browser has an extension blocking requests
3. Internet connection is unstable
4. Server is temporarily unavailable

**Solutions**:
1. Enable JavaScript in your browser settings
2. Try disabling browser extensions
3. Check your internet connection
4. Try a different browser
5. Wait a few minutes and try again
6. Contact support if problem persists

---

### Problem: Login Takes Too Long
**Symptoms**: Login form shows loading spinner for more than 30 seconds  
**Possible causes**:
1. Internet connection is slow
2. Server is overloaded
3. Browser is hanging

**Solutions**:
1. Check your internet speed
2. Wait a few minutes and try again
3. Refresh the page and try again
4. Try a different browser
5. Clear browser cache and cookies
6. Contact support if problem persists

---

### Problem: Tokens Not Stored
**Symptoms**: You log in successfully but get logged out immediately  
**Possible causes**:
1. Browser doesn't allow localStorage
2. Browser is in private/incognito mode
3. Browser storage is full
4. Browser has strict privacy settings

**Solutions**:
1. Try a different browser
2. Exit private/incognito mode
3. Clear browser cache and storage
4. Check browser privacy settings
5. Disable browser extensions that block storage

---

## Glossary

**Access Token**: Short-lived JWT token (24 hours) used to authenticate API requests  
**Refresh Token**: Long-lived JWT token (7 days) used to obtain a new access token  
**JWT**: JSON Web Token - a secure way to transmit information between parties  
**Authentication**: The process of verifying that you are who you claim to be  
**Credentials**: Your email and password used to log in  
**Session**: The period of time you're logged in to the platform  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Flow_User_Registration

**Read this next:**
- Flow_User_Logout
- Feature_JWT_Token_Management
- Feature_Token_Refresh_Mechanism

**Related topics:**
- Error_Login_Errors
- Guide_How_To_Login
- Policy_Password_Security
- Component_Authentication_System_Overview

