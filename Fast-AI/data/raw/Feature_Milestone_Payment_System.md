---
# Document Identity
doc_id: feature_milestone_payment_001
title: Milestone & Payment System
category: Feature
feature: Milestone & Payment Management

# Audience & Access
user_roles: Seller, Buyer
difficulty: Intermediate
prerequisites: [Feature_Project_Management]

# Content Classification
topics: [Milestones, Payment Installments, Escrow, Refunds, Payment Tracking]
keywords: [milestone, payment, installment, escrow, refund, payment tracking]
use_cases: [Creating milestones, Approving deliverables, Processing payments, Tracking refunds]

# Relationships
related_docs: [Feature_Payment_Processing, Feature_Project_Management, Error_Payment_Errors]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Milestone & Payment System

## Document Metadata
- **Feature**: Milestone & Payment System
- **Category**: Feature
- **User Roles**: Seller, Buyer
- **Dependencies**: Project management, payment processing
- **Enabled By Default**: Yes

---

## Quick Summary

The Milestone & Payment System breaks projects into manageable phases (milestones) with associated payments. Buyers pay for milestones as work is completed, protecting both parties. Funds are held in escrow until milestones are approved. The system supports up to 3 milestones per project and calculates refundable amounts based on milestone status.

**Key Capabilities:**
- Create up to 3 milestones per project
- Link payment installments to milestones
- Escrow payment holding
- Milestone approval workflow
- Refund calculation
- Payment tracking
- Completion status tracking

**Use Cases:**
- Breaking large project into phases
- Protecting buyer and seller
- Tracking project progress
- Managing partial payments
- Handling refunds

---

## How It Works

### Component 1: Milestone Creation

**Purpose**: Define project phases and deliverables  
**How it works**: 
- Seller creates up to 3 milestones per project
- Each milestone has name, description, payment amount
- Milestones linked to payment installments
- Buyer sees milestones before accepting project
- Status starts as "not_submitted"

**Example**: 
```
Project: Website Redesign (€5,000 total)
Milestone 1: Design & Mockups (€1,500)
Milestone 2: Frontend Development (€2,000)
Milestone 3: Backend & Testing (€1,500)
```

---

### Component 2: Escrow Payment System

**Purpose**: Protect both buyer and seller  
**How it works**: 
- Buyer pays full project amount upfront
- Funds held in escrow (not released to seller)
- Funds released as milestones are approved
- If project cancelled, funds returned to buyer
- Prevents disputes over payment

**Example**: 
```
Buyer pays €5,000
Funds held in escrow
Milestone 1 approved → €1,500 released to seller
Milestone 2 approved → €2,000 released to seller
Milestone 3 approved → €1,500 released to seller
```

---

### Component 3: Milestone Approval

**Purpose**: Buyer confirms work is complete and satisfactory  
**How it works**: 
- Seller marks milestone as "submitted"
- Buyer reviews work
- Buyer can approve or request changes
- Approved milestones release payment
- Rejected milestones stay in escrow

**Example**: 
```
Seller: "Milestone 1 complete - mockups ready"
Buyer: Reviews mockups
Buyer: "Looks good, approving milestone"
System: Releases €1,500 to seller
```

---

### Component 4: Refund Calculation

**Purpose**: Calculate refundable amount if project cancelled  
**How it works**: 
- Refundable = Total paid - Approved milestones
- If project cancelled, buyer gets refund
- Seller keeps payment for approved work
- Calculation automatic based on milestone status

**Example**: 
```
Total Paid: €5,000
Approved Milestones: €3,500 (1 & 2)
Refundable Amount: €1,500
If cancelled: Buyer gets €1,500 back
```

---

## Feature Configuration

**Default Settings:**
- **Max Milestones**: 3 per project
- **Payment Hold Period**: Until milestone approval
- **Refund Processing**: Automatic
- **Milestone Status**: Not submitted (initial)

**Customizable Settings:**
- **Milestone Names**: Custom per project
- **Payment Amounts**: Per milestone
- **Descriptions**: Detailed milestone descriptions
- **Supporting Documents**: Optional per milestone

---

## Using This Feature

### As a Seller

**What you can do:**
- Create milestones
- Submit milestones for approval
- Upload supporting documents
- Track payment status
- View refundable amount

**Step-by-step:**
1. Create project with milestones
2. Do work for milestone 1
3. Upload supporting documents
4. Mark milestone as "submitted"
5. Wait for buyer approval
6. Payment released when approved
7. Repeat for other milestones

---

### As a Buyer

**What you can do:**
- View milestones
- Approve completed milestones
- Request changes
- Track payments
- Request refunds if needed

**Step-by-step:**
1. Accept project
2. Make payment (full amount)
3. Wait for seller to submit milestone
4. Review work
5. Approve if satisfied
6. Payment released to seller
7. Repeat for other milestones

---

## Common Questions

**Q: How many milestones can I have?**  
A: Maximum 3 milestones per project. This ensures projects stay focused and manageable.

**Q: When do I pay for milestones?**  
A: As buyer, you pay the full project amount upfront. Funds are held in escrow and released as milestones are approved.

**Q: What if I don't approve a milestone?**  
A: Funds stay in escrow. Seller can make changes and resubmit. If never approved, funds are refunded to buyer.

**Q: How long does milestone approval take?**  
A: Depends on buyer. Typically 1-7 days. Seller can follow up if no response.

