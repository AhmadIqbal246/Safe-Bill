---
# Document Identity
doc_id: feature_seller_ratings_001
title: Seller Ratings & Reviews
category: Feature
feature: Seller Ratings

# Audience & Access
user_roles: Buyer, Seller
difficulty: Beginner
prerequisites: [Feature_Project_Management]

# Content Classification
topics: [Ratings, Reviews, Seller Reputation, Review System, Rating Calculation]
keywords: [rating, review, seller rating, feedback, reputation]
use_cases: [Rating seller after project, Viewing seller ratings, Building reputation, Assessing quality]

# Relationships
related_docs: [Feature_Seller_Discovery_Filtering, Feature_Project_Management]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Seller Ratings & Reviews

## Document Metadata
- **Feature**: Seller Ratings & Reviews
- **Category**: Feature
- **User Roles**: Buyer, Seller
- **Dependencies**: Project management, completed projects
- **Enabled By Default**: Yes

---

## Quick Summary

Seller Ratings & Reviews system allows buyers to rate and review sellers after project completion. Each seller has an average rating (1-5 stars) calculated from all received ratings. Ratings are displayed on seller profiles and affect search rankings. Only buyers who completed projects with a seller can rate them.

**Key Capabilities:**
- Rate sellers 1-5 stars
- Write review comments
- View seller average rating
- See rating count
- Rate only completed projects
- Auto-calculate average rating
- Display ratings on profiles

**Use Cases:**
- Rating seller after project completion
- Providing feedback on quality
- Building seller reputation
- Assessing seller quality before hiring
- Comparing sellers

---

## How It Works

### Component 1: Rating System

**Purpose**: Quantify seller quality  
**How it works**: 
- Buyer rates seller 1-5 stars
- One rating per project
- Rating linked to specific project
- Average calculated automatically
- Displayed on seller profile

**Example**: 
```
Rating Scale:
1 star: Poor quality
2 stars: Below average
3 stars: Average
4 stars: Good
5 stars: Excellent
```

---

### Component 2: Review Comments

**Purpose**: Provide qualitative feedback  
**How it works**: 
- Buyer can write review text
- Comments displayed with rating
- Optional (rating alone is sufficient)
- Helps other buyers understand rating
- Preserved permanently

**Example**: 
```
Rating: 5 stars
Comment: "Excellent work! Marie delivered mockups ahead of schedule and they were perfect. Highly recommended!"
```

---

### Component 3: Average Rating Calculation

**Purpose**: Show overall seller quality  
**How it works**: 
- System calculates average of all ratings
- Updated automatically when new rating added
- Displayed as decimal (e.g., 4.8)
- Also shows total number of ratings
- Used for search ranking

**Example**: 
```
Seller: Marie Dupont
Total Ratings: 23
Average Rating: 4.8 stars
```

---

### Component 4: Rating Eligibility

**Purpose**: Ensure fair ratings  
**How it works**: 
- Only completed projects can be rated
- Only buyer can rate seller
- One rating per project
- Cannot rate own projects
- Cannot rate before completion

**Example**: 
```
Eligible: Buyer rates seller after project completion
Not Eligible: Buyer rates seller before completion
Not Eligible: Seller rates themselves
```

---

## Feature Configuration

**Default Settings:**
- **Rating Scale**: 1-5 stars
- **Comments**: Optional
- **Eligibility**: Completed projects only
- **Display**: Public on profile

**Customizable Settings:**
- **Comment Length**: Max 500 characters
- **Rating Visibility**: Public/private
- **Minimum Projects**: For rating eligibility

---

## Using This Feature

### As a Buyer

**What you can do:**
- Rate seller after project completion
- Write review comments
- View seller ratings
- See rating distribution
- Use ratings to find sellers

**Step-by-step:**
1. Complete project
2. Go to completed project
3. Click "Rate Seller"
4. Select star rating
5. Write optional comment
6. Submit rating

---

### As a Seller

**What you can do:**
- View your ratings
- See average rating
- Read review comments
- Track rating trends
- Improve based on feedback

**Step-by-step:**
1. Go to profile
2. View "Ratings" section
3. See average rating
4. Read review comments
5. Use feedback to improve

---

## Common Questions

**Q: Can I rate a seller before project completion?**  
A: No, you can only rate after project is completed.

**Q: Can I change my rating?**  
A: No, ratings are permanent. You can only rate once per project.

**Q: Can I see who rated me?**  
A: Yes, you can see buyer names and their ratings.

**Q: How is average rating calculated?**  
A: Average of all ratings received. For example, if you have ratings of 5, 4, 5, average is 4.67.

