---
# Document Identity
doc_id: flow_email_verification_001
title: Email Verification Flow
category: Flow
feature: Email Verification

# Audience & Access
user_roles: All
difficulty: Beginner
prerequisites: [Flow_User_Registration]

# Content Classification
topics: [Email Verification, Account Activation, Email Confirmation, Security]
keywords: [verify email, email confirmation, email verification, activate account]
use_cases: [Account activation, Email confirmation, Email verification]

# Relationships
related_docs: [Flow_User_Registration, Feature_Email_Verification_System, Error_Email_Verification_Errors, Guide_How_To_Verify_Email, Policy_Email_Requirements]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Email Verification Flow

## Document Metadata
- **Feature**: Email Verification
- **Category**: User Flow
- **User Roles**: All
- **Average Duration**: 2-5 minutes
- **Prerequisites**: Registered account, verification email received

---

## Quick Summary

The email verification flow is the process by which users confirm they own the email address they registered with. After registration, users receive a verification email containing a unique link. Clicking this link confirms email ownership and activates the account. This is a mandatory security step that prevents fake accounts and ensures the platform can contact users.

**Key Points:**
- Email verification is mandatory for account activation
- Verification link is sent automatically after registration
- Link expires after 24 hours
- Users can request new verification email if needed
- Account remains inactive until email is verified
- Verification is required before login

---

## When This Applies

**Use this document when:**
- You've just registered and received a verification email
- You need to verify your email address
- Your verification link has expired
- You want to understand the verification process
- You need to troubleshoot verification issues

**Do NOT use this document for:**
- Changing your email address (see Guide_How_To_Change_Email)
- Logging in (see Flow_User_Login)
- Resetting your password (see Flow_Password_Reset)
- Resending verification email (see Guide_How_To_Resend_Verification)

---

## Flow Overview

The email verification flow is simple and straightforward: user receives email, clicks link, email is verified, account is activated.

**Flow Stages:**
1. **Registration Complete** - User completes registration
2. **Verification Email Sent** - System sends verification email
3. **Email Received** - User receives email
4. **Link Clicked** - User clicks verification link
5. **Email Confirmed** - System confirms email ownership
6. **Account Activated** - Account becomes active and usable

**Success Criteria:**
- Verification email is received
- Verification link is valid and not expired
- User can click link without errors
- Email is marked as verified in database
- User can log in to account

---

## Visual Flow Diagram

```
Registration Completed
        ↓
[System Sends Verification Email]
        ↓
[User Receives Email]
        ↓
[User Opens Email]
        ↓
[User Clicks Verification Link]
        ↓
[System Validates Token]
        ↓
[Token Valid & Not Expired?] → NO → [Show Error: Link Expired]
        ↓ YES
[Mark Email as Verified]
        ↓
[Activate Account]
        ↓
[Show Success Message]
        ↓
[User Can Log In]
```

---

## Detailed Steps

### Step 1: Receive Verification Email

**Actor**: System  
**Action**: System automatically sends verification email after registration  
**Input Required**: User email address from registration  
**Validation**: Email service confirms delivery  
**Success Output**: Email delivered to user's inbox  
**Failure Output**: Email delivery failure (user can request resend)

**What you do:**
Nothing - the system automatically sends an email to your registered address.

**What happens:**
Within seconds of completing registration, an email is sent to your inbox. This email contains a verification link and instructions.

**What you see:**
- Email arrives in your inbox (or spam folder)
- Email subject: "Verify Your Safe Bill Account"
- Email contains verification link and instructions

**Technical Details:**
- Verification token generated: 64-character random string
- Token stored in database with 24-hour expiration
- Email sent via Django email backend
- Email template includes user's name and verification link
- Link format: `https://safebill.com/verify-email?token=abc123xyz...`
- Email sent asynchronously via Celery task

**Example Email:**
```
Subject: Verify Your Safe Bill Account

Dear Marie,

Welcome to Safe Bill! To complete your registration, please verify your email address by clicking the link below:

[Verify Email Address]
https://safebill.com/verify-email?token=abc123xyz789...

This link expires in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
Safe Bill Team
```

---

### Step 2: Find Verification Email

