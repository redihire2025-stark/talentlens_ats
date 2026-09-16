Design a modern SaaS web application called **TalentLens**.

Tagline:
**Smarter Resume & Talent Matching**

TalentLens is a two-sided career and hiring intelligence platform designed for both:

1. Job seekers
2. Recruiters / hiring teams

The initial V1 product is focused on job seekers, but the visual language and information architecture must be designed so recruiter functionality can be added later without redesigning the entire product.

## PRODUCT VISION

TalentLens helps users understand how well a resume performs against modern ATS-style screening requirements and, optionally, how well the resume matches a specific Job Description.

The product should NOT feel like a generic resume builder.

It should feel like a modern AI-powered career intelligence platform.

The experience should be:

* Professional
* Trustworthy
* Clean
* Fast
* Data-driven
* Friendly
* Accessible
* Modern SaaS
* Minimal but visually impressive

Avoid excessive gradients, excessive glassmorphism, cartoon-style illustrations, or overly decorative UI.

The product should feel credible enough for recruiters while remaining approachable for job seekers.

---

# PRIMARY V1 USER JOURNEY

Landing Page
→ Choose "Check My Resume"
→ Upload Resume
→ Resume Processing
→ ATS Analysis
→ ATS Score Dashboard
→ Optional Job Description
→ Resume ↔ JD Match Analysis
→ Suggestions
→ Resume Optimization
→ Before/After comparison
→ Recalculate score
→ Export Resume

The user must NOT be required to create an account in V1.

The application should work as an anonymous session.

---

# LANDING PAGE

Create a premium SaaS landing page.

Header:

TalentLens logo

Navigation:

* Resume Checker
* Resume Matcher
* Resume Optimizer
* For Recruiters

Right side:

* Get Started

Hero:

Headline:
**Know how your resume performs before you apply.**

Subheadline:
**Analyze your resume, understand ATS compatibility, match it against a job description, and improve it with actionable recommendations.**

Primary CTA:
**Check My Resume**

Secondary CTA:
**Match With a Job**

Include a subtle visual representation of the TalentLens analysis dashboard.

Show trust-oriented messaging:

* ATS Compatibility
* Skill Matching
* Resume Quality
* Job Description Analysis
* Actionable Recommendations

Do not make unsupported claims such as "works with every ATS" or "guarantees interviews."

---

# USER TYPE SELECTION

Create a simple optional entry point:

**What are you here to do?**

Cards:

### Job Seeker

Check, improve, and tailor your resume.

CTA:
**Improve My Resume**

### Recruiter

Analyze jobs and evaluate candidate fit.

CTA:
**Explore Recruiting**

The recruiter experience can be marked "Coming Soon" in V1.

---

# RESUME UPLOAD

Create a beautiful drag-and-drop upload experience.

Heading:
**Let's analyze your resume**

Supported formats:
PDF, DOCX

Upload area:

Drag & drop your resume here

or

Browse Files

Show:

* File name
* File size
* File type
* Upload progress
* Remove file

Privacy messaging:

**Your resume is processed for analysis and isn't required to create an account.**

Include clear loading states.

---

# PROCESSING SCREEN

Create an intelligent processing animation.

Steps:

✓ Reading resume
✓ Extracting sections
✓ Identifying skills
✓ Analyzing experience
✓ Checking ATS compatibility
○ Preparing recommendations

Do not make it look like fake AI processing.

The UI should communicate actual analysis stages.

---

# ATS SCORE DASHBOARD

Create the main results dashboard.

Hero score:

**87 / 100**

Label:

**ATS Compatibility**

Supporting message:

Your resume is highly compatible with common ATS-style parsing and screening requirements.

Show score breakdown:

Parsing
96%

Sections
100%

Keywords
82%

Experience
91%

Skills Evidence
85%

Formatting
94%

Content Quality
81%

Use clear visual indicators.

Do not rely only on colors.

---

# RESUME HEALTH

Create cards:

### Structure

Strong

### Skills

Good

### Experience

Strong

### Keywords

Needs Improvement

### Formatting

Strong

### Content Impact

Needs Improvement

Each card should contain:

Status
Score
Short explanation
"View details"

---

# JOB DESCRIPTION MATCH

Create a separate experience.

Heading:

**How well does your resume match this job?**

Allow the user to:

Paste Job Description

or