**Q: Can I change milestone amounts?**  
A: Only before project is accepted. After acceptance, amounts are locked.

**Q: What happens if project is cancelled?**  
A: Buyer gets refund for unapproved milestones. Seller keeps payment for approved work.

**Q: Can I have more than 3 milestones?**  
A: No, maximum is 3 per project. For larger projects, consider multiple projects.

**Q: How do I know if milestone was approved?**  
A: You'll receive notification. Payment status will show as "paid" for approved milestone.

---

## What Can Go Wrong

### Error: Maximum Milestones Exceeded
**When it happens**: You try to create more than 3 milestones  
**Error message**: "Maximum 3 milestones allowed per project"  
**What it means**: Project already has 3 milestones  
**How to fix**:
1. Delete unnecessary milestone
2. Combine milestones
3. Create separate project for additional work

**Prevention**: Plan milestones carefully before creating

---

### Error: Payment Not Released
**When it happens**: Milestone approved but payment not released  
**Error message**: "Payment processing. Please wait."  
**What it means**: Payment is being processed  
**How to fix**:
1. Wait 24-48 hours for processing
2. Check payment status
3. Contact support if not released after 48 hours

**Prevention**: None - processing is automatic

---

### Error: Refund Calculation Error
**When it happens**: Refund amount seems incorrect  
**Error message**: "Refund amount mismatch"  
**What it means**: Calculation doesn't match expected amount  
**How to fix**:
1. Verify approved milestones
2. Check total paid amount
3. Contact support with details

**Prevention**: Review milestone status before requesting refund

---

## Important Rules

### Rule 1: Maximum 3 Milestones Per Project
**What it means**: Each project can have at most 3 milestones  
**Why it exists**: Keeps projects focused and manageable  
**Example**: 
- ✅ 3 milestones (design, development, testing)
- ❌ 5 milestones (exceeds limit)

**Exception**: None - hard limit of 3

---

### Rule 2: Escrow Holds All Funds Until Approval
**What it means**: Buyer pays upfront, seller receives only when approved  
**Why it exists**: Protects both parties from disputes  
**Example**: 
- Buyer pays €5,000
- Funds held in escrow
- Only released when milestones approved

**Exception**: None - escrow is mandatory

---

### Rule 3: Refundable Amount = Total Paid - Approved Milestones
**What it means**: Refund is calculated automatically based on approved work  
**Why it exists**: Fair calculation of refunds  
**Example**: 
- Total: €5,000
- Approved: €3,000
- Refundable: €2,000

**Exception**: None - calculation is automatic

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not support partial milestone approval** - Milestones are all-or-nothing
- **Does not allow milestone rescheduling** - Dates are fixed
- **Does not support milestone dependencies** - Milestones are independent
- **Does not auto-release funds** - Requires manual approval

**Alternative Solutions:**
- For **partial approval**, request changes and resubmit
- For **rescheduling**, contact buyer to adjust timeline
- For **dependencies**, plan milestones carefully

---

## Technical Details

**For Developers:**

**API Endpoints:**
- `GET /api/projects/<id>/milestones/` - List milestones
- `GET /api/projects/milestones/<id>/` - Get milestone details
- `POST /api/projects/milestones/<id>/approve/` - Approve milestone
- `PUT /api/projects/milestones/<id>/` - Update milestone

**Request Format:**
```json
{
  "name": "Design & Mockups",
  "description": "Create design mockups and get approval",
  "relative_payment": 1500.00,
  "supporting_doc": "file.pdf"
}
```

**Response Format:**
```json
{
  "id": 1,
  "project_id": 123,
  "name": "Design & Mockups",
  "status": "approved",
  "relative_payment": 1500.00,
  "created_date": "2024-12-06T10:00:00Z",
  "completion_date": "2024-12-10T15:30:00Z"
}
```

---

## Security Considerations

**Security Features:**
- Escrow prevents fraud
- Milestone approval ensures quality
- Payment tracking prevents disputes
- Refund calculation is transparent

**User Responsibilities:**
- Review work carefully before approving
- Document milestone completion
- Communicate clearly about expectations

**Warnings:**
- ⚠️ Don't approve milestone without reviewing work
- ⚠️ Document all communications about milestones
- ⚠️ Request changes before approving if unsatisfied

---

## Troubleshooting

### Problem: Milestone Won't Submit
**Symptoms**: Submit button doesn't work  
**Possible causes**:
1. Missing supporting document
2. Milestone already submitted
3. System error

**Solutions**:
1. Upload supporting document
2. Check milestone status
3. Try again later
4. Contact support

---

### Problem: Payment Not Showing
**Symptoms**: Approved milestone but no payment received  
**Possible causes**:
1. Payment still processing
2. Bank transfer delay
3. Account issue

**Solutions**:
1. Wait 24-48 hours
2. Check payment status
3. Verify bank account
4. Contact support

---

## Glossary

**Milestone**: Project phase with deliverable and payment  
**Escrow**: Funds held by platform until conditions met  
**Approval**: Buyer confirmation that work is complete  
**Refundable Amount**: Money returned if project cancelled  
**Payment Installment**: Payment linked to milestone  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Feature_Project_Management

**Read this next:**
- Feature_Payment_Processing
- Feature_Dispute_Resolution

**Related topics:**
- Error_Payment_Errors
- Policy_Payment_Policy