**Actor**: User  
**Action**: User locates verification email in inbox  
**Input Required**: Access to email account  
**Validation**: Email is from Safe Bill  
**Success Output**: User finds verification email  
**Failure Output**: Email not found (may be in spam)

**What you do:**
You check your email inbox for the verification message from Safe Bill.

**What happens:**
You look for an email with subject "Verify Your Safe Bill Account" from noreply@safebill.com.

**What you see:**
- Email in inbox with Safe Bill verification
- Or email in spam/junk folder
- Email contains verification link

**Technical Details:**
- Email sent from: noreply@safebill.com
- Email subject: "Verify Your Safe Bill Account"
- Email contains clickable button and URL link
- Email is plain text and HTML formatted

**Troubleshooting:**
- Check spam/junk folder if not in inbox
- Wait 1-2 minutes if email hasn't arrived yet
- Check email address is correct
- Whitelist noreply@safebill.com to prevent spam filtering

---

### Step 3: Click Verification Link

**Actor**: User  
**Action**: User clicks the verification link in the email  
**Input Required**: Valid verification token from email  
**Validation**: Token exists, is valid, and hasn't expired  
**Success Output**: Email is marked as verified, account activated  
**Failure Output**: Error message if token is invalid or expired

**What you do:**
You click the "Verify Email Address" button in the email, or copy-paste the verification link into your browser.

**What happens:**
The system checks if the verification token is valid and hasn't expired. If valid, your email is marked as verified and your account is activated. If invalid or expired, an error is shown.

**What you see:**
- Loading screen while processing
- Success page: "Email verified successfully! You can now log in."
- Or error page if link is invalid/expired

**Technical Details:**
- GET request to `/api/accounts/verify-email/?token=abc123xyz...`
- Server validates:
  - Token exists in database
  - Token hasn't expired (24-hour window)
  - Token is associated with a user account
- If valid:
  - User.is_email_verified = True
  - Verification token deleted
  - User.onboarding_complete = False (for next step)
  - Success response returned
- If invalid/expired:
  - Error response with option to resend verification

**Example Success Response:**
```json
{
  "status": "success",
  "message": "Email verified successfully",
  "user_id": 42,
  "email": "marie.dupont@company.fr",
  "next_step": "onboarding"
}
```

**Example Error Response:**
```json
{
  "status": "error",
  "message": "Verification link has expired",
  "action": "resend_verification"
}
```

---

### Step 4: Email Verification Confirmed

**Actor**: System  
**Action**: System marks email as verified and activates account  
**Input Required**: Valid verification token  
**Validation**: Token is valid and not expired  
**Success Output**: Email verified, account activated  
**Failure Output**: N/A

**What you do:**
Nothing - the system automatically activates your account.

**What happens:**
Your email is marked as verified in the database. Your account status changes from "inactive" to "active". You can now log in.

**What you see:**
- Success message: "Email verified successfully"
- Option to log in or go to dashboard
- Redirect to login page or onboarding page

