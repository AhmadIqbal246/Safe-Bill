---
# Document Identity
doc_id: flow_user_registration_001
title: User Registration Flow
category: Flow
feature: User Registration

# Audience & Access
user_roles: All
difficulty: Beginner
prerequisites: []

# Content Classification
topics: [Registration, Account Creation, User Onboarding, Email Verification]
keywords: [register, signup, create account, seller registration, buyer registration]
use_cases: [New seller joining platform, New buyer joining platform, Account creation]

# Relationships
related_docs: [Flow_Email_Verification, Flow_User_Login, Feature_Email_Verification_System, Error_Registration_Errors, Guide_How_To_Create_Account, Policy_Email_Requirements, Policy_Password_Security]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# User Registration Flow

## Document Metadata
- **Feature**: User Registration
- **Category**: User Flow
- **User Roles**: All (Seller, Buyer, Professional Buyer)
- **Average Duration**: 5-10 minutes
- **Prerequisites**: Valid email address, internet connection

---

## Quick Summary

The user registration flow is the process by which new users create accounts on the Safe Bill platform. There are two main registration paths: **Seller Registration** (for service providers) and **Buyer Registration** (for clients). Both paths require email verification before the account becomes fully active. The system validates all input data, checks for duplicate emails, and sends a verification email to confirm the user's email address.

**Key Points:**
- Two separate registration paths: Seller and Buyer
- Email verification is mandatory for account activation
- Password must meet security requirements
- SIRET verification required for sellers (French business ID)
- Account is created but inactive until email is verified

---

## When This Applies

**Use this document when:**
- You're creating a new seller account
- You're creating a new buyer account
- You want to understand the complete registration process
- You need to troubleshoot registration issues
- You're integrating registration into your workflow

**Do NOT use this document for:**
- Logging in to an existing account (see Flow_User_Login)
- Resetting a forgotten password (see Flow_Password_Reset)
- Verifying your email (see Flow_Email_Verification)
- Changing account details (see Guide_How_To_Update_Profile)

---

## Flow Overview

The registration flow consists of two distinct paths based on user type, but both follow the same core validation and verification process.

**Flow Stages:**
1. **Path Selection** - User chooses Seller or Buyer registration
2. **Data Entry** - User enters registration information
3. **Validation** - System validates all input data
4. **Account Creation** - System creates user account (inactive)
5. **Email Verification** - System sends verification email
6. **Email Confirmation** - User clicks verification link
7. **Account Activation** - Account becomes active and usable

**Success Criteria:**
- User account is created in the database
- Email is verified and confirmed
- User can log in with credentials
- User profile is accessible
- User can proceed to onboarding

---

## Visual Flow Diagram

```
User Visits Platform
        ↓
[Choose Registration Type]
        ↓
    ┌───┴───┐
    ↓       ↓
[Seller] [Buyer]
    ↓       ↓
[Enter Details] → [System Validates]
    ↓
[Email Exists?] → YES → [Show Error: Email Already Registered]
    ↓ NO
[Create Account] (Status: Inactive)
    ↓
[Send Verification Email]
    ↓
[User Receives Email]
    ↓
[User Clicks Verification Link]
    ↓
[System Confirms Email]
    ↓
[Account Activated]
    ↓
[User Can Log In]
```

---

## Detailed Steps

### Step 1: Choose Registration Type

**Actor**: User  
**Action**: User selects whether to register as Seller or Buyer  
**Input Required**: None (UI selection)  
**Validation**: None (UI-level routing)  
**Success Output**: User is directed to appropriate registration form  
**Failure Output**: N/A

**What you do:**
On the registration page, you see two options: "Register as Seller" or "Register as Buyer". You click the option that matches your role.

**What happens:**
The system loads the appropriate registration form with fields specific to your role.

**What you see:**
- For Sellers: Fields for company name, SIRET number, business address, service categories
- For Buyers: Fields for first name, last name, address

**Technical Details:**
- Frontend routing to `/seller-register` or `/buyer-register`
- No database operations at this stage
- Form state initialized based on selected role

**Example:**
You are a freelance electrician wanting to offer services. You click "Register as Seller" and see fields for company information.

---

### Step 2: Enter Registration Information

