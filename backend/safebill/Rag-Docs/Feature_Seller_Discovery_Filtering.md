---
# Document Identity
doc_id: feature_seller_discovery_001
title: Seller Discovery & Filtering
category: Feature
feature: Seller Discovery

# Audience & Access
user_roles: Buyer, Professional Buyer
difficulty: Beginner
prerequisites: [Flow_User_Login]

# Content Classification
topics: [Seller Discovery, Search, Filtering, Seller Profiles, Service Categories]
keywords: [find sellers, search professionals, filter by service, seller discovery, professional search]
use_cases: [Finding service providers, Searching by category, Filtering by location, Advanced seller search]

# Relationships
related_docs: [Feature_Seller_Ratings_Reviews, Guide_How_To_Find_Professionals, Error_Search_Errors, Component_Search_System_Overview]
parent_doc: null
child_docs: null

# Status
version: 1.0
last_updated: 2024-12-06
status: Active
reviewed_by: null
---

# Seller Discovery & Filtering

## Document Metadata
- **Feature**: Seller Discovery & Filtering
- **Category**: Feature
- **User Roles**: Buyer, Professional Buyer
- **Dependencies**: User authentication, seller profiles
- **Enabled By Default**: Yes

---

## Quick Summary

Seller Discovery & Filtering is the system that allows buyers to find and filter service providers on Safe Bill. Buyers can search by service type, location, service area, skills, and other criteria to find the right professional for their project. The system provides multiple filtering options and displays seller profiles with ratings, reviews, and service information.

**Key Capabilities:**
- Search all sellers on platform
- Filter by service type/category
- Filter by service area
- Filter by location/region
- Filter by skills
- Combined advanced filtering
- View seller profiles and ratings
- Sort results by rating, experience, etc.

**Use Cases:**
- Finding electrician in specific area
- Searching for web developers with specific skills
- Finding professionals in specific region
- Browsing all available sellers
- Comparing multiple sellers

---

## How It Works

### Component 1: Service Type Filtering

**Purpose**: Filter sellers by their service categories  
**How it works**: 
- Sellers select service categories during onboarding
- Buyers filter by one or more categories
- System returns sellers matching selected categories
- Results show seller details and ratings

**Example**: 
```
Filter: Service Type = "Electrical Work"
Results: All sellers offering electrical services
```

---

### Component 2: Location-Based Filtering

**Purpose**: Find sellers in specific geographic areas  
**How it works**: 
- Sellers provide service address and service areas
- Buyers filter by location or region
- System uses geographic data to match
- Results show sellers serving that area

**Example**: 
```
Filter: Location = "Paris, France"
Results: All sellers operating in Paris
```

---

### Component 3: Skills Filtering

**Purpose**: Find sellers with specific skills  
**How it works**: 
- Sellers list their skills during onboarding
- Buyers filter by specific skills
- System matches seller skills with search criteria
- Results show sellers with matching skills

**Example**: 
```
Filter: Skills = ["React", "Node.js", "MongoDB"]
Results: Web developers with these specific skills
```

---

### Component 4: Advanced Filtering

**Purpose**: Combine multiple filters for precise search  
**How it works**: 
- Buyers can combine service type, location, skills, rating
- System applies all filters simultaneously
- Results show sellers matching ALL criteria
- Buyers can refine search progressively

**Example**: 
```
Filters:
- Service Type: "Web Development"
- Location: "London"
- Minimum Rating: 4.5 stars
- Skills: "React"

Results: Web developers in London with React skills and 4.5+ rating
```

---

## Feature Configuration

**Default Settings:**
- **Results Per Page**: 20 sellers
- **Sort Order**: By rating (highest first)
- **Filters Shown**: Service type, location, rating
- **Advanced Filters**: Available on separate page

**Customizable Settings:**
- **Results Per Page**: 10, 20, 50, 100
- **Sort Order**: Rating, experience, price, newest
- **Filter Visibility**: Show/hide specific filters
- **Search Radius**: For location-based search

---

## Using This Feature