**Technical Details:**
- Database update: User.is_email_verified = True
- Verification token deleted (can't be reused)
- Account status updated
- User can now authenticate via `/api/accounts/login/`
- JWT tokens can be issued for this user

---

### Step 5: Log In to Account

**Actor**: User  
**Action**: User logs in with verified email and password  
**Input Required**: Email and password  
**Validation**: Credentials validation  
**Success Output**: User is logged in and can access account  
**Failure Output**: N/A

**What you do:**
You go to the login page and log in with your email and password.

**What happens:**
The system validates your credentials. Since your email is now verified, login is successful and you receive JWT tokens.

**What you see:**
- Redirect to dashboard
- Full access to your account

**Technical Details:**
- See Flow_User_Login for detailed login process
- Email verification is now confirmed
- User can access all platform features

---

## Alternative Paths

### Path: Verification Link Expires

**When it happens**: User doesn't click verification link within 24 hours  
**Different steps**:
1. User tries to click old verification link
2. System shows error: "Verification link has expired"
3. User clicks "Resend Verification Email"
4. New verification email is sent
5. User clicks new link to verify

**Outcome**: Email is verified (same as main flow)

---

### Path: Email Already Verified

**When it happens**: User tries to verify email that's already verified  
**Different steps**:
1. User clicks verification link
2. System checks: email is already verified
3. System shows message: "Email is already verified"
4. User can log in

**Outcome**: No action needed, email already verified

---

### Path: Verification Link Clicked Multiple Times

**When it happens**: User clicks same verification link multiple times  
**Different steps**:
1. First click: Email is verified successfully
2. Second click: System shows message "Email already verified"
3. Subsequent clicks: Same message

**Outcome**: Email remains verified, no errors

---

## Success Indicators

- ✅ Verification email is received within 1 minute
- ✅ Email contains valid verification link
- ✅ User can click link without errors
- ✅ Success page is displayed
- ✅ User.is_email_verified = True in database
- ✅ User can log in to account
- ✅ User can access dashboard

---

## Failure Indicators

- ❌ Verification email not received
- ❌ Verification link is invalid or broken
- ❌ Verification link is expired
- ❌ Error page is displayed
- ❌ User cannot log in after verification
- ❌ Account remains inactive

---

## Common Questions

**Q: How long does email verification take?**  
A: Email verification is instant once you click the link. The email itself usually arrives within 1-2 minutes of registration.

**Q: What if I don't receive the verification email?**  
A: Check your spam or junk folder first. If it's not there, wait a few minutes and try requesting a new verification email. If you still don't receive it, contact support.

**Q: How long is the verification link valid?**  
A: The verification link is valid for 24 hours from when the email is sent. After 24 hours, you'll need to request a new verification email.

**Q: Can I log in before verifying my email?**  
A: No, email verification is mandatory. You must verify your email before you can log in to your account.

**Q: What if I entered the wrong email address during registration?**  
A: If you realize your mistake before verifying, you can register again with the correct email address. If you've already verified the wrong email, contact support to change your email address.

**Q: Can I change my email after verification?**  
A: Yes, you can change your email in your profile settings after logging in. You'll need to verify the new email address.

**Q: What if someone else verifies my email?**  
A: They would need to click the verification link in your email. If you suspect unauthorized access, change your password immediately.

**Q: Do I need to verify my email every time I log in?**  
A: No, email verification is a one-time process. Once verified, your email remains verified.

**Q: What happens if I don't verify my email?**  
A: You cannot log in to your account. Your account remains inactive until your email is verified.

**Q: Can I use a temporary email address?**  
A: You can register with any email address, but you must have access to it to verify. We recommend using a permanent email address you have long-term access to.

---

## What Can Go Wrong

### Error: Verification Link Expired
**When it happens**: You try to click the verification link more than 24 hours after registration  
**Error message**: "This verification link has expired. Please request a new one."  
**What it means**: The verification token is no longer valid. You need to request a new verification email.  
**How to fix**:
1. Go to the login page
2. Click "Resend Verification Email"
3. Enter your email address
4. Check your email for the new verification link
5. Click the new link within 24 hours

**Prevention**: Click the verification link within 24 hours of receiving it.

**Example**: You registered on Monday but didn't verify until Wednesday. The link has expired. Solution: Request a new verification email from the login page.

---

### Error: Invalid Verification Link
**When it happens**: The verification link is corrupted or tampered with  
**Error message**: "Invalid verification link. Please request a new one."  
**What it means**: The verification token in the link is not valid or doesn't match any account.  
**How to fix**:
1. Request a new verification email from the login page
2. Make sure you're using the exact link from the email (don't modify it)
3. If the problem persists, contact support

**Prevention**: Don't modify the verification link. Copy it exactly as it appears in the email.

---

