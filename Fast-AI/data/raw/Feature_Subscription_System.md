---
# Document Identity
doc_id: feature_subscription_001
title: Seller Subscription System
category: Feature
feature: Seller Subscription

# Audience & Access
user_roles: Seller
difficulty: Beginner
prerequisites: [Flow_User_Login]

# Content Classification
topics: [Subscription, Membership, Monthly Fee, Seller Visibility, Subscription Management]
keywords: [subscription, membership, monthly fee, seller subscription, premium]
use_cases: [Subscribing to seller plan, Managing subscription, Viewing subscription status, Cancelling subscription]

# Relationships
related_docs: [Feature_Payment_Processing, Feature_Seller_Discovery_Filtering]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Seller Subscription System

## Document Metadata
- **Feature**: Seller Subscription
- **Category**: Feature
- **User Roles**: Seller
- **Dependencies**: Payment processing, Stripe
- **Enabled By Default**: Yes

---

## Quick Summary

Seller Subscription System allows sellers to subscribe to a monthly membership plan (€3/month) to be visible on the platform. Subscriptions are managed through Stripe and automatically renew monthly. Sellers must maintain an active subscription to appear in buyer searches and receive project invitations.

**Key Capabilities:**
- Subscribe to seller plan (€3/month)
- Automatic monthly renewal
- Cancel subscription anytime
- View subscription status
- Track subscription invoices
- Manage payment method
- Pause/resume subscription

**Use Cases:**
- Becoming visible to buyers
- Maintaining seller status
- Managing subscription billing
- Cancelling when not needed

---

## How It Works

### Component 1: Subscription Plans

**Purpose**: Provide membership options  
**How it works**: 
- Single plan available: €3/month
- Automatic monthly renewal
- Billed to Stripe account
- Subscription status tracked
- Can be cancelled anytime

**Example**: 
```
Plan: Seller Membership
Price: €3.00/month
Billing: Monthly
Renewal: Automatic
```

---

### Component 2: Subscription Management

**Purpose**: Control subscription status  
**How it works**: 
- Seller initiates subscription
- Payment processed via Stripe
- Subscription activated
- Monthly invoices generated
- Can cancel anytime
- Refunds not available for partial months

**Example**: 
```
Status: Active
Next Billing: 2025-01-06
Amount: €3.00
Payment Method: Visa ending in 4242
```

---

### Component 3: Visibility & Search

**Purpose**: Only active subscribers appear in searches  
**How it works**: 
- Active subscribers visible to buyers
- Appear in search results
- Can receive project invitations
- Inactive subscribers hidden
- Reactivate by renewing subscription

**Example**: 
```
Active Subscriber: Appears in searches
Inactive Subscriber: Hidden from searches
```

---

### Component 4: Invoicing

**Purpose**: Track subscription payments  
**How it works**: 
- Monthly invoice generated
- Invoice sent to seller
- Invoice stored in account
- Can download invoices
- Used for accounting

**Example**: 
```
Invoice: SUB-2024-001
Date: 2024-12-06
Amount: €3.00
Status: Paid
```

---

## Feature Configuration

**Default Settings:**
- **Plan Price**: €3.00/month
- **Billing Cycle**: Monthly
- **Auto-Renewal**: Enabled
- **Cancellation**: Anytime

**Customizable Settings:**
- **Payment Method**: Can change card
- **Billing Address**: Can update
- **Renewal Date**: Fixed monthly

---

## Using This Feature

### As a Seller

**What you can do:**
- Subscribe to seller plan
- View subscription status
- Download invoices
- Change payment method
- Cancel subscription

**Step-by-step:**
1. Go to account settings
2. Click "Subscribe"
3. Select plan
4. Enter payment details
5. Confirm subscription
6. Subscription activated

---

## Common Questions

**Q: How much does the subscription cost?**  
A: €3.00 per month, billed automatically.

**Q: Can I cancel anytime?**  
A: Yes, you can cancel your subscription anytime. No long-term commitment.

**Q: When am I billed?**  
A: Monthly on the same date you subscribed.

**Q: What if I cancel?**  
A: Your subscription ends at the end of the current billing period. You're not refunded for partial months.

**Q: Do I need a subscription to use the platform?**  
A: No, but you won't be visible to buyers without an active subscription.

**Q: Can I pause my subscription?**  
A: Not currently. You can cancel and resubscribe later.

**Q: What payment methods are accepted?**  
A: Stripe accepts all major credit cards.