### As a Buyer

**What you can do:**
- Search all sellers on platform
- Filter by service type
- Filter by location
- Filter by skills
- View seller profiles
- See seller ratings and reviews
- Contact sellers

**Step-by-step:**
1. Go to "Find Professionals" page
2. Enter search criteria (optional)
3. Select filters (service type, location, etc.)
4. View results
5. Click seller profile to see details
6. Contact seller to discuss project

**Example:**
```
1. Click "Find Professionals"
2. Select "Electrical Work" category
3. Enter "Paris" as location
4. Filter by minimum 4.5 stars
5. View results
6. Click on seller "Marie's Electrical Services"
7. Review profile and ratings
8. Click "Contact Seller"
```

---

## Feature Interactions

**Works with:**
- **Seller Profiles**: Displays seller information and ratings
- **Seller Ratings**: Shows average rating and review count
- **Project Creation**: Allows buyer to create project after finding seller
- **Messaging**: Enables communication with sellers

**Conflicts with:**
- None identified

---

## Common Questions

**Q: How do I find a seller in my area?**  
A: Go to "Find Professionals", enter your location in the location filter, and select your service type. Results will show sellers operating in your area.

**Q: Can I filter by multiple criteria at once?**  
A: Yes, you can combine filters for service type, location, skills, and rating. All filters work together to narrow results.

**Q: How are search results sorted?**  
A: By default, results are sorted by seller rating (highest first). You can change sort order to experience, newest, or price.

**Q: What information is shown in seller profiles?**  
A: Seller profiles show: name, company, service categories, location, average rating, number of reviews, skills, about section, and contact information.

**Q: Can I save my favorite sellers?**  
A: This feature is not currently available. You can bookmark seller profiles in your browser.

**Q: How often is seller information updated?**  
A: Seller information is updated in real-time when they make changes to their profile.

**Q: Can I see seller availability?**  
A: Seller availability is shown in their profile. Some sellers may indicate when they're available for new projects.

**Q: How are sellers ranked?**  
A: Sellers are ranked by average rating (calculated from all buyer reviews). More ratings = more reliable ranking.

---

## What Can Go Wrong

### Error: No Results Found
**When it happens**: Your search/filter criteria returns no sellers  
**Error message**: "No sellers found matching your criteria"  
**What it means**: No sellers match all your filter criteria  
**How to fix**:
1. Broaden your filters (remove some criteria)
2. Try different service type
3. Expand geographic area
4. Lower minimum rating requirement
5. Browse all sellers without filters

**Prevention**: Start with broad filters, then narrow down

---

### Error: Search Timeout
**When it happens**: Search takes too long to complete  
**Error message**: "Search timed out. Please try again."  
**What it means**: Server couldn't process search in time  
**How to fix**:
1. Simplify your search criteria
2. Remove some filters
3. Try again in a few minutes
4. Contact support if problem persists

**Prevention**: Use fewer filters for faster results

---

### Error: Invalid Filter Value
**When it happens**: You enter invalid data in a filter  
**Error message**: "Invalid filter value. Please check your input."  
**What it means**: The filter value is not valid  
**How to fix**:
1. Check filter input for typos
2. Use only valid values from dropdown
3. Try again with correct format

**Prevention**: Use dropdown menus instead of typing

---

## Important Rules

### Rule 1: Filters Are Cumulative
**What it means**: When you select multiple filters, only sellers matching ALL criteria are shown  
**Why it exists**: Helps buyers find exactly what they need  
**Example**: 
- Filter 1: Service Type = "Electrical"
- Filter 2: Location = "Paris"
- Result: Only sellers offering electrical services in Paris

**Exception**: None - all filters work together

---

### Rule 2: Seller Information Is Public
**What it means**: Seller profiles and ratings are visible to all users  
**Why it exists**: Helps buyers make informed decisions  
**Example**: Any buyer can see seller's name, rating, reviews, services

**Exception**: Contact information is private until seller approves contact

---