**Actor**: User  
**Action**: User fills out registration form with required information  
**Input Required**: 
- Email address (all users)
- Password (all users)
- First name (buyers) or Company name (sellers)
- Last name (buyers) or SIRET number (sellers)
- Address information
- Service categories (sellers only)

**Validation**: Client-side validation performed as user types  
**Success Output**: Form is ready for submission  
**Failure Output**: Validation errors displayed inline

**What you do:**
You fill in all required fields marked with an asterisk (*). For sellers, you enter your company details and select your service categories. For buyers, you enter your personal information.

**What happens:**
As you type, the system checks each field for basic validity (email format, password strength, etc.). Invalid entries show error messages immediately.

**What you see:**
- Green checkmarks next to valid fields
- Red error messages for invalid entries
- Submit button becomes enabled when all required fields are valid

**Technical Details:**
- Frontend validation using form libraries
- Password strength checker validates requirements
- Email format validation using regex
- SIRET format validation for sellers
- Service category selection from predefined list

**Example - Seller Registration:**
```
Email: marie.dupont@company.fr
Password: SecurePass123!
Company Name: Dupont Electrical Services
SIRET: 12345678901234
Address: 123 Rue de Paris, 75001 Paris
Service Categories: Electrical Work, Maintenance
```

**Example - Buyer Registration:**
```
Email: john.smith@company.com
Password: BuyerPass456!
First Name: John
Last Name: Smith
Address: 456 Business Ave, London
```

---

### Step 3: Submit Registration Form

**Actor**: User  
**Action**: User clicks the "Register" or "Create Account" button  
**Input Required**: All form fields completed  
**Validation**: Server-side validation of all data  
**Success Output**: Account created, verification email sent  
**Failure Output**: Error message explaining what went wrong

**What you do:**
After filling in all required information, you click the "Register" or "Create Account" button.

**What happens:**
The system sends your information to the server, which performs comprehensive validation. If validation passes, your account is created. If validation fails, you see specific error messages.

**What you see:**
- Loading spinner while processing
- Success message: "Account created! Check your email for verification link"
- Or error message if something went wrong

**Technical Details:**
- POST request to `/api/accounts/seller-register/` or `/api/accounts/buyer-register/`
- Server validates:
  - Email format and uniqueness
  - Password meets security requirements
  - Required fields are not empty
  - SIRET is valid format (sellers)
  - No duplicate email exists in database
- User object created with status `is_email_verified = False`
- Verification token generated and stored
- Email sent asynchronously via Celery task

**Example Request:**
```json
{
  "email": "marie.dupont@company.fr",
  "password": "SecurePass123!",
  "first_name": "Marie",
  "last_name": "Dupont",
  "company_name": "Dupont Electrical",
  "siret_number": "12345678901234",
  "address": "123 Rue de Paris, 75001 Paris",
  "selected_categories": ["electrical", "maintenance"]
}
```

**Example Response (Success):**
```json
{
  "status": "success",
  "message": "Account created successfully. Please verify your email.",
  "user_id": 42,
  "email": "marie.dupont@company.fr",
  "role": "seller"
}
```

---

### Step 4: Receive Verification Email

**Actor**: System  
**Action**: System sends verification email to user's email address  
**Input Required**: User email address  
**Validation**: Email service confirms delivery  
**Success Output**: Email delivered to user's inbox  
**Failure Output**: Email delivery failure (user can request resend)

**What you do:**
Nothing - the system automatically sends an email to your registered email address.

**What happens:**
Within seconds of registration, an email is sent to your inbox containing a verification link. This link is unique to your account and expires after 24 hours.

**What you see:**
- Email subject: "Verify Your Safe Bill Account"
- Email body contains:
  - Welcome message
  - Verification link (clickable button or URL)
  - Expiration notice (24 hours)
  - Instructions if link doesn't work

**Technical Details:**
- Verification token generated: 64-character random string
- Token stored in database with expiration time (24 hours from creation)
- Email sent via Django email backend
- Email template includes user's name and verification link
- Link format: `https://safebill.com/verify-email?token=abc123xyz...`

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

### Step 5: Click Verification Link

**Actor**: User  
**Action**: User clicks the verification link in the email  
**Input Required**: Valid verification token from email  
**Validation**: Token exists, is valid, and hasn't expired  
**Success Output**: Email is marked as verified, account activated  
**Failure Output**: Error message if token is invalid or expired

