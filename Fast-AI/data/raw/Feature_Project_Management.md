---
# Document Identity
doc_id: feature_project_management_001
title: Project Management System
category: Feature
feature: Project Management

# Audience & Access
user_roles: Seller, Buyer
difficulty: Intermediate
prerequisites: [Flow_User_Login, Feature_Seller_Discovery_Filtering]

# Content Classification
topics: [Project Creation, Project Invitation, Project Status, Project Lifecycle, Project Details]
keywords: [create project, project invite, project status, project management, project workflow]
use_cases: [Creating new project, Inviting client, Managing project status, Tracking project progress]

# Relationships
related_docs: [Feature_Milestone_Payment_System, Feature_Real_Time_Chat, Flow_Project_Creation, Error_Project_Errors]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Project Management System

## Document Metadata
- **Feature**: Project Management
- **Category**: Feature
- **User Roles**: Seller, Buyer
- **Dependencies**: User authentication, seller profiles
- **Enabled By Default**: Yes

---

## Quick Summary

Project Management System is the core feature that manages the lifecycle of projects on Safe Bill. Sellers create projects and invite buyers (clients) to collaborate. Projects progress through multiple statuses (pending, payment in progress, approved, in progress, completed) and can be either real projects or quote chats. The system tracks all project details, milestones, payments, and communications.

**Key Capabilities:**
- Create new projects
- Invite clients via email token
- Track project status
- Manage project details
- View project history
- Create and manage milestones
- Track payments and refunds
- Support two project types (real projects and quote chats)

**Use Cases:**
- Seller creating project for new client
- Buyer accepting project invitation
- Tracking project progress
- Managing multiple projects
- Viewing completed projects

---

## How It Works

### Component 1: Project Creation

**Purpose**: Seller creates new project  
**How it works**: 
- Seller enters project details (name, description, budget)
- System creates project record
- Project status set to "pending"
- Seller can add milestones and payment details
- Seller invites client via email

**Example**: 
```
Project Details:
- Name: "Website Redesign"
- Client Email: john@company.com
- Budget: €5,000
- Type: Real Project
```

---

### Component 2: Project Invitation

**Purpose**: Invite client to accept project  
**How it works**: 
- Seller generates unique invitation token
- Token sent to client via email
- Client clicks link to accept invitation
- Client becomes project client
- Project status updates to "approved"

**Example**: 
```
Invitation Email:
- Link: https://safebill.com/invite/abc123xyz...
- Expires: 24 hours
- Client clicks link to accept
```

---

### Component 3: Project Status Tracking

**Purpose**: Track project progress through lifecycle  
**How it works**: 
- Project starts in "pending" status
- Status changes as project progresses
- Statuses: pending → payment_in_progress → approved → in_progress → completed
- Both seller and client can view status
- Status changes trigger notifications

**Example**: 
```
Status Flow:
1. Pending (awaiting client acceptance)
2. Payment In Progress (payment being processed)
3. Approved (payment confirmed)
4. In Progress (work being done)
5. Completed (project finished)
```

---

### Component 4: Project Types

**Purpose**: Support different project workflows  
**How it works**: 
- Real Projects: Full project with milestones and payments
- Quote Chats: Simple quote request and discussion
- Type selected during project creation
- Different workflows for each type

**Example**: 
```
Real Project: Full workflow with milestones
Quote Chat: Simple quote request without milestones
```

---

## Feature Configuration

**Default Settings:**
- **Project Status**: Pending (initial)
- **Invitation Expiry**: 24 hours
- **VAT Rate**: 20%
- **Platform Fee**: 10%
- **Project Type**: Real Project

**Customizable Settings:**
- **VAT Rate**: Per project (configurable)
- **Platform Fee**: Per project (configurable)
- **Invitation Expiry**: Can be extended
- **Project Type**: Real Project or Quote Chat

---

## Using This Feature

### As a Seller

**What you can do:**
- Create new projects
- Invite clients
- Manage project details
- Add milestones
- Track project status
- View project history
- Complete projects

**Step-by-step:**
1. Click "Create Project"
2. Enter project details
3. Select project type
4. Add milestones (if real project)
5. Invite client
6. Manage project as it progresses

---

### As a Buyer

**What you can do:**
- Accept project invitations
- View project details
- Approve milestones
- Make payments
- View project history
- Rate seller after completion

**Step-by-step:**
1. Receive project invitation email
2. Click invitation link
3. Review project details
4. Accept project
5. Make payment
6. Approve milestones as work completes

---

## Common Questions

**Q: How do I create a project?**  
A: Click "Create Project", enter project details, select type, add milestones, and invite client.

**Q: How long is the invitation valid?**  
A: Invitations are valid for 24 hours. You can request a new invitation if it expires.

**Q: Can I change project details after creation?**  
A: Yes, you can edit project details before client accepts. After acceptance, some details are locked.

**Q: What's the difference between real projects and quote chats?**  
A: Real projects have full workflow with milestones and payments. Quote chats are simpler quote requests.

**Q: Can I have multiple projects with same client?**  
A: Yes, you can create multiple projects with the same client.

**Q: What happens if client doesn't accept invitation?**  
A: Invitation expires after 24 hours. You can send a new invitation.

**Q: Can I delete a project?**  
A: Yes, you can delete projects that haven't been accepted yet.

