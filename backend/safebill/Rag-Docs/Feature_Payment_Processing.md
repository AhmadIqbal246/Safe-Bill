---
# Document Identity
doc_id: feature_payment_processing_001
title: Payment Processing System
category: Feature
feature: Payment Processing

# Audience & Access
user_roles: Buyer, Seller
difficulty: Intermediate
prerequisites: [Feature_Project_Management, Feature_Milestone_Payment_System]

# Content Classification
topics: [Payment Processing, Stripe Integration, Payment Status, Refunds, Payout Management]
keywords: [payment, stripe, checkout, refund, payout, payment status]
use_cases: [Processing project payments, Handling refunds, Managing payouts, Tracking payment status]

# Relationships
related_docs: [Feature_Milestone_Payment_System, Feature_Subscription_System, Error_Payment_Errors]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Payment Processing System

## Document Metadata
- **Feature**: Payment Processing
- **Category**: Feature
- **User Roles**: Buyer, Seller
- **Dependencies**: Stripe integration, project management
- **Enabled By Default**: Yes

---

## Quick Summary

Payment Processing System handles all financial transactions on Safe Bill using Stripe. Buyers pay for projects, funds are held in escrow, and sellers receive payouts via Stripe Connect. The system calculates platform fees, VAT, and net amounts. Payments progress through statuses (pending → paid/failed) and support refunds for cancelled projects.

**Key Capabilities:**
- Process payments via Stripe
- Calculate platform fees and VAT
- Hold funds in escrow
- Process payouts to sellers
- Handle refunds
- Track payment status
- Generate receipts
- HubSpot integration

**Use Cases:**
- Buyer paying for project
- Seller receiving payout
- Refunding cancelled project
- Tracking payment status
- Generating financial reports

---

## How It Works

### Component 1: Payment Processing

**Purpose**: Securely process financial transactions  
**How it works**: 
- Buyer initiates payment
- Redirected to Stripe checkout
- Buyer enters payment details
- Stripe processes payment
- Funds held in escrow
- Payment status updated
- Confirmation sent to both parties

**Example**: 
```
Project: Website Redesign (€5,000)
Platform Fee (10%): €500
VAT (20%): €1,000
Total Buyer Pays: €6,500
Seller Net: €4,500
```

---

### Component 2: Fee Calculation

**Purpose**: Calculate platform fees and VAT  
**How it works**: 
- Platform fee applied (default 10%)
- VAT calculated on subtotal
- Buyer pays total (project + fees + VAT)
- Seller receives net (project - fees)
- Calculation automatic

**Example**: 
```
Project Amount: €5,000
Platform Fee (10%): €500
Subtotal: €5,500
VAT (20%): €1,100
Total: €6,600

Seller Receives: €5,000 - €500 = €4,500
```

---

### Component 3: Escrow Management

**Purpose**: Protect both parties  
**How it works**: 
- Funds held in escrow account
- Not released to seller immediately
- Released as milestones approved
- If cancelled, refunded to buyer
- Transparent to both parties

**Example**: 
```
Payment Received: €6,600 (in escrow)
Milestone 1 Approved: €1,500 released
Milestone 2 Approved: €2,000 released
Milestone 3 Approved: €1,500 released
Final Balance: €0
```

---

### Component 4: Payout Management

**Purpose**: Transfer funds to seller's bank account  
**How it works**: 
- Seller connects Stripe Connect account
- Funds transferred when milestones approved
- Automatic payout processing
- Seller can view payout history
- Payout status tracked

**Example**: 
```
Payout 1: €1,500 (pending)
Payout 2: €2,000 (in transit)
Payout 3: €1,500 (paid)
Total Paid: €5,000
```

---

## Feature Configuration

**Default Settings:**
- **Platform Fee**: 10%
- **VAT Rate**: 20%
- **Payment Method**: Stripe
- **Payout Schedule**: Automatic on approval

**Customizable Settings:**
- **Platform Fee**: Per project (configurable)
- **VAT Rate**: Per project (configurable)
- **Payout Delay**: Hold period before payout

---

## Using This Feature

### As a Buyer

**What you can do:**
- Pay for projects
- View payment status
- Request refunds
- Download receipts
- Track spending

**Step-by-step:**
1. Accept project
2. Click "Pay Now"
3. Enter payment details
4. Confirm payment
5. Funds held in escrow
6. View payment status

---

### As a Seller

**What you can do:**
- Receive payments
- View payout status
- Track earnings
- Download receipts
- Manage Stripe account

**Step-by-step:**
1. Connect Stripe account
2. Complete milestones
3. Buyer approves milestone
4. Payment released
5. Payout processed
6. Funds in bank account

---

## Common Questions

**Q: When do I pay for the project?**  
A: As buyer, you pay when accepting project. Funds held in escrow until milestones approved.

**Q: When do I receive payment?**  
A: As seller, you receive payment when buyer approves each milestone.

**Q: What fees do I pay?**  
A: Platform fee (10%) and VAT (20%) are added to project amount.

