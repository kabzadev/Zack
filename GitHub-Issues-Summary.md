# GitHub Issues Summary — Pinpoint Estimating App

## Created Issues: https://github.com/kabzadev/zach/issues

### Phase 1: Core Functionality (Due: March 15)

| Issue | Title | Type |
|-------|-------|------|
| #1 | [EPIC] Customer Management System | Epic |
| #2 | [USER STORY] Create new customer | User Story |
| #3 | [USER STORY] Search existing customers | User Story |
| #4 | [EPIC] Estimate Builder with Labor + Materials | Epic |
| #5 | [USER STORY] Generate PDF estimate | User Story |
| #6 | [EPIC] Offline-First Data Storage | Epic |
| #9 | [USER STORY] Share estimate via SMS/Email | User Story |
| #12 | [TASK] Set up React project with TypeScript | Task |
| #18 | [EPIC] SMS Authentication with Twilio Verify | Epic |
| #19 | [EPIC] Admin User Approval Workflow | Epic |

### Phase 2: Voice AI, Cloud & Visual (Due: April 15)

| Issue | Title | Type |
|-------|-------|------|
| #7 | [EPIC] ElevenLabs Voice Agent Integration | Epic |
| #8 | [EPIC] Blob Storage for Photos | Epic |
| #10 | [EPIC] Sherwin-Williams Color System | Epic |
| #11 | [USER STORY] AI color visualization on house photos | User Story |
| #14 | [GAP] Digital Signatures | Gap |
| #17 | [EPIC] Photo Capture & AI Color Visualization (Google Gemini) | Epic |

### Phase 3: Admin & Business (Due: May 15)

| Issue | Title | Type |
|-------|-------|------|
| #13 | [GAP] Change Orders & Extras | Gap |
| #15 | [GAP] Customer Portal | Gap |
| #16 | [EPIC] Role-Based Access Control (RBAC) & Admin System | Epic |

## UX Mockups (13 total in `/docs` folder)

| Screen | Description | Role Access |
|--------|-------------|-------------|
| **phone-login.html** | SMS auth — phone number entry | All (unauth) |
| **otp-verify.html** | 6-digit code verification | All (unauth) |
| **approval-pending.html** | Waiting screen for new users | All (pending) |
| dashboard.html | Home with New Estimate CTA, stats | All users |
| customer-list.html | Searchable customer database | All users |
| estimate-builder.html | Labor/materials calculator | All users |
| **estimate-pdf-template.html** | Modern PDF output design | All users |
| color-picker.html | SW color picker & AI suggestions | All users |
| photo-capture.html | Camera with type tagging | All users |
| photo-gallery.html | Photo library with Originals/AI tabs | All users |
| ai-color-visualization.html | Google Gemini before/after preview | All users |
| voice-mode.html | ElevenLabs voice agent modal | All users |
| **admin-user-management.html** | Approve/decline new users | Admin only |
| admin-panel.html | Team management, audit logs | Admin only |

## AI Integrations

| Service | Purpose | Cost |
|---------|---------|------|
| Twilio Verify | SMS OTP authentication | ~$0.05/SMS |
| ElevenLabs | Voice agent conversations | $5-50/mo |
| Google Gemini 1.5 Flash | Photo color visualization | $0.13-0.50/mo |

## Milestones

1. **Phase 1: Core + Auth** — Due March 15, 2026
2. **Phase 2: Voice AI, Cloud & Visual** — Due April 15, 2026
3. **Phase 3: Admin & Business** — Due May 15, 2026

---
*Updated 2026-02-05 — 20 total issues*
