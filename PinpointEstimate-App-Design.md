# Pinpoint Estimating App — Design Document

## Executive Summary
A mobile-first painting estimate app for contractors doing **interior & exterior** work. Built for speed on job sites. Generates professional PDF proposals instantly with customer management, photo storage, Sherwin-Williams color selection with AI suggestions, and ElevenLabs voice agent integration.

**Primary Goal:** Go from walkthrough to customer-ready estimate in under 3 minutes.

---

## Industry Context & Research Summary

**Problem:** Existing tools (Jobber, FreshPaint, Housecall Pro) force square-foot pricing that fails on residential repaint where every house has unique challenges — dormers, mullions, mantons.

**Solution:** Time + Materials approach based on contractor expertise, with AI-powered voice assistance via ElevenLabs.

---

## App Architecture

### Platform Strategy
- **Primary:** Progressive Web App (PWA)
  - Works on any phone/tablet
  - Offline-first, syncs when connected
- **Backend:** Lightweight API server
  - Customer database
  - Blob storage for images
  - ElevenLabs WebSocket bridge

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React + Tailwind CSS |
| State | LocalStorage (offline) + Zustand |
| Backend | Node.js + Express or Next.js API |
| Database | PostgreSQL (Neon) |
| Blob Storage | Cloudinary, AWS S3, or Backblaze B2 |
| PDF Generation | html2canvas + jsPDF (client-side) |
| Authentication | Twilio Verify (SMS OTP) |
| Voice AI | ElevenLabs Agent (WebSocket) |
| Visual AI | Google Gemini 1.5 Flash API |
| WebSocket | Socket.io for real-time updates |
| Camera | react-camera-pro or native Web API |
| Image Compare | react-compare-slider |

---

## Core User Flow

### 1. Start Estimate
```
Open app → ElevenLabs agent: "Hey Keith, what's the address?"
↓
Voice: "123 Oak Street, Lakewood"
↓
App: "Found customer: Sarah Johnson. Use existing?"
↓
Voice: "Yes, new estimate"
↓
Voice: "5 guys, 4 days, 18 gallons exterior at 65 an hour"
↓
App autocalculates: $10,400 labor + materials
↓
Color picker + photos → Generate PDF
```

### 2. Customer Management Flow
```
Search "Smith" → Shows John & Mary Smith
↓
Or "+ New Customer" → Voice fill info
↓
Property photos auto-linked to customer record
```

---

## Screen Design

### Screen 1: Dashboard
- **New Estimate** (microphone icon + button)
- **Search Customers** — Find existing or create new
- **Recent Estimates** list with status indicators
- **Stats:** This month, close rate, avg job size

### Screen 2: Customer Management
**Customer List View:**
- Search bar (name, address, phone)
- Filter by tags: residential, commercial, repeat, VIP
- Sort by: recent activity, pending estimates, name

**Customer Card:**
```
[Photo thumbnail]  Sarah Johnson
123 Oak Street, Lakewood, OH
📞 440-555-0123 | ✉️ sarah@email.com
Tags: repeat-customer, exterior-heavy
Estimates: 3 (2 approved, 1 pending)
[New Estimate] [View History] [Edit]
```

**Customer Detail:**
- Contact info + property photos grid
- Estimate history (expandable)
- Preferred colors saved from past jobs
- Notes field (voice-dictated or typed)

### Screen 3: Estimate Builder (with Voice Mode)

**Header:** Microphone toggle → Activates ElevenLabs Conversation Agent

**Section A: Customer**
- Customer selector (search dropdown)
- If new: Inline form with voice-fill capability
- Property address (links to customer photos)

**Section B: Labor (Auto-filled by voice)**
- Billing rate/hour (default from settings)
- Number of painters
- Estimated days (supports: 0.5, 1, 1.5, 2...)
- **Live calc:** "$65/hr × 5 painters × 4 days × 8 hrs = $10,400"

**Section C: Materials (Voice-addable)**
```
Quick Add:  [Exterior] [Trim] [Doors] [Ceiling] [+]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Area              Product              Gal  Price   Total
Exterior Body     SW Duration Home     12   $55     $660
Trim              Pro-Classic Satin    4    $48     $192
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Materials Subtotal: $852
```

**Section D: Add-Ons**
- Carpentry: ___ hrs × $90/hr
- Wallpaper: ___ hrs × $70/hr
- Design consult: ___ hrs × $80/hr
- Misc: ___ hrs × $70/hr