**What you do:**
You open the email and click the "Verify Email Address" button or copy-paste the verification link into your browser.

**What happens:**
The system checks if the verification token is valid and hasn't expired. If valid, your email is marked as verified and your account is activated. You can now log in.

**What you see:**
- Success page: "Email verified successfully! You can now log in."
- Or error page if the link is invalid/expired with option to request a new verification email

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

---

### Step 6: Account Activation Complete

**Actor**: System  
**Action**: Account is now fully active and ready to use  
**Input Required**: Verified email  
**Validation**: Email verification confirmed  
**Success Output**: User can log in and access platform  
**Failure Output**: N/A

**What you do:**
Nothing - your account is automatically activated.

**What happens:**
Your account status changes from "inactive" to "active". You can now log in with your email and password.

**What you see:**
- Confirmation message on verification page
- Option to log in or go to dashboard
- Redirect to login page or onboarding page

**Technical Details:**
- Account status updated in database
- User can now authenticate via `/api/accounts/login/`
- JWT tokens can be issued for this user
- User profile is accessible
- Next step is onboarding (role-specific setup)

---

## Alternative Paths

### Path: Email Verification Link Expires

**When it happens**: User doesn't click verification link within 24 hours  
**Different steps**: 
1. User tries to click old verification link
2. System shows error: "Verification link has expired"
3. User clicks "Resend Verification Email"
4. New verification email is sent
5. User clicks new link to verify

**Outcome**: Email is verified, account activated (same as main flow)

**How to avoid**: Click verification link within 24 hours of receiving it

---

### Path: Email Already Exists

**When it happens**: User tries to register with an email that's already registered  
**Different steps**:
1. User enters email that already exists
2. System shows error: "This email is already registered"
3. User has options:
   - Use a different email address
   - Click "Already have an account? Log in"
   - Click "Forgot password?" if they forgot their password

**Outcome**: Registration is not completed, user must use different email or log in

---

### Path: Password Doesn't Meet Requirements

**When it happens**: User enters a password that's too weak  
**Different steps**:
1. User enters weak password (e.g., "123456")
2. System shows error: "Password must contain uppercase, lowercase, number, and special character"
3. User enters stronger password
4. Validation passes, registration continues

**Outcome**: Registration proceeds with valid password

---

## Success Indicators

- ✅ Account is created in the database
- ✅ User receives verification email within 1 minute
- ✅ Email contains valid verification link
- ✅ User can click link and verify email
- ✅ User.is_email_verified = True in database
- ✅ User can log in with registered credentials
- ✅ User profile is accessible
- ✅ User can proceed to onboarding

---

## Failure Indicators

- ❌ Registration form shows validation errors
- ❌ "Email already registered" error appears
- ❌ Verification email not received
- ❌ Verification link is invalid or expired
- ❌ User cannot log in after verification
- ❌ Account remains inactive after email verification

---

## Common Questions

**Q: How long does registration take?**  
A: The registration process typically takes 5-10 minutes. Most of this time is spent filling out your information. The system processes your registration instantly once you submit the form.

**Q: What if I don't receive the verification email?**  
A: Check your spam or junk folder first. If it's not there, you can request a new verification email from the login page by clicking "Resend Verification Email". The new email will arrive within 1-2 minutes.

**Q: Can I register with a business email?**  
A: Yes, you can use any valid email address - personal, business, or shared. The email must be unique (not already registered on Safe Bill).

**Q: What if I enter the wrong email address?**  
A: If you realize your mistake before clicking the verification link, you can register again with the correct email address. If you've already verified the wrong email, contact support to change your email address.

**Q: How long is the verification link valid?**  
A: The verification link is valid for 24 hours from when the email is sent. After 24 hours, you'll need to request a new verification email.

