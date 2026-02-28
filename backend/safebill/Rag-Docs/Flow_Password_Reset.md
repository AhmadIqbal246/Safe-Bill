---
# Document Identity
doc_id: flow_password_reset_001
title: Password Reset Flow
category: Flow
feature: Password Reset

# Audience & Access
user_roles: All
difficulty: Beginner
prerequisites: [Flow_User_Registration]

# Content Classification
topics: [Password Reset, Account Recovery, Security, Email Verification]
keywords: [forgot password, reset password, recover account, change password]
use_cases: [Forgotten password recovery, Account access restoration]

# Relationships
related_docs: [Flow_User_Login, Feature_Email_Verification_System, Error_Password_Reset_Errors, Guide_How_To_Reset_Password, Policy_Password_Security]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Password Reset Flow

## Document Metadata
- **Feature**: Password Reset
- **Category**: User Flow
- **User Roles**: All
- **Average Duration**: 5-10 minutes
- **Prerequisites**: Registered account with verified email

---

## Quick Summary

The password reset flow allows users who have forgotten their password to regain access to their account. The process is email-based: user requests a password reset, receives a reset link via email, clicks the link, enters a new password, and confirms the change. This ensures only the account owner (who has access to the registered email) can reset the password.

**Key Points:**
- Password reset is email-based for security
- Reset link expires after 24 hours
- New password must meet security requirements
- Old password is not needed to reset
- Account remains accessible during reset process
- Email verification is required before reset

---

## When This Applies

**Use this document when:**
- You've forgotten your password
- You need to regain access to your account
- You want to understand the password reset process
- You need to troubleshoot reset issues
- You're integrating password reset into your workflow

**Do NOT use this document for:**
- Changing your password while logged in (see Guide_How_To_Change_Password)
- Logging in to your account (see Flow_User_Login)
- Creating a new account (see Flow_User_Registration)
- Securing your account (see Guide_How_To_Secure_Your_Account)

---

## Flow Overview

The password reset flow is a secure, email-based process that allows users to regain access without needing their current password.

**Flow Stages:**
1. **Request Reset** - User requests password reset
2. **Email Verification** - System verifies email exists
3. **Reset Link Sent** - System sends reset link via email
4. **Link Clicked** - User clicks reset link
5. **New Password Entry** - User enters new password
6. **Password Confirmation** - System confirms new password
7. **Access Restored** - User can log in with new password

**Success Criteria:**
- User email is verified
- Reset link is sent and received
- Reset link is valid and not expired
- New password meets security requirements
- User can log in with new password

---

## Visual Flow Diagram

```
User Visits Login Page
        ↓
[Click "Forgot Password?"]
        ↓
[Enter Email Address]
        ↓
[Click "Send Reset Link"]
        ↓
[System Checks Email]
        ↓
[Email Exists & Verified?] → NO → [Show Error]
        ↓ YES
[Generate Reset Token]
        ↓
[Send Reset Email]
        ↓
[User Receives Email]
        ↓
[User Clicks Reset Link]
        ↓
[System Validates Token]
        ↓
[Token Valid & Not Expired?] → NO → [Show Error]
        ↓ YES
[Show Password Reset Form]
        ↓
[User Enters New Password]
        ↓
[System Validates Password]
        ↓
[Password Meets Requirements?] → NO → [Show Error]
        ↓ YES
[Update Password in Database]
        ↓
[Show Success Message]
        ↓
[User Can Log In]
```

---

## Detailed Steps

### Step 1: Request Password Reset

**Actor**: User  
**Action**: User clicks "Forgot Password?" link on login page  
**Input Required**: None (UI navigation)  
**Validation**: None (UI-level routing)  
**Success Output**: Password reset request form is displayed  
**Failure Output**: N/A

**What you do:**
On the login page, you click the "Forgot Password?" link instead of entering your password.

**What happens:**
The system displays a form asking for your email address.

**What you see:**
- Email input field
- "Send Reset Link" button
- "Back to Login" link
- Information: "We'll send you an email with instructions to reset your password"

**Technical Details:**
- Frontend routing to password reset page
- No database operations at this stage
- Form state initialized

---

### Step 2: Enter Email Address

**Actor**: User  
**Action**: User enters their registered email address  
**Input Required**: Email address  
**Validation**: Email format validation  
**Success Output**: Form is ready for submission  
**Failure Output**: Email format error displayed