**Section E: Color Selection (Full SW Integration)**
- **Color Picker Grid:** All 1,700+ Sherwin-Williams colors
  - Search by name: "Naval", "Alabaster"
  - Search by code: "SW 6244"
  - Filter by color family: Blues, Grays, Whites, etc.
- **Applied To:** Tag colors by area (Body, Trim, Accent, Door)
- **AI Suggestions Button:**
  - "Suggest trim for Body color [Naval]"
  - Returns: "Recommended: SW 7008 Alabaster (crisp white) or SW 7640 Fawn Brindle (warm gray)"
- **Palette Builder:** Save/apply full color schemes
  - "Classic Lake House" → Body: Naval, Trim: Alabaster, Door: Rainstorm
- **Customer Preview:** Visual swatch card showing all selected colors

**Section F: Photos & AI Visualization**
- **Photo Capture:** Camera with type tagging (Exterior/Interior/Detail)
- **Photo Gallery:** Grid view with Originals/AI tabs, organized by job
- **AI Color Visualization:** Google Gemini integration for realistic color preview
  - Upload or capture photo → Select color scheme → Generate AI preview
  - Supports both interior (bedroom, living room) and exterior applications
  - Interactive before/after slider comparison
  - Apply different colors to walls, trim, doors, ceilings
  - AI detects surfaces and maintains architectural details
  - Lighting simulation (mid-day, evening, overcast)
- Pre-work condition shots
- All photos linked to customer blob storage

---

## Photo Management & AI Color Visualization

### Photo Capture & Organization
**Photo Types:**
1. **Exterior** — Front elevation, side views, rear, garage, entry details, trim closeups
2. **Interior** — Living room, bedroom, kitchen, bathroom, hallway, detail shots
3. **Reference** — Existing paint conditions, damage/problem areas, customer inspiration

**Workflow:**
```
Open Camera → Select type (Exterior/Interior) → Capture or Upload
↓
Auto-tag with GPS, timestamp, customer association
↓
Display in Photo Gallery by job/estimate
↓
Select any photo → "Generate AI Preview"
```

### Google Gemini AI Visualization

**Purpose:** Show customers realistic color applications on their actual home photos

**Supported Configurations:**
| Scenario | Input | AI Output |
|----------|-------|-----------|
| Exterior House | Front elevation photo | Walls + Trim + Door colored |
| Interior Room | Bedroom/Living room photo | Walls + Trim + Ceiling colored |
| Detail Shot | Entry door/trim closeup | Accent color applied |

**AI Prompt Engineering:**
```
"Apply Sherwin-Williams paint colors to this residential photo:
- Walls: SW 6244 Naval (deep navy blue)
- Trim: SW 7008 Alabaster (warm white)
- Front door: SW 7605 Gale Force (dark teal)

Requirements:
- Maintain architectural details and shadows
- Realistic lighting and reflections
- Preserve landscaping and surroundings
- Professional real-estate photography style"
```

**Technical Integration:**
- **API:** Google Gemini 1.5 Flash (multimodal)
- **Input:** Base64 image + text prompt with color specifications
- **Output:** Generated image URL or base64
- **Processing time:** ~5-10 seconds per image
- **Cost:** ~$0.0025 per image (100 images = $0.25)

**Storage Strategy:**
```
bucket/
  customers/{customer-id}/
    photos/
      original/      # Unmodified captures
        exterior-001.jpg
        interior-001.jpg
      ai-generated/  # Gemini outputs
        exterior-001-naval-alabaster.jpg
        bedroom-001-merlot-beige.jpg
    ai-metadata/     # Generation settings
      {photo-id}.json  # Colors used, settings, timestamp
```

**UI Components:**
- **Before/After Slider:** Interactive comparison (react-compare-slider)
- **Color Assignment:** Tag which surfaces get which colors
- **Lighting Selector:** Mid-day, evening, overcast simulation
- **Regenerate:** Retry with adjusted prompts if needed
- **Save to Estimate:** Attach AI preview to customer proposal

### Gallery Views

**Originals Tab:**
- Grid layout with filter by type (Exterior/Interior/Reference)
- Thumbnail with overlay: type badge, date, delete option
- Tap to fullscreen view

**AI Previews Tab:**
- Side-by-side cards showing Original → AI version
- Color dots indicating applied scheme
- "Used in Estimate" indicator
- Download/Share buttons

---

## Sherwin-Williams Color System