**Q: What are the password requirements?**  
A: Your password must be at least 8 characters long and contain: one uppercase letter, one lowercase letter, one number, and one special character (e.g., !@#$%^&*).

**Q: Can I change my email after registration?**  
A: Yes, you can change your email in your profile settings after logging in. You'll need to verify the new email address.

**Q: What's the difference between Seller and Buyer registration?**  
A: Seller registration requires business information (company name, SIRET number, service categories). Buyer registration only requires basic personal information. You can have both roles on the same account.

**Q: Do I need to verify my email immediately?**  
A: No, but you won't be able to log in until your email is verified. We recommend verifying within 24 hours while the link is still valid.

**Q: Can I register multiple accounts?**  
A: You can register multiple accounts with different email addresses. However, each account must use a unique email address.

---

## What Can Go Wrong

### Error: Email Already Registered
**When it happens**: You try to register with an email that's already associated with another account  
**Error message**: "This email address is already registered. Please use a different email or log in to your existing account."  
**What it means**: The email you entered is already in the system. Either you already have an account, or someone else registered with this email.  
**How to fix**:
1. If you already have an account, log in instead of registering
2. If you forgot your password, use the password reset flow
3. If you want a new account, use a different email address
4. If someone else registered with your email, contact support

**Prevention**: Use an email address you haven't used before on Safe Bill. Check your existing accounts before registering.

**Example**: You try to register with marie.dupont@company.fr, but you already registered with this email last month. Solution: Log in with your existing account instead.

---

### Error: Invalid Email Format
**When it happens**: You enter an email address that doesn't match the standard email format  
**Error message**: "Please enter a valid email address (e.g., name@example.com)"  
**What it means**: Your email doesn't follow the standard format. It might be missing the @ symbol, domain, or have invalid characters.  
**How to fix**:
1. Check that your email has the format: `name@domain.com`
2. Ensure there's exactly one @ symbol
3. Ensure there's a dot (.) in the domain part
4. Remove any spaces or special characters

**Prevention**: Use a standard email format. Most email providers use the format `firstname.lastname@company.com`.

**Example**: 
- ❌ Invalid: `marie.dupont@` (missing domain)
- ❌ Invalid: `mariedupont.company.fr` (missing @)
- ✅ Valid: `marie.dupont@company.fr`

---

### Error: Password Too Weak
**When it happens**: Your password doesn't meet the security requirements  
**Error message**: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"  
**What it means**: Your password is too simple and doesn't meet security standards.  
**How to fix**:
1. Make password at least 8 characters long
2. Add at least one uppercase letter (A-Z)
3. Add at least one lowercase letter (a-z)
4. Add at least one number (0-9)
5. Add at least one special character (!@#$%^&*)

**Prevention**: Create a strong password from the start. Use a mix of character types.

**Example**:
- ❌ Weak: `password123` (no uppercase, no special character)
- ❌ Weak: `Pass123` (only 7 characters)
- ✅ Strong: `SecurePass123!`
- ✅ Strong: `MyBusiness@2024`

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

### Error: Invalid Verification Token
**When it happens**: The verification link is corrupted or tampered with  
**Error message**: "Invalid verification link. Please request a new one."  
**What it means**: The verification token in the link is not valid or doesn't match any account.  
**How to fix**:
1. Request a new verification email from the login page
2. Make sure you're using the exact link from the email (don't modify it)
3. If the problem persists, contact support

**Prevention**: Don't modify the verification link. Copy it exactly as it appears in the email.

---

### Error: SIRET Verification Failed (Sellers Only)
**When it happens**: Your SIRET number is invalid or doesn't match your company name  
**Error message**: "SIRET number is invalid or doesn't match company records"  
**What it means**: The SIRET you entered doesn't exist or doesn't correspond to the company name you provided.  
**How to fix**:
1. Verify your SIRET number is correct (14 digits)
2. Ensure company name matches official business records
3. Check for typos in both fields
4. If SIRET is correct but system rejects it, contact support

**Prevention**: Double-check your SIRET number before registering. Get it from official business documents.

**Example**: You enter SIRET "12345678901234" but company name is "Dupont Services" when official name is "Dupont Electrical Services". Solution: Use the official company name.

---

## Important Rules

### Rule 1: Email Must Be Unique
**What it means**: Each email address can only be registered once on Safe Bill. You cannot have two accounts with the same email.  
**Why it exists**: Email is the unique identifier for your account. It ensures each person has only one primary account and prevents account duplication.  
**Example**: 
- ✅ You register with marie.dupont@company.fr
- ❌ You cannot register again with marie.dupont@company.fr
- ✅ You can register a second account with marie.dupont.pro@company.fr

**Exception**: If you have an old account you no longer use, contact support to delete it, then you can register with that email again.

---

### Rule 2: Email Verification Is Mandatory
**What it means**: You cannot use your account until you verify your email address.  
**Why it exists**: Email verification confirms that you own the email address and can receive communications. It prevents fake accounts and ensures we can contact you.  
**Example**: 
- You register with marie.dupont@company.fr
- You receive verification email
- You must click the link to activate your account
- Only then can you log in

**Exception**: None - email verification is required for all accounts.

---

### Rule 3: Verification Link Expires After 24 Hours
**What it means**: The verification link in your email is only valid for 24 hours from when it's sent.  
**Why it exists**: This is a security measure to prevent old links from being used to verify accounts. It ensures timely account activation.  
**Example**: 
- Email sent on Monday at 10:00 AM
- Link is valid until Tuesday at 10:00 AM
- After Tuesday 10:00 AM, link is no longer valid
- You must request a new verification email

**Exception**: None - all verification links expire after 24 hours.

---

### Rule 4: Password Must Meet Security Requirements
**What it means**: Your password must be at least 8 characters and contain uppercase, lowercase, number, and special character.  
**Why it exists**: Strong passwords protect your account from unauthorized access. This requirement ensures a minimum level of security.  
**Example**: 
- ✅ SecurePass123! (meets all requirements)
- ❌ password123 (no uppercase, no special character)
- ❌ Pass123 (only 7 characters)

**Exception**: None - all passwords must meet these requirements.

---

### Rule 5: Seller Registration Requires SIRET Verification
**What it means**: If you register as a seller, you must provide a valid SIRET number (French business ID).  
**Why it exists**: SIRET verification ensures that sellers are legitimate businesses. This protects buyers and maintains platform integrity.  
**Example**: 
- Seller registration: Must provide SIRET number
- Buyer registration: SIRET not required
- Professional buyer: May provide SIRET but not required

**Exception**: Non-French sellers may use alternative business ID verification. Contact support for options.

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not create a verified seller profile** - Registration only creates an account. Sellers must complete onboarding to set up their profile.
- **Does not set up payment methods** - Registration doesn't configure payment or payout methods. This is done separately in account settings.
- **Does not verify business documents** - Registration doesn't verify KBIS, insurance, or other documents. Admin verification happens after upload.
- **Does not assign service areas** - You can select service categories during registration, but service areas are configured in onboarding.
- **Does not create a subscription** - Registration doesn't automatically create a subscription. Sellers must subscribe separately to be visible.

**Alternative Solutions:**
- For **setting up seller profile**, see Guide_How_To_Complete_Seller_Onboarding
- For **adding payment methods**, see Guide_How_To_Add_Bank_Account
- For **uploading documents**, see Guide_How_To_Upload_Business_Documents
- For **subscribing to seller plan**, see Feature_Subscription_System

---

## Troubleshooting

### Problem: Registration Form Won't Submit
**Symptoms**: You click "Register" but nothing happens, or you see a loading spinner that never completes  
**Possible causes**:
1. Internet connection is slow or unstable
2. Browser has JavaScript disabled
3. Browser cache is corrupted
4. Server is temporarily unavailable

**Solutions**:
1. Check your internet connection
2. Try a different browser (Chrome, Firefox, Safari)
3. Clear your browser cache and cookies
4. Wait a few minutes and try again
5. If still not working, contact support

---

### Problem: Can't Find Verification Email
**Symptoms**: You registered but don't see the verification email in your inbox  
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

**Account**: Your user profile on Safe Bill, identified by your email address  
**Email Verification**: The process of confirming that you own the email address you registered with  
**SIRET**: French business identification number (14 digits) required for seller registration  
**Verification Token**: A unique code sent in the verification email that confirms your email ownership  
**Onboarding**: The setup process after registration where you complete your profile and configure settings  
**JWT Token**: A security token issued after login that authenticates your requests to the API  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created
- **v1.1** (TBD): Added alternative paths for email expiration
- **v1.2** (TBD): Added SIRET verification details

---

## Related Documentation

**Read this first:**
- None (this is a foundation document)

**Read this next:**
- Flow_Email_Verification
- Flow_User_Login
- Guide_How_To_Create_Account

**Related topics:**
- Feature_Email_Verification_System
- Error_Registration_Errors
- Policy_Email_Requirements
- Policy_Password_Security
- Component_Authentication_System_Overview