**Q: Do ratings affect search ranking?**  
A: Yes, sellers with higher ratings appear higher in search results.

**Q: Can I delete a rating?**  
A: No, ratings are permanent and cannot be deleted.

**Q: Can a seller respond to reviews?**  
A: Not currently. Sellers can only view ratings.

**Q: How many ratings do I need?**  
A: No minimum. Even one rating is displayed.

---

## What Can Go Wrong

### Error: Cannot Rate Yet
**When it happens**: Try to rate before project completion  
**Error message**: "Project must be completed before rating"  
**What it means**: Project status is not "completed"  
**How to fix**:
1. Wait for project to be marked complete
2. Check project status
3. Contact seller if project is stuck

**Prevention**: Rate only after project completion

---

### Error: Already Rated
**When it happens**: Try to rate same project twice  
**Error message**: "You have already rated this project"  
**What it means**: You already submitted a rating for this project  
**How to fix**:
1. View your existing rating
2. Cannot change rating
3. Rate different project

**Prevention**: Only rate once per project

---

### Error: Invalid Rating Value
**When it happens**: Submit invalid rating (not 1-5)  
**Error message**: "Rating must be between 1 and 5 stars"  
**What it means**: Invalid rating value  
**How to fix**:
1. Select valid rating (1-5)
2. Try again

**Prevention**: Use star selector

---

## Important Rules

### Rule 1: One Rating Per Project
**What it means**: Each buyer can rate each seller only once per project  
**Why it exists**: Prevents rating manipulation  
**Example**: 
- ✅ Rate seller once for Project A
- ❌ Rate seller twice for Project A

**Exception**: None - one rating per project

---

### Rule 2: Only Completed Projects Can Be Rated
**What it means**: Project must be marked complete before rating  
**Why it exists**: Ensures fair assessment of completed work  
**Example**: 
- ✅ Rate after project marked complete
- ❌ Rate while project in progress

**Exception**: None - completion required

---

### Rule 3: Ratings Are Permanent
**What it means**: Ratings cannot be changed or deleted  
**Why it exists**: Maintains integrity of rating system  
**Example**: 
- Rating submitted
- Cannot be changed
- Cannot be deleted
- Permanent record

**Exception**: None - ratings are permanent

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not support seller responses** - Sellers can only view ratings
- **Does not support rating disputes** - Ratings are final
- **Does not support anonymous ratings** - Buyer name shown
- **Does not support rating filtering** - All ratings displayed equally

**Alternative Solutions:**
- For **seller responses**, use chat or messaging
- For **rating disputes**, contact support
- For **anonymous ratings**, not available

---

## Technical Details

**For Developers:**

**API Endpoints:**
- `POST /api/accounts/rate-seller/` - Submit rating
- `GET /api/accounts/eligible-projects/<seller_id>/` - Get eligible projects
- `GET /api/accounts/seller/<id>/` - Get seller with ratings

**Request Format:**
```json
{
  "seller_id": 42,
  "project_id": 123,
  "rating": 5,
  "comment": "Excellent work!"
}
```

**Response Format:**
```json
{
  "id": 1,
  "seller_id": 42,
  "buyer_id": 100,
  "project_id": 123,
  "rating": 5,
  "comment": "Excellent work!",
  "created_at": "2024-12-06T10:00:00Z"
}
```

---

## Security Considerations

**Security Features:**
- Ratings linked to verified projects
- Buyer identity verified
- Rating integrity maintained
- No anonymous ratings

**User Responsibilities:**
- Rate honestly based on work quality
- Don't rate based on personal bias
- Provide constructive feedback
- Don't harass sellers in reviews

**Warnings:**
- ⚠️ Don't submit false ratings
- ⚠️ Don't rate based on personal issues
- ⚠️ Don't use reviews to harass
- ⚠️ Be honest and fair

---

## Troubleshooting

### Problem: Can't Find Rating Option
**Symptoms**: No "Rate Seller" button visible  
**Possible causes**:
1. Project not completed
2. Already rated this project
3. Not the buyer
4. Project type doesn't support ratings

**Solutions**:
1. Check project status
2. View existing rating
3. Verify you're the buyer
4. Contact support

---

## Glossary

**Rating**: Numerical score 1-5 stars  
**Review**: Text comment about seller  
**Average Rating**: Mean of all ratings received  
**Rating Count**: Total number of ratings received  
**Eligible Project**: Completed project that can be rated  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Feature_Project_Management

**Read this next:**
- Feature_Seller_Discovery_Filtering

**Related topics:**
- Guide_How_To_Rate_Seller