### Error: Verification Email Not Received
**When it happens**: You don't receive the verification email after registering  
**Error message**: N/A (you just don't see the email)  
**What it means**: The email either didn't send, was blocked by your email provider, or ended up in spam.  
**How to fix**:
1. Check your spam/junk folder
2. Check your email provider's filters
3. Wait 2-3 minutes (email can be slow)
4. Request a new verification email from the login page
5. If still not received, contact support

**Prevention**: 
- Whitelist noreply@safebill.com in your email provider
- Check that you entered your email correctly
- Use a reliable email provider

**Example**: You registered with marie.dupont@company.fr but the email went to your spam folder. Solution: Check spam folder, mark email as "not spam", and click the verification link.

---

### Error: Email Already Verified
**When it happens**: You try to verify an email that's already verified  
**Error message**: "This email is already verified"  
**What it means**: Your email has already been verified. You can log in to your account.  
**How to fix**:
1. Go to the login page
2. Log in with your email and password
3. You should have full access to your account

**Prevention**: This isn't really an error. Just log in to your account.

---

### Error: Account Not Found
**When it happens**: The verification link is associated with an account that no longer exists  
**Error message**: "Account not found"  
**What it means**: The account associated with this verification link has been deleted or doesn't exist.  
**How to fix**:
1. Register a new account with your email address
2. Verify the new account
3. Contact support if you need to recover the old account

**Prevention**: This is rare. Just register a new account if needed.

---

## Important Rules

### Rule 1: Email Verification Is Mandatory
**What it means**: You cannot use your account until you verify your email address.  
**Why it exists**: Email verification confirms that you own the email address and can receive communications. It prevents fake accounts.  
**Example**: 
- You register with marie.dupont@company.fr
- You receive verification email
- You must click the link to activate your account
- Only then can you log in

**Exception**: None - email verification is required for all accounts.

---

### Rule 2: Verification Link Expires After 24 Hours
**What it means**: The verification link in your email is only valid for 24 hours from when it's sent.  
**Why it exists**: This is a security measure to prevent old links from being used. It ensures timely account activation.  
**Example**: 
- Email sent on Monday at 10:00 AM
- Link is valid until Tuesday at 10:00 AM
- After Tuesday 10:00 AM, link is no longer valid

**Exception**: None - all verification links expire after 24 hours.

---

### Rule 3: Each Email Can Only Be Verified Once
**What it means**: Once an email is verified, it cannot be verified again. It remains verified.  
**Why it exists**: This prevents confusion and ensures email verification status is clear.  
**Example**: 
- You verify marie.dupont@company.fr
- Email remains verified permanently
- You cannot "re-verify" the same email

**Exception**: If you change your email address, the new email must be verified.

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not verify email ownership beyond clicking link** - Clicking the link is the only verification method.
- **Does not send verification via SMS** - Email is the only method.
- **Does not support alternative email addresses** - You must verify the email you registered with.
- **Does not auto-verify after time period** - You must manually click the link.

**Alternative Solutions:**
- For **changing email address**, see Guide_How_To_Change_Email
- For **resending verification email**, see Guide_How_To_Resend_Verification
- For **email recovery**, contact support

---

## Troubleshooting

### Problem: Verification Link Doesn't Work
**Symptoms**: You click the verification link but get an error or blank page  
**Possible causes**:
1. Link was modified or corrupted
2. Link has expired (more than 24 hours old)
3. Browser doesn't have JavaScript enabled
4. Server is temporarily unavailable

**Solutions**:
1. Make sure you're using the exact link from the email (don't modify it)
2. If more than 24 hours have passed, request a new verification email
3. Try a different browser
4. Clear browser cache and try again
5. Contact support if problem persists

---

### Problem: Can't Find Verification Email
**Symptoms**: You registered but don't see the verification email  
**Possible causes**:
1. Email went to spam/junk folder
2. Email is still in transit (can take 1-2 minutes)
3. Email address was entered incorrectly
4. Email provider blocked the message

**Solutions**:
1. Check spam/junk folder first
2. Wait 2-3 minutes for email to arrive
3. Check that you entered email correctly during registration
4. Whitelist noreply@safebill.com in your email provider
5. Request a new verification email from login page
6. Contact support if still not received

---

### Problem: Account Still Inactive After Verification
**Symptoms**: You verified your email but still can't log in  
**Possible causes**:
1. Verification didn't complete successfully
2. Browser cached old account status
3. System error during verification

**Solutions**:
1. Try logging in with your email and password
2. Clear browser cache and cookies
3. Try a different browser
4. Wait 5 minutes and try again
5. Contact support with your email address

---

## Glossary

**Verification Token**: A unique code sent in the verification email that confirms your email ownership  
**Email Verification**: The process of confirming that you own the email address you registered with  
**Account Activation**: The process of making your account active and usable  
**Verification Link**: The clickable link in the verification email that confirms your email  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Flow_User_Registration

**Read this next:**
- Flow_User_Login
- Guide_How_To_Verify_Email

**Related topics:**
- Feature_Email_Verification_System
- Error_Email_Verification_Errors
- Policy_Email_Requirements
- Component_Authentication_System_Overview

