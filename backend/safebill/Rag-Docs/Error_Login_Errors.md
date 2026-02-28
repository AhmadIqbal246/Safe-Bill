---
# Document Identity
doc_id: error_login_errors_001
title: Login Errors
category: Error
feature: User Login

# Audience & Access
user_roles: All
difficulty: Beginner
prerequisites: [Flow_User_Login]

# Content Classification
topics: [Login, Authentication, Errors, Troubleshooting]
keywords: [login error, authentication error, invalid credentials, account locked]
use_cases: [Login troubleshooting, Error resolution, Account access issues]

# Relationships
related_docs: [Flow_User_Login, Error_Registration_Errors, Error_Token_Expiration_Handling, Guide_How_To_Login, Guide_How_To_Recover_Account]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Login Errors

## Document Metadata
- **Category**: Error Handling
- **Related Feature**: User Login
- **Severity Levels**: Critical, High, Medium, Low

---

## Error Overview

This document covers all possible errors that can occur during the login process. Login errors can be caused by incorrect credentials, account issues, email verification problems, server issues, or network problems. Each error has a specific cause and solution.

---

## Error Catalog

### Error: Invalid Email or Password
**Error Code**: 401  
**Error Message**: "Invalid email or password"  
**Severity**: High

**When it occurs:**
- You enter an email that doesn't exist in the system
- You enter a password that doesn't match the registered password
- You enter the wrong email/password combination

**What it means**: Either the email isn't registered on Safe Bill, or the password is incorrect. The system doesn't tell you which one for security reasons (prevents email enumeration attacks).

**Root causes:**
1. Email address is misspelled or incorrect
2. Password is misspelled or incorrect
3. Email is not registered on Safe Bill
4. Using wrong account credentials

**How to resolve:**

**For users:**
1. Double-check your email address for typos
2. Make sure you're using the correct password
3. If you forgot your password, click "Forgot password?"
4. If you don't have an account, click "Register"
5. Try using a different email if you have multiple accounts