Upload Job Description

Show:

JD Match Score
84 / 100

Breakdown:

Required Skills
92%

Preferred Skills
71%

Experience
96%

Responsibilities
83%

Job Title
90%

Education
100%

---

# SKILL MATCHING

Create a visual skill analysis.

Matched:

✓ React
✓ TypeScript
✓ JavaScript
✓ REST APIs
✓ AWS

Missing:

× Next.js
× Docker

Partially demonstrated:

△ GraphQL
△ CI/CD

Important UX rule:

Never imply that a missing skill should simply be added to the resume.

Explain that missing skills should only be added if the candidate genuinely has that experience.

---

# RECOMMENDATIONS

Create recommendation cards.

Example:

### Improve this bullet

Current:

Built React applications.

Suggested:

Built reusable React components used across multiple production applications.

Buttons:

Accept
Reject
Edit

Show impact:

**Potential improvement**
ATS relevance +4

Do not guarantee that a particular edit will increase a real-world hiring outcome.

---

# RESUME EDITOR

Create a structured resume editor.

Left side:

Resume sections:

* Contact
* Summary
* Skills
* Experience
* Education
* Projects
* Certifications

Center:

Editable resume

Right side:

Live TalentLens score

Example:

ATS Compatibility
87 → 91

JD Match
84 → 89

When an edit is made, update the analysis indicators.

---

# BEFORE / AFTER

Create a comparison view.

LEFT:

Original Resume

RIGHT:

Optimized Resume

Highlight changed sections.

Show:

Original Score
82

Optimized Score
89

Include:

View Changes

Revert Changes

---

# RESUME VERSIONS

Create version controls:

Original
Version 1
Version 2
Frontend Engineer - Company A
Senior Engineer - Company B

Each version should be visually distinguishable.

---

# EXPORT

Create export modal:

**Your resume is ready**

Options:

Download PDF
Download DOCX

Also provide:

Continue Editing

---

# RECRUITER FUTURE EXPERIENCE

Create a preview/placeholder for recruiter functionality.

Recruiter dashboard concept:

Jobs
Candidates
Match Scores
Shortlists

Example:

Job:
Senior Frontend Engineer

Candidate:
Candidate A

Match:
91%

Skills:
React ✓
TypeScript ✓
AWS ✓
Docker △

Do not create ranking or recommendation language that implies TalentLens makes the hiring decision.

Use language such as:

**Match Insights**
**Candidate Profile**
**Evidence**
**Skills Alignment**

The recruiter remains the decision maker.

---

# DESIGN SYSTEM

Create a reusable design system.

Typography:
Modern SaaS typography with strong hierarchy.

Use:

* Large expressive headings
* Compact dashboard typography
* Clear body text
* Accessible font sizes

Colors:
Use a restrained professional palette.

Primary:
Deep indigo / blue

Supporting:
Neutral grays

Success:
Green

Warning:
Amber

Critical:
Red

Do not make the entire interface colorful.

Use color primarily for status and data visualization.

Components:

* Buttons
* Cards
* Inputs
* File upload
* Progress indicators
* Score rings
* Progress bars
* Badges
* Tabs
* Dropdowns
* Modals
* Tooltips
* Tables
* Empty states
* Error states
* Loading states
* Toast notifications

All components should be reusable.

---

# RESPONSIVE DESIGN

Design for:

Desktop
1440px

Laptop
1280px

Tablet
1024px

Mobile
390px

The dashboard must work well on mobile.

Do not simply shrink desktop layouts.

Reflow cards and sections appropriately.

---

# ACCESSIBILITY

Follow modern accessibility practices.

Ensure:

* Strong contrast
* Keyboard navigation
* Visible focus states
* Semantic labels
* Accessible forms
* Do not rely on color alone
* Screen-reader-friendly controls

---

# IMPORTANT PRODUCT PRINCIPLES

TalentLens must communicate:

1. Transparency
2. Evidence-based analysis
3. User control
4. Privacy
5. No fabricated resume content
6. No guaranteed interview claims
7. Clear explanation of why a score changed

The ATS score should always show a breakdown instead of presenting a mysterious number.

The product should feel like:

**"Your resume intelligence workspace."**

rather than:

**"Another resume template website."**

Create the complete V1 UI/UX flow, reusable design system, responsive screens, states, and clickable prototype.
