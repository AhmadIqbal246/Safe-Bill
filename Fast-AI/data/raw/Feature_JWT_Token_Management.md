---
# Document Identity
doc_id: feature_jwt_token_001
title: JWT Token Management
category: Feature
feature: JWT Token Management

# Audience & Access
user_roles: All
difficulty: Intermediate
prerequisites: [Flow_User_Login]

# Content Classification
topics: [JWT, Authentication, Tokens, Security, Session Management]
keywords: [JWT token, access token, refresh token, token expiration, authentication]
use_cases: [API authentication, Session management, Token refresh]

# Relationships
related_docs: [Feature_Token_Refresh_Mechanism, Flow_User_Login, Flow_User_Logout, Error_Token_Expiration_Handling, Component_Authentication_System_Overview]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# JWT Token Management

## Document Metadata
- **Feature**: JWT Token Management
- **Category**: Feature
- **Dependencies**: User authentication, login system
- **Enabled By Default**: Yes

---

## Quick Summary

JWT (JSON Web Token) Token Management is the system that handles secure authentication tokens for Safe Bill. After login, users receive two tokens: an access token (short-lived, 24 hours) and a refresh token (long-lived, 7 days). The access token is used to authenticate all API requests. When the access token expires, the refresh token is used to obtain a new access token without requiring the user to log in again.

**Key Capabilities:**
- Secure token generation and validation
- Access token for API authentication (24-hour validity)
- Refresh token for session extension (7-day validity)
- Automatic token expiration
- Token blacklisting on logout
- Stateless authentication (no server-side session storage)

**Use Cases:**
- Authenticating API requests
- Maintaining user sessions
- Extending sessions without re-login
- Securing API endpoints
- Preventing unauthorized access

---

## How It Works

### Component 1: Access Token

**Purpose**: Short-lived token used to authenticate API requests  
**How it works**: 
- Generated during login
- Valid for 24 hours
- Included in Authorization header of API requests
- Validated by server before processing request
- Expires automatically after 24 hours