### Rule 3: Ratings Affect Visibility
**What it means**: Sellers with higher ratings appear higher in search results  
**Why it exists**: Helps buyers find quality sellers  
**Example**: 5-star seller appears before 3-star seller

**Exception**: None - rating-based sorting is default

---

## Limitations

**What This Feature Does NOT Do:**
- **Does not guarantee seller availability** - Sellers may not accept all projects
- **Does not show real-time availability** - Availability is static in profile
- **Does not allow messaging before contact** - Must use contact form first
- **Does not show pricing** - Prices are negotiated per project
- **Does not show past projects** - Only ratings and reviews shown

**Alternative Solutions:**
- For **real-time availability**, contact seller directly
- For **pricing information**, request quote from seller
- For **past project details**, ask seller in message

---

## Technical Details

**For Developers:**

**API Endpoints:**
- `GET /api/accounts/all-sellers/` - List all sellers
- `GET /api/accounts/filter-sellers-by-service-type/` - Filter by service type
- `GET /api/accounts/filter-sellers-by-service-area/` - Filter by service area
- `GET /api/accounts/filter-sellers-by-type-and-area/` - Combined filter
- `GET /api/accounts/filter-sellers-by-type-area-and-skills/` - Advanced filter
- `GET /api/accounts/filter-sellers-by-location/` - Filter by location
- `GET /api/accounts/filter-sellers-by-region/` - Filter by region
- `GET /api/accounts/seller/<id>/` - Get seller details

**Request Format:**
```json
{
  "service_type": "electrical",
  "location": "Paris",
  "min_rating": 4.0,
  "skills": ["wiring", "installation"],
  "page": 1,
  "per_page": 20
}
```

**Response Format:**
```json
{
  "count": 45,
  "results": [
    {
      "id": 42,
      "name": "Marie Dupont",
      "company_name": "Dupont Electrical",
      "service_categories": ["electrical", "maintenance"],
      "location": "Paris",
      "average_rating": 4.8,
      "rating_count": 23,
      "skills": ["wiring", "installation"]
    }
  ]
}
```

**Authentication Required**: No (public endpoint)  
**Rate Limits**: 100 requests per minute

---

## Security Considerations

**Security Features:**
- Public seller information only - no sensitive data exposed
- Ratings and reviews are verified
- Contact information protected until approval
- Search queries logged for analytics

**User Responsibilities:**
- Verify seller credentials before hiring
- Check ratings and reviews carefully
- Communicate clearly about project scope

**Warnings:**
- ⚠️ Don't share payment information in initial contact
- ⚠️ Verify seller identity before sending deposits
- ⚠️ Use platform messaging for all communications

---

## Troubleshooting

### Problem: Search Results Are Too Broad
**Symptoms**: Too many results, hard to find right seller  
**Possible causes**:
1. Filters are too general
2. Not using all available filters
3. Searching in large geographic area

**Solutions**:
1. Add more specific filters
2. Use advanced filtering
3. Narrow geographic area
4. Filter by minimum rating
5. Filter by specific skills

---

### Problem: Can't Find Seller I'm Looking For
**Symptoms**: Seller exists but doesn't appear in results  
**Possible causes**:
1. Seller hasn't completed profile
2. Seller not offering your service type
3. Seller not in your geographic area
4. Seller profile is inactive

**Solutions**:
1. Try searching without filters
2. Broaden geographic area
3. Try different service type
4. Contact support with seller name

---

## Glossary

**Service Category**: Type of service offered (e.g., electrical work, web development)  
**Service Area**: Geographic area where seller provides services  
**Skills**: Specific abilities or expertise of seller  
**Rating**: Average score given by buyers (1-5 stars)  
**Filter**: Criteria to narrow search results  

---

## Version History

- **v1.0** (2024-12-06): Initial documentation created

---

## Related Documentation

**Read this first:**
- Flow_User_Login

**Read this next:**
- Feature_Seller_Ratings_Reviews
- Guide_How_To_Find_Professionals

**Related topics:**
- Error_Search_Errors
- Component_Search_System_Overview