**Q: How do I know project status?**  
A: Project status is displayed on project details page and in project list.

---

## What Can Go Wrong

### Error: Invalid Client Email
**When it happens**: Client email is invalid or not registered  
**Error message**: "Invalid email address"  
**What it means**: Email format is wrong or email not registered on Safe Bill  
**How to fix**:
1. Check email spelling
2. Verify email format (name@domain.com)
3. Ensure client has registered account
4. Try different email if available

**Prevention**: Double-check email before sending invitation

---

### Error: Project Already Exists
**When it happens**: Project with same details already exists  
**Error message**: "A project with this name already exists"  
**What it means**: You've already created a project with same name  
**How to fix**:
1. Use different project name
2. Check existing projects
3. Delete old project if no longer needed

**Prevention**: Use unique project names

---

### Error: Invitation Expired
**When it happens**: Client tries to accept expired invitation  
**Error message**: "Invitation has expired"  
**What it means**: 24-hour invitation window has passed  
**How to fix**:
1. Seller sends new invitation
2. Client clicks new invitation link
3. Project is accepted

**Prevention**: Client should accept within 24 hours

---

## Important Rules

### Rule 1: Project Seller Cannot Be Client
**What it means**: Seller and client must be different users  
**Why it exists**: Prevents self-projects and ensures proper workflow  
**Example**: 
- ✅ Seller A creates project, invites Buyer B
- ❌ Seller A creates project, invites themselves

**Exception**: None - seller and client must be different

---

### Rule 2: Invitation Is One-Time Use
**What it means**: Once client accepts invitation, token is invalidated  
**Why it exists**: Prevents duplicate acceptances  
**Example**: 
- Token sent to client
- Client clicks and accepts
- Token is now invalid
- Same token cannot be used again

**Exception**: None - tokens are one-time use

---

### Rule 3: Project Status Is Immutable
**What it means**: Project status can only move forward, not backward  
**Why it exists**: Maintains project integrity and audit trail  
**Example**: 
- ✅ pending → approved → in_progress → completed
- ❌ completed → in_progress (not allowed)

**Exception**: None - status only moves forward

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not auto-complete projects** - Must be manually marked complete
- **Does not support project templates** - Each project created from scratch
- **Does not allow project reassignment** - Seller and client are fixed
- **Does not support project archiving** - Completed projects remain visible

**Alternative Solutions:**
- For **project templates**, create similar projects manually
- For **project reassignment**, create new project with different seller
- For **archiving**, filter completed projects separately

---

## Technical Details

**For Developers:**

**API Endpoints:**
- `POST /api/projects/create/` - Create project
- `GET /api/projects/my-projects/` - List seller's projects
- `GET /api/projects/client-projects/` - List buyer's projects
- `DELETE /api/projects/delete/<id>/` - Delete project
- `POST /api/projects/invite/<token>/` - Accept invitation
- `PUT /api/projects/status-update/<id>/` - Update status
- `PUT /api/projects/complete/<id>/` - Mark complete

**Request Format:**
```json
{
  "name": "Website Redesign",
  "client_email": "john@company.com",
  "project_type": "real_project",
  "vat_rate": 20.0,
  "platform_fee_percentage": 10.0
}
```

**Response Format:**
```json
{
  "id": 123,
  "name": "Website Redesign",
  "status": "pending",
  "project_type": "real_project",
  "created_at": "2024-12-06T10:00:00Z",
  "invite_token": "abc123xyz...",
  "invite_token_expiry": "2024-12-07T10:00:00Z"
}
```

---

## Security Considerations

**Security Features:**
- Unique invitation tokens prevent unauthorized access
- Token expiration limits exposure window
- Project data encrypted in transit
- Access control ensures only seller/client can view project

**User Responsibilities:**
- Don't share invitation links with unauthorized users
- Verify client identity before inviting
- Keep project details confidential

**Warnings:**
- ⚠️ Don't share invitation links publicly
- ⚠️ Verify client email before sending invitation
- ⚠️ Use secure communication for sensitive project details

---

## Troubleshooting

### Problem: Client Can't Accept Invitation
**Symptoms**: Client clicks link but gets error  
**Possible causes**:
1. Invitation has expired
2. Client not registered on Safe Bill
3. Link is corrupted
4. Browser issue

**Solutions**:
1. Seller sends new invitation
2. Client registers account first
3. Try different browser
4. Clear browser cache

---

### Problem: Project Status Won't Update
**Symptoms**: Status change button doesn't work  
**Possible causes**:
1. Project not in correct status for change
2. Payment not completed
3. Milestones not approved
4. System error

**Solutions**:
1. Check current project status
2. Complete payment if required
3. Approve all milestones
4. Try again later

---

## Glossary

**Project**: Work agreement between seller and buyer  
**Invitation Token**: Unique code for accepting project  
**Project Status**: Current stage of project lifecycle  
**Milestone**: Deliverable or phase of project  
**Real Project**: Full project with milestones and payments  
**Quote Chat**: Simple quote request  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Flow_User_Login
- Feature_Seller_Discovery_Filtering

**Read this next:**
- Feature_Milestone_Payment_System
- Feature_Real_Time_Chat

**Related topics:**
- Error_Project_Errors
- Flow_Project_Creation