**Example**: 
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsImVtYWlsIjoibWFyaWUuZHVwb250QGNvbXBhbnkuZnIiLCJleHAiOjE3MDMwMDAwMDB9.signature
```

**Token Structure**:
- Header: Algorithm (HS256) and token type (JWT)
- Payload: User ID, email, expiration time, other claims
- Signature: Cryptographic signature to verify token hasn't been tampered with

---

### Component 2: Refresh Token

**Purpose**: Long-lived token used to obtain new access tokens  
**How it works**: 
- Generated during login
- Valid for 7 days
- Stored securely in browser/client
- Used only to request new access token
- Never included in API requests (except token refresh endpoint)
- Expires automatically after 7 days

**Example**: 
```
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInR5cCI6InJlZnJlc2giLCJleHAiOjE3MDMwMDAwMDB9.signature"
}
```

---

### Component 3: Token Validation

**Purpose**: Verify token authenticity and validity  
**How it works**: 
- Server validates token signature using secret key
- Server checks token expiration time
- Server verifies token hasn't been blacklisted
- Server extracts user information from token payload
- Request is processed if token is valid, rejected if invalid

**Validation Steps**:
1. Check token format (Bearer prefix)
2. Decode token
3. Verify signature
4. Check expiration time
5. Check blacklist status
6. Extract user information

---

### Component 4: Token Blacklist

**Purpose**: Invalidate tokens when user logs out  
**How it works**: 
- When user logs out, access token is added to blacklist
- Blacklist is checked during token validation
- Blacklisted tokens are rejected even if not expired
- Blacklist entries expire automatically after token expiration time

**Example**: 
```
Blacklist Entry:
- Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Expires: 2024-12-07 10:00:00
- Reason: User logout
```

---

## Feature Configuration

**Default Settings:**
- **Access Token Expiration**: 24 hours
- **Refresh Token Expiration**: 7 days
- **Token Algorithm**: HS256 (HMAC SHA-256)
- **Token Signing Key**: Django SECRET_KEY
- **Blacklist Enabled**: Yes
- **Token Storage**: Browser localStorage/sessionStorage

**Customizable Settings:**
- Access token expiration time (configurable in settings)
- Refresh token expiration time (configurable in settings)
- Token signing algorithm (HS256 or RS256)
- Blacklist retention period

---

## Using This Feature

### As a User

**What you can do:**
- Receive tokens after login
- Use tokens to access protected features
- Automatically refresh tokens when expired
- Tokens are managed transparently by the app

**Step-by-step:**
1. Log in with email and password
2. System issues access and refresh tokens
3. Tokens are stored in browser
4. Use platform normally
5. Tokens are automatically refreshed when needed
6. Log out when done

**Example:**
```
1. User logs in
2. Receives: access_token (24h) + refresh_token (7d)
3. Uses platform for 12 hours
4. Token still valid, no action needed
5. Uses platform for 25 hours total
6. Access token expired, refresh token used to get new access token
7. User continues without interruption
8. After 7 days, user must log in again
```

---

### As a Developer

**What you can do:**
- Include access token in API requests
- Handle token expiration errors
- Implement token refresh logic
- Validate tokens on backend
- Manage token storage securely

**API Integration:**
```javascript
// Include token in API request
const response = await fetch('/api/projects/my-projects/', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Handle 401 Unauthorized (token expired)
if (response.status === 401) {
  // Refresh token
  const newToken = await refreshAccessToken(refreshToken);
  // Retry request with new token
}
```

---

## Feature Interactions

**Works with:**
- **User Login**: Tokens are issued after successful login
- **API Requests**: Tokens authenticate all protected endpoints
- **Token Refresh**: Refresh token obtains new access token
- **User Logout**: Tokens are blacklisted on logout
- **Role Switching**: Tokens contain user role information

**Conflicts with:**
- **Session-based authentication**: JWT is stateless, not compatible with server-side sessions
- **Cookie-based auth**: Can use cookies for token storage but not recommended

---

## Common Questions

**Q: Why are there two tokens (access and refresh)?**  
A: Access tokens are short-lived for security. If an access token is compromised, it's only valid for 24 hours. Refresh tokens are long-lived to avoid requiring frequent re-login, but they're stored more securely and used less frequently, reducing exposure risk.

**Q: What happens when my access token expires?**  
A: The app automatically uses your refresh token to get a new access token. This happens transparently - you won't notice any interruption. You can continue using the platform without re-logging in.

**Q: How long can I stay logged in?**  
A: You can stay logged in for up to 7 days (the refresh token expiration period). After 7 days, you must log in again. If you use the platform regularly, your refresh token is automatically extended.

**Q: Can someone use my token if they steal it?**  
A: Yes, if someone gets your access token, they can use it for 24 hours. This is why tokens should be stored securely and transmitted over HTTPS only. After 24 hours, the token expires automatically.

**Q: Are my tokens stored securely?**  
A: Tokens are typically stored in browser localStorage or sessionStorage. For maximum security, use HTTP-only cookies which cannot be accessed by JavaScript. The app should use HTTPS to encrypt tokens in transit.

**Q: What's the difference between token expiration and token blacklisting?**  
A: Token expiration is automatic - the token becomes invalid after a set time. Token blacklisting is manual - when you log out, your token is added to a blacklist and becomes invalid immediately, even if not expired.

**Q: Can I log in from multiple devices?**  
A: Yes, each device gets its own set of tokens. Logging out on one device doesn't affect your login on other devices. Each device maintains its own token storage.

**Q: What if I lose my refresh token?**  
A: If you lose your refresh token (e.g., clear browser storage), your access token becomes useless once it expires. You'll need to log in again to get new tokens.

**Q: Can I use the same token on multiple devices?**  
A: Technically yes, but not recommended. Each device should have its own tokens. Sharing tokens between devices increases security risk.

**Q: How do I know if my token is valid?**  
A: The app automatically validates tokens. If a token is invalid or expired, the server returns a 401 Unauthorized response. The app then attempts to refresh the token.

---

## What Can Go Wrong

### Error: Invalid Token
**When it happens**: Token is malformed, corrupted, or tampered with  
**Error message**: "Invalid token" or "401 Unauthorized"  
**What it means**: The token cannot be validated. It may be corrupted or modified.  
**How to fix**:
1. Clear browser storage (localStorage/sessionStorage)
2. Log out and log in again
3. This will generate new valid tokens
4. Try your request again

**Prevention**: Don't modify tokens. Store them securely. Use HTTPS only.

---

### Error: Token Expired
**When it happens**: Access token has been valid for more than 24 hours  
**Error message**: "Token expired" or "401 Unauthorized"  
**What it means**: Your access token is no longer valid. You need a new one.  
**How to fix**:
1. App automatically refreshes token using refresh token
2. If refresh fails, log in again
3. This will generate new tokens

**Prevention**: This is normal. The app handles token refresh automatically.

---

### Error: Refresh Token Expired
**When it happens**: Refresh token has been valid for more than 7 days  
**Error message**: "Refresh token expired" or "401 Unauthorized"  
**What it means**: Your refresh token is no longer valid. You must log in again.  
**How to fix**:
1. Go to login page
2. Log in with email and password
3. New tokens will be generated
4. Try your request again

**Prevention**: Log in at least once every 7 days to maintain session.

---

### Error: Blacklisted Token
**When it happens**: You use a token after logging out  
**Error message**: "Token has been revoked" or "401 Unauthorized"  
**What it means**: Your token was blacklisted when you logged out.  
**How to fix**:
1. Log in again to get new tokens
2. Try your request again

**Prevention**: This is expected behavior. Log out when done using the platform.

---

## Important Rules

### Rule 1: Access Token Expires After 24 Hours
**What it means**: Your access token is only valid for 24 hours. After that, you need a new one.  
**Why it exists**: Short-lived tokens improve security. If a token is compromised, it's only valid for 24 hours.  
**Example**: 
- You log in at 10:00 AM Monday
- Your access token expires at 10:00 AM Tuesday
- After that, you need a new token (obtained via refresh token)

**Exception**: None - all access tokens expire after 24 hours.

---

### Rule 2: Refresh Token Expires After 7 Days
**What it means**: Your refresh token is only valid for 7 days. After that, you must log in again.  
**Why it exists**: Long-lived tokens allow you to stay logged in without re-entering credentials, but they eventually expire for security.  
**Example**: 
- You log in on Monday
- Your refresh token expires the following Monday
- After that, you must log in again

**Exception**: None - all refresh tokens expire after 7 days.

---

### Rule 3: Tokens Must Be Included in Authorization Header
**What it means**: To use protected API endpoints, you must include your access token in the Authorization header.  
**Why it exists**: This is the standard way to authenticate API requests. It ensures only authorized users can access protected resources.  
**Example**: 
```
GET /api/projects/my-projects/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Exception**: Some endpoints (login, register, password reset) don't require tokens.

---

### Rule 4: Tokens Are Blacklisted on Logout
**What it means**: When you log out, your access token is added to a blacklist and becomes invalid.  
**Why it exists**: This ensures that even if someone has your token, they can't use it after you log out.  
**Example**: 
- You log in and receive access token
- You use the platform
- You log out
- Your token is blacklisted
- Even if someone has your token, they can't use it anymore

**Exception**: None - all tokens are blacklisted on logout.

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not support passwordless login** - Tokens are issued after password-based login
- **Does not support biometric authentication** - Tokens are issued after standard login
- **Does not support two-factor authentication** - Tokens are issued after single-factor login
- **Does not persist tokens across browser sessions** - Tokens are cleared when browser closes (if using sessionStorage)

**Alternative Solutions:**
- For **passwordless login**, see Feature_Social_Login (when available)
- For **two-factor authentication**, see Feature_Two_Factor_Authentication (when available)
- For **persistent sessions**, use localStorage instead of sessionStorage

---

## Technical Details

**For Developers:**

**Token Structure:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": 42,
    "email": "marie.dupont@company.fr",
    "role": "seller",
    "iat": 1702000000,
    "exp": 1702086400
  },
  "signature": "cryptographic_signature"
}
```

**API Endpoints:**
- `POST /api/accounts/login/` - Get initial tokens
- `POST /api/accounts/token/refresh/` - Refresh access token
- `POST /api/accounts/logout/` - Blacklist token

**Request Format:**
```bash
curl -H "Authorization: Bearer <access_token>" \
  https://safebill.com/api/projects/my-projects/
