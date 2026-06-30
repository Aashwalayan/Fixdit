<div align="center">
<img alt="GHBanner" src="public/favicon.png" />
</div>

<h1 align="center">Fixdit</h1>
<p align="center"><em>AI-powered civic issue reporting and resolution platform</em></p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-active-brightgreen" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue" />
  <img alt="Made with" src="https://img.shields.io/badge/made%20with-MERN-61DAFB" />
  <img alt="AI" src="https://img.shields.io/badge/AI-Gemini-orange" />
  <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-purple" />
</p>

<p align="center">
  <a href="#1-project-description">Description</a> •
  <a href="#2-key-features">Features</a> •
  <a href="#3-ai-powered-analysis">AI Analysis</a> •
  <a href="#4-interactive-map">Map</a> •
  <a href="#13-live-demo">Live Demo</a> •
  <a href="#16-why-fixdit">Why Fixdit?</a>
</p>

---

## Table of Contents

1. [Project Description](#1-project-description)
2. [Key Features](#2-key-features)
3. [AI-Powered Analysis](#3-ai-powered-analysis)
4. [Interactive Map](#4-interactive-map)
5. [Issue Reporting](#5-issue-reporting)
6. [Community Features](#6-community-features)
7. [Notification System](#7-notification-system)
8. [Personalization](#8-personalization)
9. [Activity Dashboard](#9-activity-dashboard)
10. [User Roles](#10-user-roles)
11. [Tech Stack](#11-tech-stack)
12. [Database Schema](#12-database-schema)
13. [Live Demo](#13-live-demo)
14. [API Overview](#14-api-overview)
15. [Application Flow](#15-application-flow)
16. [Why Fixdit?](#16-why-fixdit)

---

## 1. Project Description

**Fixdit** is a community-driven civic issue reporting platform that lets citizens report local problems — potholes, broken streetlights, garbage accumulation, water leaks, and more — directly to the relevant municipal department. Instead of relying on manual triage, Fixdit uses **Google Gemini** to analyze a reported issue's image and description, automatically classifying its category, estimating its severity, and routing it to the correct department.

The platform combines structured issue tracking with social, community-driven prioritization — citizens can upvote, downvote, and comment on reports, while officials and admins manage resolution through a dedicated dashboard. Fixdit is deployed on **Google Cloud Run** for scalable, reliable hosting. The result is a faster, more transparent, and more accountable civic reporting loop.

---

## 2. Key Features

<table>
<tr>
<td width="50%">

**🧠 AI & Intelligence**
- AI-powered issue analysis
- Smart department assignment

</td>
<td width="50%">

**👥 Community**
- Interactive community feed
- Upvotes & downvotes
- Comments
- Saved reports

</td>
</tr>
<tr>
<td width="50%">

**🔔 Real-Time**
- Live notifications
- Interactive map
- Activity tracking

</td>
<td width="50%">

**🛠️ Administration**
- Official dashboard
- Admin controls
- Responsive UI

</td>
</tr>
</table>

---

## 3. AI-Powered Analysis

Fixdit integrates **Google Gemini** to transform a raw photo and short description into a fully structured, actionable civic report.

| Capability | Description |
|---|---|
| **Image Understanding** | Gemini analyzes the uploaded issue photo to understand the physical context of the problem. |
| **Category Detection** | Automatically classifies the issue (e.g. roads, sanitation, electricity, water). |
| **Severity Estimation** | Assigns a severity level based on visual and contextual cues. |
| **AI Summary Generation** | Produces a concise, human-readable summary of the issue. |
| **Automatic Department Assignment** | Routes the report to the correct municipal department without manual triage. |

> 💡 **Why it matters:** What once required manual review by a municipal employee now happens in seconds — reducing backlog and ensuring no report sits unclassified.

---

## 4. Interactive Map

Fixdit visualizes every reported issue geographically, giving both citizens and officials a real-time picture of civic problems in their area.

| Feature | Description |
|---|---|
| **Leaflet Integration** | Powers the interactive, pannable, zoomable map view. |
| **OpenStreetMap** | Provides free, open-source map tile data. |
| **Location Detection** | Automatically detects the reporter's current location for accurate tagging. |
| **Severity-Colored Markers** | Markers are color-coded by severity for instant visual triage. |
| **Nearby Issues** | Citizens can browse and explore issues reported near them. |

---

## 5. Issue Reporting

Reporting an issue on Fixdit captures everything needed for a department to act on it — automatically.

| Field | Description |
|---|---|
| **Images** | Photo evidence of the issue |
| **Title** | Short identifying name |
| **Description** | Citizen-provided context |
| **Location** | Geo-coordinates / address |
| **Timestamp** | Time of submission |
| **AI Summary** | Gemini-generated summary |
| **Severity** | AI-estimated severity level |
| **Category** | AI-detected issue category |
| **Assigned Department** | Auto-routed department |
| **Status** | Current resolution state |
| **Votes** | Community upvotes/downvotes |
| **Comments** | Community discussion thread |
| **Reporter** | Citizen who filed the report |

---

## 6. Community Features

Fixdit treats civic reporting as a collective effort, not a one-way submission.

- **Community Voting** — Citizens vote on the urgency and legitimacy of reports.
- **Upvotes** — Signal high-priority or widely affecting issues.
- **Downvotes** — Flag duplicate, irrelevant, or low-priority reports.
- **Comment System** — Discuss context, updates, or additional evidence.
- **Saved Reports** — Bookmark issues to track later.
- **Community-Driven Prioritization** — Vote counts help surface the most pressing issues to officials.

---

## 7. Notification System

| Notification | Trigger |
|---|---|
| 👋 Welcome Notification | Sent on successful account creation |
| 🚀 Getting Started Notification | Guides new users through their first report |
| 👍 Vote Notifications | Alerts when a report receives votes |
| 💬 Comment Notifications | Alerts on new comments |
| 📍 Status Updates | Notifies reporters as their issue progresses |
| 🏛️ Official Responses | Notifies when an official responds to a report |

---

## 8. Personalization

Fixdit adapts to each user's civic activity and preferences.

- **Profile Management** — Update personal details and preferences.
- **Saved Reports** — A personal collection of bookmarked issues.
- **Personalized Feeds** — Reports surfaced based on location and interests.
- **Preferences** — Control notification and display settings.

---

## 9. Activity Dashboard

<table>
<tr><th>Metric</th><th>Description</th></tr>
<tr><td><strong>Reports Filed</strong></td><td>Total issues submitted by the user</td></tr>
<tr><td><strong>Saved Reports</strong></td><td>Issues bookmarked for tracking</td></tr>
<tr><td><strong>Upvoted Reports</strong></td><td>Issues the user has upvoted</td></tr>
<tr><td><strong>Commented Reports</strong></td><td>Issues the user has participated in</td></tr>
<tr><td><strong>Official Applications</strong></td><td>Status of applications to become an official</td></tr>
</table>

---

## 10. User Roles

| Capability | Citizen / User | Official | Admin |
|---|:---:|:---:|:---:|
| Register | ✅ | — | — |
| Report Issues | ✅ | — | — |
| Vote | ✅ | — | — |
| Comment | ✅ | — | — |
| Save Posts | ✅ | — | — |
| View Notifications | ✅ | ✅ | ✅ |
| Track Activity | ✅ | ✅ | ✅ |
| View Assigned Reports | — | ✅ | ✅ |
| Update Issue Status | — | ✅ | ✅ |
| Respond to Users | — | ✅ | ✅ |
| Manage Department Workload | — | ✅ | — |
| Manage Officials | — | — | ✅ |
| Approve Official Applications | — | — | ✅ |
| Access Every Report | — | — | ✅ |
| Full Moderation | — | — | ✅ |
| System Administration | — | — | ✅ |

> ⚠️ **The Admin role is atomic.** There can only be **one Admin** at any given time. The Admin holds full system-wide authority — managing officials, approving applications, and moderating every report on the platform.

---

## 11. Tech Stack

**Frontend**

<img alt="React" src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" /> <img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwind-css&logoColor=white" />

**Backend**

<img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white" /> <img alt="Express" src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" />

**Database**

<img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" />

**Authentication**

<img alt="JWT" src="https://img.shields.io/badge/JWT-black?logo=jsonwebtokens" /> <img alt="OTP" src="https://img.shields.io/badge/Auth-OTP%20Verified-blue" />

**AI**

<img alt="Gemini" src="https://img.shields.io/badge/Google%20Gemini-AI-orange" />

**Maps**

<img alt="Leaflet" src="https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=white" /> <img alt="OSM" src="https://img.shields.io/badge/OpenStreetMap-7EBC6F?logo=openstreetmap&logoColor=white" />

**Email Service**

<img alt="Resend" src="https://img.shields.io/badge/Resend-Email-black" />

**Deployment**

<img alt="Google Cloud Run" src="https://img.shields.io/badge/Google%20Cloud%20Run-4285F4?logo=googlecloud&logoColor=white" />

**Cloud Deployment**

Fixdit is containerized with **Docker**, built using **Google Cloud Build**, and stored in **Artifact Registry**. The container image is deployed on **Google Cloud Run**, served over **HTTPS**, and automatically scales with serverless infrastructure to handle traffic on demand.

---

## 12. Database Schema

<details>
<summary><strong>User</strong></summary>

| Field | Description |
|---|---|
| `_id` | Unique user identifier |
| `name` | Full name |
| `email` | Email address |
| `password` | Hashed credential |
| `role` | Citizen / Official / Admin |
| `savedReports` | References to saved reports |
| `activity` | Aggregated activity stats |
| `createdAt` | Account creation timestamp |

</details>

<details>
<summary><strong>Official Application</strong></summary>

| Field | Description |
|---|---|
| `_id` | Unique application identifier |
| `applicantId` | Reference to applying user |
| `department` | Requested department |
| `status` | Pending / Approved / Rejected |
| `submittedAt` | Application submission timestamp |
| `reviewedBy` | Admin who reviewed the application |

</details>

<details>
<summary><strong>Post (Issue Report)</strong></summary>

| Field | Description |
|---|---|
| `_id` | Unique report identifier |
| `title` | Report title |
| `description` | Citizen description |
| `images` | Uploaded image URLs |
| `location` | Geo-coordinates |
| `aiSummary` | Gemini-generated summary |
| `category` | AI-detected category |
| `severity` | AI-estimated severity |
| `department` | Assigned department |
| `status` | Current resolution status |
| `votes` | Upvote/downvote counts |
| `comments` | Comment thread references |
| `reporterId` | Reference to reporting user |
| `createdAt` | Submission timestamp |

</details>

<details>
<summary><strong>Notification</strong></summary>

| Field | Description |
|---|---|
| `_id` | Unique notification identifier |
| `userId` | Recipient user reference |
| `type` | Notification category |
| `message` | Notification content |
| `isRead` | Read/unread state |
| `createdAt` | Notification timestamp |

</details>

---

## 13. Live Demo

🚀 **Try Fixdit live:** [https://fixdit-315926063982.asia-south1.run.app/](https://fixdit-315926063982.asia-south1.run.app/)

📦 **Repository:** [github.com/Aashwalayan/fixdit](https://github.com/your-username/fixdit)

---

## 14. API Overview

| Category | Description |
|---|---|
| **Authentication** | Registration, OTP verification, login, and session management |
| **Posts** | Create, fetch, update, and manage issue reports |
| **AI Analysis** | Endpoints powering Gemini-based image and metadata analysis |
| **Voting** | Upvote and downvote operations on reports |
| **Comments** | Add, fetch, and manage comments on reports |
| **Notifications** | Fetch and mark notifications as read |
| **Personalization** | Manage saved reports, preferences, and personalized feeds |
| **Activity** | Retrieve user activity and engagement statistics |
| **Official Dashboard** | Endpoints for officials to manage assigned reports |
| **Admin** | Endpoints for managing officials, applications, and moderation |

---

## 15. Application Flow

<div align="center">

**Register**
↓
**Receive OTP through Resend Email**
↓
**Verify Account**
↓
**Login**
↓
**Upload Issue Image**
↓
**Gemini AI Analysis**
↓
**AI Generates Metadata**
↓
**Submit Report**
↓
**Community Interaction**
↓
**Official Response**
↓
**Issue Resolved**

</div>

---

## 16. Why Fixdit?

Civic issue reporting has traditionally been slow, opaque, and inconsistent. Citizens file complaints through scattered channels — phone calls, paper forms, or disconnected portals — with little visibility into what happens next. Reports often sit unclassified, waiting on manual review before they even reach the right department, while the people who reported them are left wondering if anything is being done at all.

Fixdit addresses these problems directly:

- **No more manual categorization** — Gemini classifies and routes every report instantly.
- **No more black-box reporting** — every issue has visible status, votes, and discussion.
- **No more slow response cycles** — AI-driven triage means departments see prioritized, pre-classified issues immediately.
- **Real community involvement** — voting and comments let the community itself help prioritize what matters most.

By combining AI-driven automation with transparent, community-powered prioritization, Fixdit turns civic reporting from a one-way complaint box into a living, accountable system — one where citizens, officials, and administrators work from the same source of truth.

<p align="center"><strong>Fixdit — reporting that gets resolved, not lost.</strong></p>