### Full Color Database
- **1,700+ colors** with codes, names, hex values, LRV (Light Reflectance Value)
- **Color families:** Whites & Off-Whites, Blues, Greens, Grays, Neutrals, Reds, etc.
- **Color strips:** Show related tints/shades

### AI Color Suggestion Engine
**Architecture Options:**
1. **Rule-based** (fast, no AI cost):
   - Pre-built palettes: "Naval body → Alabaster trim"
   - Monochromatic: Same color, 2 shades lighter for trim
   - Complementary: Opposite on color wheel
   
2. **AI-powered** (ElevenLabs or OpenAI):
   - "What trim color works with a dark navy body on a craftsman house?"
   - Trained on SW designer palettes

**Recommendation:** Start rule-based, add AI for complex queries.

### Color Relationships
```typescript
interface ColorSuggestion {
  baseColor: string; // SW code
  suggestedTrims: string[]; // ["SW 7008", "SW 7640"]
  suggestedAccents: string[];
  paletteType: "classic" | "modern" | "coastal" | "farmhouse";
  reasoning: string; // "High contrast for colonial style"
}
```

---

## ElevenLabs Voice Agent Integration

### Architecture
```
[Mobile App] ←→ [WebSocket Server] ←→ [ElevenLabs API]
                    ↓
              [Pinpoint API]
              (stores estimates)
```

### Conversation Flow
**ElevenLabs Agent Prompt:**
```
You are an estimating assistant for Pinpoint Painting. 
Help contractors quickly build estimates through natural conversation.

You can:
- Create new customers or find existing ones
- Capture labor info (painters, days, rate)
- Add materials (gallons, product type)
- Trigger color selection
- Confirm and generate PDFs

Be concise. Ask one question at a time. Use the contractor's jargon naturally.
```

### Sample Conversation
```
Agent: "Hey Keith, ready to start an estimate?"
Keith: "Yeah, 456 Maple Ave, new customer"
Agent: "Got it. Customer name?"
Keith: "Mike Thompson"
Agent: "Added Mike Thompson. What are we painting?"
Keith: "Exterior, big colonial, 4 guys 3 days at 70 an hour"
Agent: "Got it: 4 painters, 3 days, $70/hr = $6,720 labor. Gallons?"
Keith: "16 gallons Duration, 5 gallons for trim"
Agent: "Added. Want to pick colors now or save as draft?"
Keith: "Let's do colors — suggest something good for a colonial"
Agent: "Classic choice: Body in SW 2818 Rookwood Dark Red, 
         trim in SW 7005 Pure White. Sound good?"
Keith: "Perfect. Generate the PDF."
Agent: "Done. Preview ready to send to Mike?"
```

### WebSocket Commands
```typescript
type AgentCommand =
  | { type: "CREATE_CUSTOMER"; name: string; address: string; phone?: string }
  | { type: "FIND_CUSTOMER"; query: string }
  | { type: "SET_LABOR"; painters: number; days: number; rate: number }
  | { type: "ADD_MATERIAL"; area: string; gallons: number; product: string }
  | { type: "GET_COLOR_SUGGESTION"; baseColor: string; context: string }
  | { type: "GENERATE_PDF" }
  | { type: "SAVE_ESTIMATE" };
```

---

## Authentication & User Management

### SMS-Based Authentication (Twilio Verify)

**Why SMS?**
- Crew members always have their phones
- No passwords to forget or manage
- Quick onboarding for seasonal/temp workers
- Secure with OTP verification

**Authentication Flow:**
```
User enters phone number → Request OTP (Twilio Verify)
↓
SMS delivered with 6-digit code (~$0.05/verification)
↓
User enters code → Validate with Twilio
↓
Check approval status
  ├─ Approved → Create JWT tokens (access + refresh) → Dashboard
  └─ New user → Show "Pending Approval" screen
```

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/request-otp | Send SMS via Twilio Verify |
| POST | /api/auth/verify-otp | Validate code, authenticate |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/auth/devices | List active device sessions |

**Phone Input Features:**
- E.164 normalization (handles +1, 1, or raw 10-digit formats)
- Country code selector (default US/Canada)
- Auto-format: (XXX) XXX-XXXX as user types

**OTP Input:**
- 6 separate input boxes (WhatsApp-style)
- Auto-focus next box on entry
- Paste support (auto-fills all 6 from clipboard)
- Backspace handling (moves to previous)
- Auto-submit when complete
- 60-second resend timer