**Q: Can I change my payment method?**  
A: Yes, you can update your payment method in account settings.

---

## What Can Go Wrong

### Error: Payment Failed
**When it happens**: Subscription payment fails  
**Error message**: "Payment failed. Subscription not activated."  
**What it means**: Card declined or processing error  
**How to fix**:
1. Check card details
2. Try different card
3. Contact bank
4. Try again

**Prevention**: Ensure card is valid and has funds

---

### Error: Subscription Already Active
**When it happens**: Try to subscribe when already subscribed  
**Error message**: "You already have an active subscription"  
**What it means**: You're already subscribed  
**How to fix**:
1. View current subscription
2. Cancel if you want to change plan
3. Resubscribe with new plan

**Prevention**: Check subscription status first

---

### Error: Cannot Cancel
**When it happens**: Cancellation fails  
**Error message**: "Failed to cancel subscription"  
**What it means**: System error  
**How to fix**:
1. Try again
2. Contact support
3. Provide subscription ID

**Prevention**: None - contact support if issue

---

## Important Rules

### Rule 1: Subscription Required for Visibility
**What it means**: Only active subscribers appear in buyer searches  
**Why it exists**: Ensures only committed sellers are visible  
**Example**: 
- ✅ Active subscription → Visible in searches
- ❌ No subscription → Hidden from searches

**Exception**: None - subscription required

---

### Rule 2: Monthly Billing
**What it means**: Subscription billed monthly on same date  
**Why it exists**: Consistent billing schedule  
**Example**: 
- Subscribed on Dec 6
- Billed on Dec 6 each month
- €3.00 per month

**Exception**: None - monthly billing only

---

### Rule 3: No Refunds for Partial Months
**What it means**: Cancellation doesn't refund partial month  
**Why it exists**: Simplifies billing  
**Example**: 
- Subscribed Dec 6
- Cancel Dec 20
- Still charged for full month
- No refund

**Exception**: None - no partial refunds

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not support pause** - Can only cancel/resubscribe
- **Does not support multiple plans** - Only one plan available
- **Does not support annual billing** - Monthly only
- **Does not support discounts** - Fixed price

**Alternative Solutions:**
- For **pause**, cancel and resubscribe later
- For **annual billing**, contact support
- For **discounts**, contact support

---

## Technical Details

**For Developers:**

**API Endpoints:**
- `POST /api/subscription/create/` - Create subscription
- `GET /api/subscription/status/` - Get subscription status
- `POST /api/subscription/cancel/` - Cancel subscription
- `GET /api/subscription/invoices/` - Get invoices

**Request Format:**
```json
{
  "stripe_token": "tok_visa",
  "plan_id": "seller_monthly"
}
```

**Response Format:**
```json
{
  "id": 1,
  "user_id": 42,
  "stripe_subscription_id": "sub_123456",
  "status": "active",
  "current_period_end": "2025-01-06T00:00:00Z",
  "created_at": "2024-12-06T10:00:00Z"
}
```

---

## Security Considerations

**Security Features:**
- Stripe handles payment details
- PCI compliance maintained
- Secure subscription management
- Encrypted communication

**User Responsibilities:**
- Keep payment method updated
- Monitor subscription status
- Review monthly invoices
- Report suspicious charges

**Warnings:**
- ⚠️ Don't share payment details
- ⚠️ Monitor your subscription
- ⚠️ Review invoices regularly
- ⚠️ Report issues immediately

---

## Troubleshooting

### Problem: Subscription Not Activated
**Symptoms**: Payment processed but subscription not active  
**Possible causes**:
1. Processing delay
2. System error
3. Payment issue

**Solutions**:
1. Wait 5 minutes
2. Refresh page
3. Check payment status
4. Contact support

---

### Problem: Still Visible After Cancellation
**Symptoms**: Cancelled subscription but still in search results  
**Possible causes**:
1. Cache not updated
2. Still in current billing period
3. System delay

**Solutions**:
1. Clear browser cache
2. Wait for billing period to end
3. Contact support

---

## Glossary

**Subscription**: Monthly membership plan  
**Billing Cycle**: Monthly renewal period  
**Invoice**: Monthly billing statement  
**Stripe**: Payment processor  
**Active Subscription**: Current valid subscription  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Flow_User_Login

**Read this next:**
- Feature_Payment_Processing
- Feature_Seller_Discovery_Filtering

**Related topics:**
- Error_Subscription_Errors