**Q: Can I get a refund?**  
A: Yes, if project is cancelled, you get refund for unapproved milestones.

**Q: How long does payout take?**  
A: Typically 1-2 business days after milestone approval.

**Q: Can I change payment method?**  
A: Only Stripe is supported currently.

**Q: Is my payment information secure?**  
A: Yes, Stripe handles all payment details securely.

**Q: Can I see payment history?**  
A: Yes, view all payments and payouts in your account.

---

## What Can Go Wrong

### Error: Payment Failed
**When it happens**: Payment processing fails  
**Error message**: "Payment failed. Please try again."  
**What it means**: Card declined or processing error  
**How to fix**:
1. Check card details
2. Try different card
3. Contact bank
4. Try again later

**Prevention**: Ensure card is valid and has sufficient funds

---

### Error: Insufficient Funds
**When it happens**: Card doesn't have enough balance  
**Error message**: "Insufficient funds"  
**What it means**: Card balance too low  
**How to fix**:
1. Use different card
2. Add funds to card
3. Try again

**Prevention**: Ensure card has sufficient balance

---

### Error: Payout Failed
**When it happens**: Transfer to seller's account fails  
**Error message**: "Payout failed"  
**What it means**: Bank account issue or Stripe error  
**How to fix**:
1. Verify bank account details
2. Contact bank
3. Contact support

**Prevention**: Verify bank account is correct

---

## Important Rules

### Rule 1: Platform Fee Is Non-Refundable
**What it means**: Platform fee is kept regardless of outcome  
**Why it exists**: Covers platform costs  
**Example**: 
- Project cancelled
- Buyer refunded project amount
- Platform fee not refunded

**Exception**: None - platform fee is non-refundable

---

### Rule 2: Funds Held in Escrow Until Approval
**What it means**: Seller doesn't receive funds until milestone approved  
**Why it exists**: Protects both parties  
**Example**: 
- Payment received
- Funds in escrow
- Only released when approved

**Exception**: None - escrow is mandatory

---

### Rule 3: Payout Requires Stripe Connect Account
**What it means**: Seller must have Stripe Connect to receive payouts  
**Why it exists**: Enables secure fund transfers  
**Example**: 
- Seller connects Stripe account
- Payouts processed automatically
- Funds transferred to bank

**Exception**: None - Stripe Connect required

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not support other payment methods** - Stripe only
- **Does not support cryptocurrency** - Fiat currency only
- **Does not support payment plans** - Full payment required
- **Does not support partial refunds** - All-or-nothing

**Alternative Solutions:**
- For **other payment methods**, contact support
- For **payment plans**, create multiple projects
- For **partial refunds**, use dispute system

---

## Technical Details

**For Developers:**

**API Endpoints:**
- `POST /api/payments/create/` - Create payment
- `GET /api/payments/balance/` - Get balance
- `POST /api/payments/payout/` - Process payout
- `GET /api/projects/receipts/buyer/` - Get receipts

**Request Format:**
```json
{
  "project_id": 123,
  "amount": 6600.00,
  "currency": "EUR",
  "stripe_token": "tok_visa"
}
```

**Response Format:**
```json
{
  "id": 1,
  "project_id": 123,
  "amount": 6600.00,
  "status": "paid",
  "stripe_payment_id": "pi_123456",
  "created_at": "2024-12-06T10:00:00Z"
}
```

**Authentication Required**: Yes (JWT token)  
**Rate Limits**: 100 payments per minute

---

## Security Considerations

**Security Features:**
- Stripe handles payment details securely
- PCI compliance maintained
- Encryption in transit
- Fraud detection enabled

**User Responsibilities:**
- Don't share payment details
- Use secure connection
- Verify payment confirmation
- Monitor account activity

**Warnings:**
- ⚠️ Never share card details in chat
- ⚠️ Only use HTTPS connections
- ⚠️ Verify payment confirmation
- ⚠️ Report suspicious activity

---

## Troubleshooting

### Problem: Payment Stuck in Pending
**Symptoms**: Payment shows pending but not completed  
**Possible causes**:
1. Processing delay
2. Bank verification needed
3. System error

**Solutions**:
1. Wait 24-48 hours
2. Contact bank
3. Contact support

---

### Problem: Payout Not Received
**Symptoms**: Milestone approved but payout not received  
**Possible causes**:
1. Payout still processing
2. Bank account issue
3. Stripe error

**Solutions**:
1. Wait 1-2 business days
2. Verify bank account
3. Contact support

---

## Glossary

**Payment**: Financial transaction for project  
**Escrow**: Funds held until conditions met  
**Platform Fee**: Percentage charged by platform  
**VAT**: Value-added tax  
**Payout**: Transfer of funds to seller  
**Stripe**: Payment processing provider  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Feature_Project_Management
- Feature_Milestone_Payment_System

**Read this next:**
- Feature_Subscription_System

**Related topics:**
- Error_Payment_Errors