**User Schema:**
```typescript
interface User {
  id: string;
  phoneNumber: string; // E.164 format, unique
  name?: string;       // Optional during signup
  role: "admin" | "estimator";
  status: "pending" | "approved" | "suspended" | "inactive";
  
  // Onboarding
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: string; // Admin user ID
  
  // Security
  otpCode?: string;     // Temp during verification
  otpExpiresAt?: Date;
  otpAttempts: number;
  
  // Analytics
  lastLoginAt?: Date;
  loginCount: number;
  estimatesCreated: number;
  
  // Relations
  deviceSessions: DeviceSession[];
}

interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: "mobile" | "desktop" | "tablet";
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  lastActiveAt: Date;
  createdAt: Date;
}
```

---

### Admin User Approval Workflow

**New User Journey:**
1. User downloads app, enters phone number
2. Receives and enters OTP
3. Account created with `status: "pending"`
4. **Admin notification:** Push/email/SMS to admins
5. Admin reviews in "Pending Approvals" list
6. Admin clicks **Approve** or **Decline**
7. User receives SMS notification
8. If approved → can now log in and access app

**Admin User Management:**
- View all users with filters (Active, Pending, Suspended)
- See user details: phone, device info, location, request time
- Approve/decline with optional note
- Suspend/remove users (ex-employees)
- View login activity and estimate counts per user
- Promote estimator to admin

**Notification Templates:**
```
APPROVED: "You're approved! Open the Pinpoint Painting app to start estimating."

DECLINED: "Your account request was not approved. Contact admin@pinpointpainting.com for questions."
```

---

## Customer Database & Blob Storage

### Customer Schema
```typescript
interface Customer {
  id: string; // UUID
  createdAt: Date;
  updatedAt: Date;
  
  // Contact
  name: string;
  address: string;
  addressCoords?: { lat: number; lng: number }; // For mapping
  phone: string;
  email: string;
  
  // Classification
  type: "residential" | "commercial" | "HOA" | "property-manager";
  tags: string[];
  source: string; // "referral", "website", "yard-sign", etc.
  
  // History
  notes: string;
  estimates: string[]; // Estimate IDs
  totalSpent: number;
  lastEstimateDate?: Date;
  
  // Preferences
  preferredColors: {
    exterior: string[]; // SW codes
    interior: string[];
  };
  preferredProducts: string[]; // "SW Duration", "PPG Permanizer"
  
  // Media (stored in blob service)
  photos: {
    property: BlobRef[]; // array of URLs
    preWork: BlobRef[];
    postWork: BlobRef[];
    inspiration: BlobRef[]; // Colors they like
  };
}

interface BlobRef {
  id: string;
  url: string; // Signed URL or public
  thumbnailUrl: string;
  filename: string;
  uploadedAt: Date;
  metadata: {
    width: number;
    height: number;
    size: number; // bytes
  };
}
```

### Blob Storage Strategy
**Options:**
1. **Cloudinary** — Easy image transforms, moderate cost
2. **AWS S3 + CloudFront** — Lowest cost, more setup
3. **Backblaze B2** — Very cheap, good for bootstrapping

**Structure:**
```
bucket/
  customers/
    {customer-id}/
      property/
        photo-1.jpg
        photo-2.jpg
      pre-work/
      post-work/
  estimates/
    {estimate-id}/
      ai-recolored/ # AI color visualizations
      final-pdf/
```

**Upload Flow:**
1. Mobile app captures photo
2. Request upload URL from API (signed URL)
3. Upload directly to blob storage (bypass server)
4. Store metadata in customer record

---

## PDF Output Design