**What you do:**
You enter the email address associated with your Safe Bill account.

**What happens:**
As you type, the system validates that you've entered a valid email format. The "Send Reset Link" button becomes enabled when a valid email is entered.

**What you see:**
- Email field with your typed email
- Green checkmark if email format is valid
- Red error if email format is invalid
- "Send Reset Link" button (enabled when valid)

**Technical Details:**
- Client-side email format validation
- Email format checked using regex
- No server communication at this stage

**Example:**
```
Email: marie.dupont@company.fr
```

---

### Step 3: Submit Reset Request

**Actor**: User  
**Action**: User clicks "Send Reset Link" button  
**Input Required**: Valid email address  
**Validation**: Server-side email verification  
**Success Output**: Reset email sent, confirmation message displayed  
**Failure Output**: Error message if email not found

**What you do:**
After entering your email, you click the "Send Reset Link" button.

**What happens:**
The system checks if the email exists in the database and is verified. If it does, a password reset token is generated and a reset email is sent. If it doesn't exist, an error is shown.

**What you see:**
- Loading spinner while processing
- Success message: "Check your email for password reset instructions"
- Or error message if email not found

**Technical Details:**
- POST request to `/api/accounts/password-reset-request/`
- Server validates:
  - Email exists in database
  - Email is verified (is_email_verified = True)
  - Account is active (not deleted)
- If valid:
  - Reset token generated (64-character random string)
  - Token stored in database with 24-hour expiration
  - Reset email sent asynchronously