```

**Response Format (Token Refresh):**
```json
{
  "access": "new_access_token",
  "refresh": "new_refresh_token"
}
```

**Authentication Required**: Yes (for protected endpoints)  
**Rate Limits**: Token refresh limited to 1 per minute per user

**System Behavior:**
- Tokens are stateless (no server-side session storage)
- Token validation is performed on every request
- Expired tokens are rejected immediately
- Blacklisted tokens are rejected immediately
- Token refresh is transparent to user

---

## Security Considerations

**Security Features:**
- **HMAC Signature**: Tokens are cryptographically signed to prevent tampering
- **Expiration**: Tokens automatically expire to limit exposure window
- **Blacklisting**: Tokens are invalidated on logout
- **HTTPS Only**: Tokens should only be transmitted over HTTPS
- **Secure Storage**: Tokens should be stored in secure browser storage

**User Responsibilities:**
- Don't share your tokens with others
- Don't store tokens in plain text
- Use HTTPS connections only
- Log out when using shared computers
- Clear browser storage if you suspect compromise

**Warnings:**
- ⚠️ Never include tokens in URLs or logs
- ⚠️ Never transmit tokens over HTTP (unencrypted)
- ⚠️ Never share tokens with other users
- ⚠️ Tokens are valid for 24 hours - don't assume they're short-lived

---

## Related Documentation

**Read this first:**
- Flow_User_Login
- Component_Authentication_System_Overview

**Read this next:**
- Feature_Token_Refresh_Mechanism
- Flow_User_Logout

**Related topics:**
- Error_Token_Expiration_Handling
- Policy_Password_Security
- Guide_How_To_Secure_Your_Account

---

## Examples & Use Cases

### Use Case 1: Normal API Request
**Situation**: User is logged in and wants to view their projects  
**Goal**: Retrieve list of user's projects  
**Steps**:
1. User clicks "My Projects" in dashboard
2. App includes access token in request header
3. Server validates token
4. Server returns user's projects
5. App displays projects

**Result**: User sees their projects without re-logging in

---

### Use Case 2: Token Expiration and Refresh
**Situation**: User has been using platform for 25 hours  
**Goal**: Continue using platform without re-logging in  
**Steps**:
1. User makes API request
2. Server returns 401 Unauthorized (access token expired)
3. App automatically uses refresh token to get new access token
4. App retries original request with new token
5. Server processes request successfully
6. User continues without interruption

**Result**: User's session is extended automatically

---

### Use Case 3: Logout and Token Blacklisting
**Situation**: User logs out from their account  
**Goal**: Prevent further use of tokens  
**Steps**:
1. User clicks "Logout" button
2. App sends logout request with access token
3. Server blacklists the token
4. Server returns success response
5. App clears tokens from storage
6. App redirects to login page

**Result**: User is logged out, tokens are invalidated

---

### Use Case 4: Multi-Device Login
**Situation**: User logs in from phone and computer  
**Goal**: Have separate sessions on each device  
**Steps**:
1. User logs in on phone → gets tokens A and B
2. User logs in on computer → gets tokens C and D
3. User uses phone with tokens A and B
4. User uses computer with tokens C and D
5. User logs out on phone → tokens A and B are blacklisted
6. User can still use computer with tokens C and D

**Result**: Each device has independent session

---

## Troubleshooting

### Problem: Tokens Not Stored
**Symptoms**: You log in but immediately get logged out  
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

### Problem: Token Refresh Fails
**Symptoms**: You get "Token expired" error and can't refresh  
**Possible causes**:
1. Refresh token has also expired (after 7 days)
2. Refresh token was blacklisted
3. Server is temporarily unavailable
4. Network connection is lost

**Solutions**:
1. Log in again to get new tokens
2. Check internet connection
3. Wait a few minutes and try again
4. Contact support if problem persists

---

## Glossary

**JWT**: JSON Web Token - a standard format for secure token transmission  
**Access Token**: Short-lived token (24 hours) used to authenticate API requests  
**Refresh Token**: Long-lived token (7 days) used to obtain new access tokens  
**Token Expiration**: The time after which a token is no longer valid  
**Token Blacklist**: A list of tokens that have been revoked and are no longer valid  
**HMAC**: Hash-based Message Authentication Code - cryptographic signature method  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

