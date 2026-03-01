---
# Document Identity
doc_id: policy_password_security_001
title: Password Security Policy
category: Policy
feature: Password Security

# Audience & Access
user_roles: All
difficulty: Beginner
prerequisites: []

# Content Classification
topics: [Password, Security, Policy, Requirements, Best Practices]
keywords: [password policy, password requirements, password security, strong password]
use_cases: [Password creation, Account security, Password management]

# Relationships
related_docs: [Flow_User_Registration, Flow_Password_Reset, Guide_How_To_Create_Strong_Password, Guide_How_To_Secure_Your_Account, Feature_JWT_Token_Management]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Password Security Policy

## Document Metadata
- **Category**: Policy
- **Enforcement**: System (automatic validation)
- **Applies To**: All users
- **Compliance**: OWASP, NIST guidelines

---

## Policy Overview

The Password Security Policy establishes requirements for creating and maintaining secure passwords on Safe Bill. This policy protects user accounts from unauthorized access and ensures the platform maintains high security standards. All users must comply with these password requirements when creating or changing their password.

**Governed Areas:**
- Password creation requirements
- Password strength validation
- Password change procedures
- Password storage and hashing
- Password reuse prevention
- Account security practices

---

## Policy Rules

### Rule 1: Minimum Password Length

**Statement**: All passwords must be at least 8 characters long.  
**Applies to**: All users (sellers, buyers, admins)  
**Requirement**: Password must contain 8 or more characters  
**Validation**: System checks length during password creation/change  
**Enforcement**: Password is rejected if less than 8 characters

**Why this rule exists:**
- Longer passwords are exponentially harder to crack
- 8 characters is the minimum recommended by NIST
- Provides reasonable security without being overly burdensome
- Balances security with usability

**Examples:**
- ✅ **Compliant**: "SecurePass123!" (14 characters)
- ✅ **Compliant**: "MyPassword2024!" (14 characters)
- ❌ **Non-compliant**: "Pass123" (7 characters)
- ❌ **Non-compliant**: "short" (5 characters)

**Exceptions**: None - all passwords must be at least 8 characters.

---

### Rule 2: Uppercase Letter Requirement

**Statement**: All passwords must contain at least one uppercase letter (A-Z).  
**Applies to**: All users  
**Requirement**: At least one character from A-Z  
**Validation**: System checks for uppercase during password creation/change  
**Enforcement**: Password is rejected if no uppercase letters

**Why this rule exists:**
- Uppercase letters significantly increase password complexity
- Prevents simple lowercase-only passwords
- Required by OWASP password guidelines
- Increases entropy (randomness) of password

**Examples:**
- ✅ **Compliant**: "SecurePass123!" (has 'S' and 'P')
- ✅ **Compliant**: "MyPassword2024!" (has 'M' and 'P')
- ❌ **Non-compliant**: "securepass123!" (all lowercase)
- ❌ **Non-compliant**: "password123!" (all lowercase)

**Exceptions**: None - all passwords must have at least one uppercase letter.

---

### Rule 3: Lowercase Letter Requirement

**Statement**: All passwords must contain at least one lowercase letter (a-z).  
**Applies to**: All users  
**Requirement**: At least one character from a-z  
**Validation**: System checks for lowercase during password creation/change  
**Enforcement**: Password is rejected if no lowercase letters

**Why this rule exists:**
- Lowercase letters increase password complexity
- Prevents all-uppercase passwords
- Required by OWASP password guidelines
- Increases entropy of password

**Examples:**
- ✅ **Compliant**: "SecurePass123!" (has 'e', 'c', 'u', 'r', etc.)
- ✅ **Compliant**: "MyPassword2024!" (has 'y', 'a', 's', 's', etc.)
- ❌ **Non-compliant**: "SECUREPASS123!" (all uppercase)
- ❌ **Non-compliant**: "PASSWORD123!" (all uppercase)

**Exceptions**: None - all passwords must have at least one lowercase letter.

---

### Rule 4: Number Requirement

**Statement**: All passwords must contain at least one number (0-9).  
**Applies to**: All users  
**Requirement**: At least one digit from 0-9  
**Validation**: System checks for numbers during password creation/change  
**Enforcement**: Password is rejected if no numbers

**Why this rule exists:**
- Numbers add complexity and entropy
- Prevents passwords using only letters
- Required by OWASP guidelines
- Makes passwords harder to guess

**Examples:**
- ✅ **Compliant**: "SecurePass123!" (has 1, 2, 3)
- ✅ **Compliant**: "MyPassword2024!" (has 2, 0, 2, 4)
- ❌ **Non-compliant**: "SecurePassword!" (no numbers)
- ❌ **Non-compliant**: "MyPassword!" (no numbers)

**Exceptions**: None - all passwords must have at least one number.

---

### Rule 5: Special Character Requirement