### Enhanced Template
```
┌─────────────────────────────────────────────────────────────────┐
│  [LOGO]     Pinpoint Painting LLC                               │
│             8001 Sweet Valley Drive Suite 10, Valley View, OH   │
│             📞 216-524-3365  |  🌐 pinpointpainting.com         │
├─────────────────────────────────────────────────────────────────┤
│  PREPARED FOR                                                   │
│  Sarah Johnson                                                  │
│  123 Oak Street, Lakewood, OH 44107                             │
│  📱 440-555-0123                                                │
├─────────────────────────────────────────────────────────────────┤
│  ESTIMATE #PP-2026-0127                    Date: Feb 5, 2026    │
│  Project: Exterior Repaint                                      │
│  Valid through: April 5, 2026                                   │
├─────────────────────────────────────────────────────────────────┤
│  PROJECT DESCRIPTION                                            │
│  ☐ Exterior   ☑ Interior   ☐ Both                               │
│  Areas: Living Room, Kitchen, Hallway, Master Bedroom           │
├─────────────────────────────────────────────────────────────────┤
│  PREPARATION                                                    │
│  ☑ Patch nail holes & stress cracks                             │
│  ☑ Sand patched areas                                           │
│  ☑ Protect flooring & furniture                                 │
│  ☑ Caulk gaps in trim                                           │
│  ☑ Cleanup daily & final                                        │
├─────────────────────────────────────────────────────────────────┤
│  PAINT SPECIFICATIONS                                           │
│  ┌────────────────┬────────────────────────────┬────────┬─────┐ │
│  │ Area           │ Product                    │ Color  │Coats│ │
│  ├────────────────┼────────────────────────────┼────────┼─────┤ │
│  │ Walls          │ SW Duration Home Matte     │ SW 7015│  2  │ │
│  │               │ [swatch image]  (City Loft)│        │     │ │
│  ├────────────────┼────────────────────────────┼────────┼─────┤ │
│  │ Trim           │ Pro-Classic Semi-Gloss     │ SW 7008│  2  │ │
│  │               │ [swatch image]  (Alabaster)│        │     │ │
│  └────────────────┴────────────────────────────┴────────┴─────┘ │
├─────────────────────────────────────────────────────────────────┤
│  INVESTMENT SUMMARY                                             │
│     Labor (4 painters × 3 days × $70/hr)          $6,720.00     │
│     Materials                                     $  984.00     │
│     ─────────────────────────────────────────────────────────   │
│     SUBTOTAL                                      $7,704.00     │
│     Less: Deposit                                 $    0.00     │
│     ─────────────────────────────────────────────────────────   │
│     TOTAL                                         $7,704.00     │
├─────────────────────────────────────────────────────────────────┤
│  [PROPERTY PHOTO]                    [COLOR PALETTE PREVIEW]    │
│                                      ┌────┐ ┌────┐ ┌────┐       │
│                                      │Walls│Trim │Accnt│       │
│                                      └────┘ └────┘ └────┘       │
├─────────────────────────────────────────────────────────────────┤
│  WARRANTY: Full 2-year warranty on workmanship & materials      │
│  Visit: www.pinpointpainting.com/warranty                       │
│  LICENSE & INSURANCE: Available upon request                    │
│  EPA Lead-Safe Certified (NAT-F111764-1)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Development Phases (Updated)

### Phase 1: Core (Weeks 1-3)
- Customer CRUD (create, read, update, delete)
- Estimate builder with labor + materials
- PDF generation
- Local storage (offline capable)

### Phase 2: Voice & AI (Weeks 4-5)
- ElevenLabs agent integration
- WebSocket infrastructure
- Voice-to-form completion

### Phase 3: Color System (Weeks 6-7)
- Full SW color database
- Color picker UI
- Suggestion engine (rule-based)

### Phase 4: Storage & Polish (Weeks 8-9)
- Blob storage for photos
- AI color recoloring of property photos
- Cloud sync
- Customer history/favorites

---

## Infrastructure & Costs

### Monthly Cost Estimate (Self-Hosted)
| Service | Cost | Notes |
|---------|------|-------|
| Vercel Pro (hosting) | $20 | Edge network, CI/CD |
| Neon PostgreSQL | $0-19 | Serverless Postgres |
| Cloudinary (images) | $0-25 | Transformations, CDN |
| Twilio Verify | $2-10 | SMS OTP (~$0.05/verification) |
| ElevenLabs API | $5-50 | Voice conversations |
| Google Gemini Flash | $0.13-0.50 | ~50-200 AI generations |
| **Total** | **$27-125/mo** | Scales with usage |

---

## Files in Repository
1. `Pinpoint-Painting-Estimate-Template.pdf` — Your original estimate
2. `PinpointEstimate-App-Requirements.md` — Voice requirements
3. `PinpointEstimate-App-Design.md` — This comprehensive design
4. `Gap-Analysis.md` — Additional features roadmap
5. `GitHub-Issues-Summary.md` — All 20+ issues listed
6. `mockups/` — 12 HTML interactive mockups

---

## Next Actions
1. Greenlight architecture (PWA + Node backend)
2. Set up ElevenLabs agent account
3. Acquire Sherwin-Williams color dataset
4. Begin Phase 1 development

---
*Updated with customer management, blob storage, SW color system, and ElevenLabs voice agent — 2026-02-05*