- If invalid:
  - Generic error returned (doesn't reveal if email exists)

**Example Request:**
```json
{
  "email": "marie.dupont@company.fr"
}
```

**Example Response (Success):**
```json
{
  "status": "success",
  "message": "Password reset link sent to your email"
}
```

---

### Step 4: Receive Reset Email

**Actor**: System  
**Action**: System sends password reset email to user's email address  
**Input Required**: User email address  
**Validation**: Email service confirms delivery  
**Success Output**: Email delivered to user's inbox  
**Failure Output**: Email delivery failure (user can request resend)

**What you do:**
Nothing - the system automatically sends an email to your registered email address.

**What happens:**
Within seconds of requesting the reset, an email is sent to your inbox containing a password reset link. This link is unique and expires after 24 hours.

**What you see:**
- Email subject: "Reset Your Safe Bill Password"
- Email body contains:
  - Reset link (clickable button or URL)
  - Expiration notice (24 hours)
  - Instructions if link doesn't work
  - Security notice: "If you didn't request this, ignore this email"

**Technical Details:**
- Reset token generated: 64-character random string
- Token stored in database with expiration time (24 hours from creation)
- Email sent via Django email backend
- Email template includes reset link
- Link format: `https://safebill.com/reset-password?token=abc123xyz...`

**Example Email:**
```
Subject: Reset Your Safe Bill Password

Hello Marie,

We received a request to reset your password. Click the link below to create a new password:

[Reset Password]
https://safebill.com/reset-password?token=abc123xyz789...

This link expires in 24 hours.

If you didn't request this, please ignore this email. Your password will remain unchanged.

Best regards,
Safe Bill Team
```

---

### Step 5: Click Reset Link

**Actor**: User  
**Action**: User clicks the password reset link in the email  
**Input Required**: Valid reset token from email  
**Validation**: Token exists, is valid, and hasn't expired  
**Success Output**: Password reset form is displayed  
**Failure Output**: Error message if token is invalid or expired

**What you do:**
You open the email and click the "Reset Password" button or copy-paste the reset link into your browser.

**What happens:**
The system validates the reset token. If it's valid and hasn't expired, the password reset form is displayed. If it's invalid or expired, an error is shown.

**What you see:**
- Password reset form with:
  - New password field
  - Confirm password field
  - Password requirements listed
  - "Reset Password" button
- Or error page if link is invalid/expired

**Technical Details:**
- GET request to `/api/accounts/password-reset-confirm/?token=abc123xyz...`
- Server validates:
  - Token exists in database
  - Token hasn't expired (24-hour window)
  - Token is associated with a user account
- If valid:
  - Frontend displays password reset form
  - Token is stored in form state for next step
- If invalid/expired:
  - Error response with option to request new reset link

---

### Step 6: Enter New Password

**Actor**: User  
**Action**: User enters new password and confirms it  
**Input Required**: 
- New password (must meet security requirements)
- Confirm password (must match new password)

**Validation**: Client-side password validation  
**Success Output**: Form is ready for submission  
**Failure Output**: Password validation errors displayed

**What you do:**
You enter your new password in both fields. The system shows you the password requirements and validates as you type.

**What happens:**
As you type, the system checks:
- Password length (minimum 8 characters)
- Uppercase letters (at least one)
- Lowercase letters (at least one)
- Numbers (at least one)
- Special characters (at least one)
- Passwords match (new password = confirm password)

**What you see:**
- Password requirements checklist with checkmarks/crosses
- Green checkmarks for met requirements
- Red X for unmet requirements
- Error message if passwords don't match
- "Reset Password" button (enabled when all requirements met)

**Technical Details:**
- Client-side password strength validation
- Password strength checker validates requirements
- Confirm password comparison
- Password visibility toggle (show/hide)
- No server communication at this stage

**Example:**
```
New Password: SecurePass123!
Confirm Password: SecurePass123!

Requirements:
✓ At least 8 characters
✓ Contains uppercase letter
✓ Contains lowercase letter
✓ Contains number
✓ Contains special character
✓ Passwords match
```

---

### Step 7: Submit New Password

**Actor**: User  
**Action**: User clicks "Reset Password" button to confirm new password  
**Input Required**: Valid new password and reset token  
**Validation**: Server-side password validation  
**Success Output**: Password updated, success message displayed  
**Failure Output**: Error message if something goes wrong

**What you do:**
After entering your new password and confirming it, you click the "Reset Password" button.

**What happens:**
The system validates the new password and reset token. If both are valid, the password is updated in the database. If something is invalid, an error is shown.

**What you see:**
- Loading spinner while processing
- Success message: "Password reset successfully. You can now log in with your new password."
- Or error message if something went wrong

**Technical Details:**
- POST request to `/api/accounts/password-reset-confirm/`
- Server validates:
  - Reset token is valid and not expired
  - New password meets security requirements
  - Token is associated with a user account
- If valid:
  - User password hashed and updated in database
  - Reset token deleted (can't be reused)
  - User is logged out of all sessions (for security)
  - Success response returned
- If invalid:
  - Error response with explanation

**Example Request:**
```json
{
  "token": "abc123xyz789...",
  "password": "NewSecurePass456!",
  "password_confirm": "NewSecurePass456!"
}
```

**Example Response (Success):**
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

---

### Step 8: Log In with New Password

**Actor**: User  
**Action**: User logs in with new password  
**Input Required**: Email and new password  
**Validation**: Credentials validation  
**Success Output**: User is logged in and can access account  
**Failure Output**: N/A

**What you do:**
You go to the login page and log in with your email and new password.

**What happens:**
The system validates your credentials and issues JWT tokens. You can now access your account.

**What you see:**
- Redirect to dashboard
- Full access to your account

**Technical Details:**
- See Flow_User_Login for detailed login process
- Password reset doesn't automatically log user in
- User must manually log in with new credentials

---

## Alternative Paths

### Path: Reset Link Expires

**When it happens**: User doesn't click reset link within 24 hours  
**Different steps**:
1. User tries to click old reset link
2. System shows error: "Reset link has expired"
3. User clicks "Request new reset link"
4. New reset email is sent
5. User clicks new link to reset password

**Outcome**: Password is reset (same as main flow)

---

### Path: Email Not Verified

**When it happens**: User tries to reset password but email isn't verified  
**Different steps**:
1. User requests password reset
2. System checks: is_email_verified = False
3. System shows error: "Please verify your email before resetting password"
4. User clicks "Send verification email"
5. User verifies email
6. User can now reset password

**Outcome**: User must verify email first

---

### Path: Email Not Found

**When it happens**: User enters an email that's not registered  
**Different steps**:
1. User enters email that doesn't exist
2. System shows generic error: "If that email exists, we've sent a reset link"
3. User checks email (won't receive anything)
4. User can try different email or register new account

**Outcome**: No reset link is sent (for security)

---

## Success Indicators

- ✅ Reset request is submitted
- ✅ Reset email is received within 1 minute
- ✅ Email contains valid reset link
- ✅ User can click link and see reset form
- ✅ New password meets security requirements
- ✅ Password is updated in database
- ✅ User can log in with new password
- ✅ Old password no longer works

---

## Failure Indicators

- ❌ Reset request form shows validation errors
- ❌ "Email not found" error appears
- ❌ Reset email not received
- ❌ Reset link is invalid or expired
- ❌ New password doesn't meet requirements
- ❌ Password update fails
- ❌ User cannot log in with new password

---

## Common Questions

**Q: How long does password reset take?**  
A: The entire process takes 5-10 minutes. Most of this time is waiting for the email to arrive (usually 1-2 minutes) and entering your new password.

**Q: What if I don't receive the reset email?**  
A: Check your spam or junk folder first. If it's not there, wait a few minutes and try requesting a new reset link. If you still don't receive it, contact support.

**Q: How long is the reset link valid?**  
A: The reset link is valid for 24 hours from when the email is sent. After 24 hours, you'll need to request a new reset link.

**Q: Can I reset my password without email access?**  
A: No, password reset is email-based for security. If you don't have access to your registered email, contact support for account recovery options.

**Q: What if I reset my password but then remember my old password?**  
A: Your old password no longer works. You can only log in with your new password. If you want to change it again, use the password reset flow.

**Q: Will resetting my password log me out?**  
A: Yes, for security, resetting your password logs you out of all active sessions. You'll need to log in again with your new password.

**Q: Can I reset my password while logged in?**  
A: No, password reset is for when you've forgotten your password. If you're logged in and want to change your password, see Guide_How_To_Change_Password.

**Q: What if someone else resets my password?**  
A: They would need access to your email address. If you suspect unauthorized access, change your password immediately and secure your email account.

**Q: Can I use my old password again after resetting?**  
A: No, you cannot reuse old passwords. You must create a new password that meets the security requirements.

**Q: What happens to my data when I reset my password?**  
A: Your data is not affected. Resetting your password only changes your login credentials. All your projects, messages, and account information remain the same.

---

## What Can Go Wrong

### Error: Email Not Found
**When it happens**: You enter an email that's not registered on Safe Bill  
**Error message**: "If that email exists, we've sent a reset link"  
**What it means**: The email you entered is not associated with any Safe Bill account. This message is generic for security (doesn't reveal if email exists).  
**How to fix**:
1. Double-check the email address for typos
2. Try other email addresses you might have used
3. If you don't have an account, register instead
4. Contact support if you need help

**Prevention**: Use the email address you registered with. If you've changed emails, contact support.

**Example**: You try to reset with marie.dupont@personal.fr but you registered with marie.dupont@company.fr. Solution: Use the correct email address.

---

### Error: Email Not Verified
**When it happens**: You try to reset password but haven't verified your email yet  
**Error message**: "Please verify your email before resetting your password"  
**What it means**: Your account exists but your email hasn't been confirmed. You need to verify your email first.  
**How to fix**:
1. Check your email for the verification message from registration
2. Click the verification link in that email
3. If you don't see it, request a new verification email
4. After verification, you can reset your password

**Prevention**: Verify your email immediately after registration.

---

### Error: Reset Link Expired
**When it happens**: You try to click the reset link more than 24 hours after requesting it  
**Error message**: "This reset link has expired. Please request a new one."  
**What it means**: The reset token is no longer valid. You need to request a new reset link.  
**How to fix**:
1. Go to the login page
2. Click "Forgot Password?"
3. Enter your email address
4. Click "Send Reset Link"
5. Check your email for the new reset link
6. Click the new link within 24 hours

**Prevention**: Click the reset link within 24 hours of receiving it.

---

### Error: Invalid Reset Link
**When it happens**: The reset link is corrupted or tampered with  
**Error message**: "Invalid reset link. Please request a new one."  
**What it means**: The reset token in the link is not valid or doesn't match any account.  
**How to fix**:
1. Request a new reset link from the login page
2. Make sure you're using the exact link from the email (don't modify it)
3. If the problem persists, contact support

**Prevention**: Don't modify the reset link. Copy it exactly as it appears in the email.

---

### Error: Password Doesn't Meet Requirements
**When it happens**: Your new password is too weak  
**Error message**: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"  
**What it means**: Your new password doesn't meet security requirements.  
**How to fix**:
1. Make password at least 8 characters long
2. Add at least one uppercase letter (A-Z)
3. Add at least one lowercase letter (a-z)
4. Add at least one number (0-9)
5. Add at least one special character (!@#$%^&*)

**Prevention**: Create a strong password from the start.

**Example**:
- ❌ Weak: `password123`
- ✅ Strong: `NewSecurePass456!`

---

### Error: Passwords Don't Match
**When it happens**: Your new password and confirm password fields don't match  
**Error message**: "Passwords do not match"  
**What it means**: You entered different values in the password and confirm password fields.  
**How to fix**:
1. Make sure both fields contain exactly the same password
2. Check for typos or extra spaces
3. Use the show/hide button to verify what you've typed
4. Try again

**Prevention**: Type carefully and use the show/hide button to verify.

---

### Error: Reset Email Not Received
**When it happens**: You don't receive the reset email after requesting it  
**Error message**: N/A (you just don't see the email)  
**What it means**: The email either didn't send, was blocked, or ended up in spam.  
**How to fix**:
1. Check your spam/junk folder
2. Wait 2-3 minutes (email can be slow)
3. Request a new reset link
4. If still not received, contact support

**Prevention**: Whitelist noreply@safebill.com in your email provider.

---

## Important Rules

### Rule 1: Reset Link Expires After 24 Hours
**What it means**: The password reset link in your email is only valid for 24 hours from when it's sent.  
**Why it exists**: This is a security measure to prevent old links from being used. It ensures timely password changes.  
**Example**: 
- Email sent on Monday at 10:00 AM
- Link is valid until Tuesday at 10:00 AM
- After Tuesday 10:00 AM, link is no longer valid

**Exception**: None - all reset links expire after 24 hours.

---

### Rule 2: New Password Must Meet Security Requirements
**What it means**: Your new password must be at least 8 characters and contain uppercase, lowercase, number, and special character.  
**Why it exists**: Strong passwords protect your account from unauthorized access.  
**Example**: 
- ✅ SecurePass123!
- ❌ password123

**Exception**: None - all passwords must meet these requirements.

---

### Rule 3: Password Reset Logs Out All Sessions
**What it means**: When you reset your password, you're automatically logged out of all devices.  
**Why it exists**: This is a security measure. If your account was compromised, logging out everywhere prevents unauthorized access.  
**Example**: 
- You're logged in on your phone and computer
- You reset your password
- You're logged out on both devices
- You must log in again with new password

**Exception**: None - password reset always logs out all sessions.

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not allow password reset without email** - Reset is email-based only. If you don't have email access, contact support.
- **Does not allow password reset while logged in** - Use Change Password feature instead (see Guide_How_To_Change_Password).
- **Does not support security questions** - Reset is email-based only.
- **Does not send reset link via SMS** - Email is the only method.

**Alternative Solutions:**
- For **changing password while logged in**, see Guide_How_To_Change_Password
- For **account recovery without email**, contact support
- For **two-factor authentication**, see Feature_Two_Factor_Authentication (when available)

---

## Troubleshooting

### Problem: Reset Form Won't Submit
**Symptoms**: You click "Reset Password" but nothing happens  
**Possible causes**:
1. Internet connection is unstable
2. Browser has JavaScript disabled
3. Password doesn't meet requirements
4. Passwords don't match

**Solutions**:
1. Check your internet connection
2. Enable JavaScript in browser settings
3. Verify password meets all requirements
4. Verify passwords match exactly
5. Try a different browser
6. Clear browser cache and try again

---

### Problem: Can't Find Reset Email
**Symptoms**: You requested reset but don't see the email  
**Possible causes**:
1. Email went to spam/junk folder
2. Email is still in transit
3. Email address was entered incorrectly
4. Email provider blocked the message

**Solutions**:
1. Check spam/junk folder
2. Wait 2-3 minutes for email to arrive
3. Verify email address is correct
4. Whitelist noreply@safebill.com
5. Request a new reset link
6. Contact support if still not received

---

## Glossary

**Reset Token**: A unique code sent in the reset email that confirms your identity  
**Password Hash**: An encrypted version of your password stored in the database  
**Security Requirements**: Rules that passwords must follow (length, characters, etc.)  
**Email Verification**: Confirming that you own the email address  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Flow_User_Registration
- Flow_User_Login

**Read this next:**
- Guide_How_To_Reset_Password
- Guide_How_To_Change_Password

**Related topics:**
- Error_Password_Reset_Errors
- Feature_Email_Verification_System
- Policy_Password_Security
- Component_Authentication_System_Overview