**Statement**: All passwords must contain at least one special character (!@#$%^&*).  
**Applies to**: All users  
**Requirement**: At least one character from !@#$%^&*-_=+  
**Validation**: System checks for special characters during password creation/change  
**Enforcement**: Password is rejected if no special characters

**Why this rule exists:**
- Special characters significantly increase password complexity
- Prevents simple alphanumeric passwords
- Required by OWASP guidelines
- Makes passwords much harder to crack

**Allowed special characters**: ! @ # $ % ^ & * - _ = +

**Examples:**
- ✅ **Compliant**: "SecurePass123!" (has !)
- ✅ **Compliant**: "MyPassword@2024" (has @)
- ✅ **Compliant**: "Pass#word123" (has #)
- ❌ **Non-compliant**: "SecurePass123" (no special character)
- ❌ **Non-compliant**: "MyPassword2024" (no special character)

**Exceptions**: None - all passwords must have at least one special character.

---

### Rule 6: No Dictionary Words

**Statement**: Passwords should not consist of common dictionary words or predictable patterns.  
**Applies to**: All users  
**Requirement**: Avoid obvious words like "password", "123456", "qwerty"  
**Validation**: System may check against common password lists  
**Enforcement**: System may reject very common passwords

**Why this rule exists:**
- Dictionary words are easy to guess
- Predictable patterns are vulnerable to attacks
- Increases security against dictionary attacks
- Encourages unique passwords

**Examples:**
- ✅ **Compliant**: "SecurePass123!" (unique combination)
- ✅ **Compliant**: "MyBusiness@2024" (not a dictionary word)
- ❌ **Non-compliant**: "Password123!" (contains word "password")
- ❌ **Non-compliant**: "Qwerty123!" (keyboard pattern)

**Exceptions**: None - avoid dictionary words.

---

### Rule 7: No Personal Information

**Statement**: Passwords should not contain personal information like name, email, or birthdate.  
**Applies to**: All users  
**Requirement**: Don't use name, email, company name, or birthdates  
**Validation**: System may check against user profile information  
**Enforcement**: System may reject passwords containing personal info

**Why this rule exists:**
- Personal information is easy to guess or find
- Attackers often try personal info first
- Increases security against targeted attacks
- Encourages truly random passwords

**Examples:**
- ✅ **Compliant**: "SecurePass123!" (no personal info)
- ✅ **Compliant**: "MyBusiness@2024" (generic, not personal)
- ❌ **Non-compliant**: "Marie123!" (contains first name)
- ❌ **Non-compliant**: "Dupont@2024" (contains last name)
- ❌ **Non-compliant**: "Marie1985!" (contains name and birthdate)

**Exceptions**: None - don't use personal information.

---

### Rule 8: Password Storage - Hashing Required

**Statement**: Passwords must be hashed using a secure algorithm before storage. Plain text passwords are never stored.  
**Applies to**: System (developers)  
**Requirement**: Use bcrypt, Argon2, or PBKDF2 for hashing  
**Validation**: Code review, security audit  
**Enforcement**: Automated testing

**Why this rule exists:**
- Protects passwords if database is compromised
- Hashing is one-way (can't reverse to get password)
- Makes brute-force attacks computationally expensive
- Industry standard practice

**Implementation:**
- Algorithm: bcrypt with salt
- Cost factor: 12 (minimum)
- Never store plain text passwords
- Never use MD5 or SHA1 for passwords

**Examples:**
- ✅ **Compliant**: `bcrypt('SecurePass123!', salt=12)`
- ❌ **Non-compliant**: Storing "SecurePass123!" in plain text
- ❌ **Non-compliant**: Using MD5 hash

**Exceptions**: None - all passwords must be hashed.

---

### Rule 9: Password Change on Reset

**Statement**: When a user resets their password, the new password must be different from the old password.  
**Applies to**: All users  
**Requirement**: New password cannot be identical to previous password  
**Validation**: System checks during password reset  
**Enforcement**: Password reset is rejected if same as old password

**Why this rule exists:**
- Ensures password is actually changed
- Prevents accidental re-use of old password
- Improves security if old password was compromised
- Ensures password reset process is effective

**Examples:**
- ✅ **Compliant**: Old: "OldPass123!" → New: "NewPass456!"
- ❌ **Non-compliant**: Old: "OldPass123!" → New: "OldPass123!"

**Exceptions**: None - new password must be different.

---

### Rule 10: No Password Sharing

**Statement**: Users must not share their password with anyone, including Safe Bill staff.  
**Applies to**: All users  
**Requirement**: Keep password private and confidential  
**Validation**: User education and awareness  
**Enforcement**: Policy enforcement, account security

**Why this rule exists:**
- Shared passwords compromise account security
- Safe Bill staff never needs your password
- Shared passwords can't be revoked individually
- Increases risk of unauthorized access

**What this means:**
- Don't share password with colleagues
- Don't share password with family
- Don't share password with Safe Bill support
- Don't write password on sticky notes
- Don't use same password on multiple sites

**Examples:**
- ✅ **Compliant**: Keep password private, use password manager
- ❌ **Non-compliant**: Sharing password with colleague
- ❌ **Non-compliant**: Telling password to support staff

**Exceptions**: None - never share your password.

---

## Compliance Checking

**System checks:**
- Length validation (minimum 8 characters)
- Uppercase letter validation
- Lowercase letter validation
- Number validation
- Special character validation
- Common password list checking
- Personal information checking

**Manual verification:**
- Security audits
- Code reviews
- Penetration testing
- User education

---

## Violations & Consequences

### Violation: Password Too Weak
**What happens**: Registration or password change is rejected  
**How to remedy**: 
1. Create a stronger password meeting all requirements
2. Try again with new password

---

### Violation: Password Shared
**What happens**: Account security is compromised  
**How to remedy**:
1. Change password immediately
2. Review account activity
3. Contact support if unauthorized access detected
4. Enable additional security measures

---

### Violation: Password Reused Across Sites
**What happens**: If one site is compromised, all accounts are at risk  
**How to remedy**:
1. Use unique password for Safe Bill
2. Use password manager to generate unique passwords
3. Change password if reused elsewhere

---

## Important Rules Summary

| Rule | Requirement | Example |
|------|-------------|---------|
| Length | Minimum 8 characters | SecurePass123! |
| Uppercase | At least one A-Z | **S**ecurePass123! |
| Lowercase | At least one a-z | Secur**e**Pass123! |
| Number | At least one 0-9 | SecurePass**123**! |
| Special | At least one !@#$%^&* | SecurePass123**!** |
| No Dictionary | Avoid common words | SecurePass123! (not "password") |
| No Personal | Avoid name/email | SecurePass123! (not "Marie") |
| Unique | Different from old | NewPass456! (not OldPass123!) |
| Private | Don't share | Keep to yourself |
| Hashed | Never plain text | bcrypt hash stored |

---

## Best Practices

**Creating a Strong Password:**
1. Use a combination of uppercase, lowercase, numbers, and special characters
2. Make it at least 12 characters (longer is better)
3. Don't use dictionary words
4. Don't use personal information
5. Use a password manager to generate random passwords
6. Use unique password for each site

**Managing Your Password:**
1. Store password securely (password manager recommended)
2. Never write password on paper
3. Never share password with anyone
4. Change password if you suspect compromise
5. Use different passwords for different sites
6. Enable two-factor authentication if available

**Example Strong Passwords:**
- ✅ MyBusiness@2024!
- ✅ SecurePass#456
- ✅ Tr0p!cal$unset
- ✅ Coffee&Coding$2024

**Example Weak Passwords:**
- ❌ password123
- ❌ 12345678
- ❌ qwerty123
- ❌ Marie1985
- ❌ CompanyName2024

---

## Common Questions

**Q: Why are the password requirements so strict?**  
A: Strict requirements ensure your account is protected from brute-force attacks and unauthorized access. While they may seem inconvenient, they significantly improve security.

**Q: Can I use the same password for multiple sites?**  
A: Not recommended. If one site is compromised, all your accounts are at risk. Use a unique password for each site, especially for important accounts like Safe Bill.

**Q: Should I write my password down?**  
A: No, don't write passwords on paper or sticky notes. Use a password manager instead. Password managers are secure and convenient.

**Q: What's a password manager?**  
A: A password manager is software that securely stores and manages your passwords. Examples: 1Password, LastPass, Bitwarden, KeePass. They generate strong passwords and auto-fill login forms.

**Q: How often should I change my password?**  
A: Change your password if you suspect compromise. Otherwise, changing every 90 days is a good practice. If you use a strong, unique password, less frequent changes are acceptable.

**Q: What if I forget my password?**  
A: Use the password reset feature. Click "Forgot password?" on the login page, verify your email, and set a new password.

**Q: Can I use special characters other than !@#$%^&*?**  
A: The system accepts !@#$%^&*-_=+ as special characters. Other characters may not be allowed.

**Q: What if my password is hacked?**  
A: Change your password immediately. If you used the same password elsewhere, change it on those sites too. Contact support if you notice unauthorized activity.

---

## Glossary

**Hash**: One-way encryption that converts password to unreadable string  
**Bcrypt**: Secure password hashing algorithm  
**Salt**: Random data added to password before hashing  
**Brute-force Attack**: Trying many password combinations to guess password  
**Dictionary Attack**: Trying common words and patterns  
**Entropy**: Measure of randomness/unpredictability  
**Two-factor Authentication**: Additional security requiring second verification method  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- None (this is a foundation document)

**Read this next:**
- Flow_User_Registration
- Flow_Password_Reset
- Guide_How_To_Create_Strong_Password

**Related topics:**
- Guide_How_To_Secure_Your_Account
- Feature_JWT_Token_Management
- Policy_Email_Requirements