**For developers:**
1. Verify user exists in database
2. Verify password hash matches
3. Return generic error (don't reveal if email exists)
4. Log failed attempt for security monitoring

**Prevention:**
- Write down your credentials in a secure location
- Use a password manager to store your password
- Double-check credentials before submitting

**Example scenario:**
```
User enters:
Email: marie.dupont@company.fr
Password: WrongPassword123!

System response:
"Invalid email or password"

Solution:
- Check if email is correct (should be marie.dupont@company.fr)
- Check if password is correct (should be SecurePass123!)
- Use password reset if forgotten
```

---

### Error: Email Not Verified
**Error Code**: 403  
**Error Message**: "Please verify your email before logging in"  
**Severity**: High

**When it occurs:**
- You try to log in with an account that hasn't verified their email
- Email verification link was never clicked
- Email verification failed

**What it means**: Your account exists and credentials are correct, but your email hasn't been confirmed. You need to verify your email before you can log in.

**Root causes:**
1. Didn't click verification link in registration email
2. Verification link expired (24 hours)
3. Verification email was deleted before clicking link
4. Verification process failed

**How to resolve:**

**For users:**
1. Check your email for the verification message
2. Click the verification link in the email
3. If you don't see the email, click "Resend Verification Email"
4. Check your spam/junk folder
5. Wait 1-2 minutes for new email to arrive
6. Click the new verification link
7. Try logging in again

**For developers:**
1. Check User.is_email_verified field
2. Return error if not verified
3. Provide option to resend verification email
4. Don't allow login until verified

**Prevention:**
- Verify your email immediately after registration
- Don't wait more than 24 hours or link will expire
- Check spam folder for verification email

**Example scenario:**
```
User tries to log in:
Email: marie.dupont@company.fr
Password: SecurePass123!

System response:
"Please verify your email before logging in"

Solution:
1. Check email for verification message
2. Click verification link
3. If link expired, request new one
4. Try logging in again
```

---

### Error: Account Locked
**Error Code**: 429  
**Error Message**: "Account temporarily locked due to multiple failed login attempts. Try again in 15 minutes."  
**Severity**: Medium

**When it occurs:**
- You enter the wrong password 5 or more times
- System detects brute-force attack attempt
- Account is locked for security

**What it means**: For security, the system locks your account after several failed login attempts to prevent brute-force attacks. You must wait 15 minutes before trying again.

**Root causes:**
1. Entered wrong password multiple times
2. Someone else trying to access your account
3. Keyboard layout issue (typing in wrong language)

**How to resolve:**

**For users:**
1. Wait 15 minutes before trying again
2. Make sure you're using the correct password
3. If you forgot your password, click "Forgot password?" (this doesn't count as failed attempt)
4. If you still can't log in after waiting, contact support
5. Change your password if you suspect unauthorized access

**For developers:**
1. Implement rate limiting on login endpoint
2. Lock account after 5 failed attempts
3. Lock duration: 15 minutes
4. Reset counter on successful login
5. Log all failed attempts for security

**Prevention:**
- Be careful when entering your password
- Use a password manager to avoid typos
- Don't let others guess your password

**Example scenario:**
```
User tries to log in 5 times with wrong password:
Attempt 1: Invalid password
Attempt 2: Invalid password
Attempt 3: Invalid password
Attempt 4: Invalid password
Attempt 5: Invalid password

System response:
"Account temporarily locked. Try again in 15 minutes."

Solution:
1. Wait 15 minutes
2. Try again with correct password
3. Or use password reset if forgotten
```

---

### Error: Account Deleted
**Error Code**: 404  
**Error Message**: "This account has been deleted"  
**Severity**: High

**When it occurs:**
- You try to log in with a deleted account
- Account was deleted by user or admin
- Account deletion period hasn't expired

**What it means**: Your account has been deleted and is no longer active. Depending on the deletion reason, you may be able to recover it.

**Root causes:**
1. User deleted their own account
2. Admin deleted the account
3. Account was deleted for compliance reasons

**How to resolve:**

**For users:**
1. If you deleted your account yourself:
   - Contact support within data retention period (usually 30 days)
   - Provide proof of identity
   - Request account recovery
2. If account was deleted by admin:
   - Contact support for reason
   - Request reinstatement if appropriate
3. If you need a new account:
   - Register with a different email address
   - Or use a new email if old one is available

**For developers:**
1. Check if user exists in User table
2. Check DeletedUser table for deleted account
3. Return appropriate error message
4. Provide recovery option if within retention period

**Prevention:**
- Be careful when deleting your account
- Understand deletion is permanent after retention period
- Back up important data before deleting

**Example scenario:**
```
User tries to log in:
Email: marie.dupont@company.fr
Password: SecurePass123!

System response:
"This account has been deleted"

Solution:
1. Contact support within 30 days
2. Request account recovery
3. Or register with new email
```

---

### Error: Server Error (500)
**Error Code**: 500  
**Error Message**: "Server error. Please try again later."  
**Severity**: Critical

**When it happens**: The server encounters an unexpected error while processing your login  
**Error message**: "Server error. Please try again later."  
**What it means**: Something went wrong on the server side. This is not your fault.

**Root causes:**
1. Server is down or restarting
2. Database connection failed
3. Unexpected exception in code
4. Server resources exhausted

**How to resolve:**

**For users:**
1. Wait a few minutes and try again
2. Try a different browser
3. Clear your browser cache and cookies
4. Check if Safe Bill status page shows issues
5. If problem persists, contact support

**For developers:**
1. Check server logs for error details
2. Verify database connection
3. Check server resources (CPU, memory, disk)
4. Restart server if necessary
5. Fix underlying code issue
6. Monitor for similar errors

**Prevention:**
- Monitor server health
- Implement proper error handling
- Use automated alerts for server errors
- Regular backups and disaster recovery

**Example scenario:**
```
User tries to log in:
Email: marie.dupont@company.fr
Password: SecurePass123!

System response:
"Server error. Please try again later."

Solution:
1. Wait 5 minutes
2. Try again
3. If still failing, contact support
```

---

### Error: Network Error
**Error Code**: N/A (client-side)  
**Error Message**: "Network error. Please check your connection and try again."  
**Severity**: Medium

**When it happens**: Your internet connection is lost or very slow  
**Error message**: "Network error. Please check your connection and try again."  
**What it means**: The login request couldn't reach the server due to connection issues.

**Root causes:**
1. Internet connection is disconnected
2. Internet connection is very slow
3. Network is unstable
4. Firewall is blocking connection
5. Proxy is interfering with connection

**How to resolve:**

**For users:**
1. Check your internet connection
2. Try a different network (WiFi vs mobile data)
3. Restart your router
4. Try again in a few minutes
5. If still not working, contact your internet provider

**For developers:**
1. Implement network error handling
2. Show user-friendly error message
3. Provide retry button
4. Log network errors for monitoring

**Prevention:**
- Ensure you have a stable internet connection before attempting to log in
- Use reliable network (avoid public WiFi for sensitive operations)
- Check your internet provider's status

**Example scenario:**
```
User tries to log in:
Email: marie.dupont@company.fr
Password: SecurePass123!

System response:
"Network error. Please check your connection and try again."

Solution:
1. Check internet connection
2. Restart router
3. Try again
```

---

### Error: Too Many Login Attempts
**Error Code**: 429  
**Error Message**: "Too many login attempts. Please try again later."  
**Severity**: Medium

**When it occurs:**
- You make too many login requests in a short time
- System detects potential brute-force attack
- Rate limiting is triggered

**What it means**: You've exceeded the maximum number of login attempts allowed in a short time period. You must wait before trying again.

**Root causes:**
1. Rapidly clicking login button
2. Automated login attempts
3. Brute-force attack

**How to resolve:**

**For users:**
1. Wait 5-10 minutes before trying again
2. Make sure you have correct credentials
3. Use password reset if you forgot password
4. If problem persists, contact support

**For developers:**
1. Implement rate limiting on login endpoint
2. Limit to 10 attempts per 10 minutes per IP
3. Return 429 status code
4. Include retry-after header
5. Log suspicious activity

**Prevention:**
- Don't rapidly click login button
- Use password reset if you forgot password
- Wait between login attempts

---

### Error: Invalid Request Format
**Error Code**: 400  
**Error Message**: "Invalid request format. Please provide email and password."  
**Severity**: Low

**When it occurs:**
- You submit login form without email field
- You submit login form without password field
- Request is malformed

**What it means**: The login request is missing required fields or has incorrect format.

**Root causes:**
1. Form submission error
2. Browser extension interfering
3. JavaScript error in form

**How to resolve:**

**For users:**
1. Make sure both email and password fields are filled
2. Try a different browser
3. Disable browser extensions
4. Clear browser cache
5. Try again

**For developers:**
1. Validate request format
2. Check for required fields
3. Return 400 error if invalid
4. Provide helpful error message

**Prevention:**
- Use form validation on frontend
- Make required fields obvious
- Provide clear error messages

---

### Error: Email Format Invalid
**Error Code**: 400  
**Error Message**: "Please enter a valid email address"  
**Severity**: Low

**When it occurs:**
- You enter an email that doesn't match standard format
- Email is missing @ symbol or domain

**What it means**: Your email doesn't follow the standard format.

**Root causes:**
1. Typo in email address
2. Missing @ symbol
3. Missing domain
4. Invalid characters

**How to resolve:**

**For users:**
1. Check email format: name@domain.com
2. Make sure there's exactly one @ symbol
3. Make sure there's a dot (.) in domain
4. Remove any spaces or special characters
5. Try again

**For developers:**
1. Validate email format on frontend
2. Use regex for email validation
3. Show error message if invalid
4. Don't submit form if invalid

**Prevention:**
- Use proper email format
- Check email before submitting
- Use email validation on frontend

---

## Error Decision Tree

```
Login Failed?
├─ Invalid email or password?
│  ├─ YES → Check credentials, use password reset if forgotten
│  └─ NO → Continue
├─ Email not verified?
│  ├─ YES → Verify email, request new verification if expired
│  └─ NO → Continue
├─ Account locked?
│  ├─ YES → Wait 15 minutes, or use password reset
│  └─ NO → Continue
├─ Account deleted?
│  ├─ YES → Contact support for recovery, or register new account
│  └─ NO → Continue
├─ Server error?
│  ├─ YES → Wait, try again, contact support if persists
│  └─ NO → Continue
├─ Network error?
│  ├─ YES → Check internet connection, try again
│  └─ NO → Continue
└─ Other error?
   └─ Contact support with error message
```

---

## Quick Reference

| Error Code | Message | Common Cause | Quick Fix |
|------------|---------|--------------|-----------|
| 401 | Invalid email or password | Wrong credentials | Check email/password, use password reset |
| 403 | Email not verified | Email not confirmed | Verify email, request new link if expired |
| 429 | Account locked | Too many failed attempts | Wait 15 minutes, use password reset |
| 404 | Account deleted | Account was deleted | Contact support for recovery |
| 500 | Server error | Server issue | Wait, try again, contact support |
| N/A | Network error | Connection issue | Check internet, restart router |
| 429 | Too many attempts | Rate limit exceeded | Wait 5-10 minutes |
| 400 | Invalid format | Missing fields | Fill all required fields |
| 400 | Invalid email | Bad format | Use format: name@domain.com |

---

## Common Questions

**Q: Why does the system say "Invalid email or password" instead of telling me which one is wrong?**  
A: This is a security feature. If the system told you "Email not found" or "Password incorrect", attackers could use this information to figure out which emails are registered on Safe Bill. By using a generic message, we prevent email enumeration attacks.

**Q: How long is my account locked after too many failed attempts?**  
A: Your account is locked for 15 minutes after 5 failed login attempts. After 15 minutes, you can try again. You can also use the password reset feature, which doesn't count as a failed attempt.

**Q: What if I'm locked out and need to access my account urgently?**  
A: You can use the password reset feature to regain access. Click "Forgot password?" on the login page. Password reset doesn't count as a failed login attempt, so you can use it immediately.

**Q: Can I log in if my email isn't verified?**  
A: No, email verification is mandatory. You must verify your email before you can log in. If your verification link expired, request a new one from the login page.

**Q: What if I forgot which email I registered with?**  
A: Try logging in with the email addresses you commonly use. If none work, contact support with your name and they can help you find your account.

**Q: Is my account safe if someone tries to log in with wrong password?**  
A: Yes, your account is protected. After 5 failed attempts, the account is locked for 15 minutes. This prevents brute-force attacks. Your password is never compromised by failed login attempts.

**Q: What if the server is down?**  
A: If the server is down, you'll get a "Server error" message. Check the Safe Bill status page to see if there's a known issue. Wait a few minutes and try again. If the problem persists, contact support.

**Q: Can I log in if I don't have internet?**  
A: No, you need an internet connection to log in. The login request must reach the server to validate your credentials. Once logged in, some features may work offline (depending on app design).

---

## Troubleshooting

### Problem: Keep Getting "Invalid Email or Password"
**Symptoms**: You're sure your credentials are correct but keep getting this error  
**Possible causes**:
1. Caps Lock is on
2. Email has extra spaces
3. Password has extra spaces
4. Using wrong account email
5. Password was changed and you forgot new one

**Solutions**:
1. Check Caps Lock is off
2. Remove any spaces from email and password
3. Try other email addresses you might use
4. Use password reset to set new password
5. Contact support if still not working

---

### Problem: Account Keeps Getting Locked
**Symptoms**: Account locks after a few login attempts  
**Possible causes**:
1. Keyboard layout is wrong (typing in different language)
2. Password is different than you think
3. Someone else trying to access your account

**Solutions**:
1. Check keyboard layout (should be English)
2. Use password reset to confirm password
3. Change password if you suspect unauthorized access
4. Contact support if problem persists

---

### Problem: Can't Verify Email
**Symptoms**: Clicked verification link but still can't log in  
**Possible causes**:
1. Verification didn't complete successfully
2. Browser cached old account status
3. System error during verification

**Solutions**:
1. Try logging in again
2. Clear browser cache and cookies
3. Try a different browser
4. Request new verification email
5. Contact support if still not working

---

## Glossary

**Brute-force Attack**: Attempting to log in by trying many password combinations  
**Rate Limiting**: Restricting number of requests in a time period  
**Email Enumeration**: Determining which emails are registered by analyzing error messages  
**Account Lockout**: Temporarily disabling login after failed attempts  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Flow_User_Login

**Read this next:**
- Guide_How_To_Login
- Guide_How_To_Recover_Account

**Related topics:**
- Error_Registration_Errors
- Error_Token_Expiration_Handling
- Feature_JWT_Token_Management
- Policy_Password_Security

