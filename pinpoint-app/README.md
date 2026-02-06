# Pinpoint Painting Estimating App

A mobile-first React application for the Pinpoint Painting crew to create professional paint estimates on-site.

## Features

- **SMS Authentication** — Twilio Verify for secure phone-based login
- **Admin Approval Workflow** — New users require admin approval before access
- **Customer Management** — Full CRM with search, tags, and history tracking
- **Mobile-Optimized** — Built for phones and tablets
- **Offline-Ready** — Works on job sites with poor connectivity (coming soon)
- **PDF Generation** — Professional estimate outputs (coming soon)

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Zustand (state management)
- React Router
- Axios

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (database)
- Twilio Verify (SMS authentication)
- JWT tokens (session management)
- Helmet + CORS (security)

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Copy environment file and add your Twilio credentials
cp backend/.env.example backend/.env
# Edit backend/.env with your actual credentials

# Start everything (PostgreSQL + Backend + Frontend)
docker-compose up

# Or run in background
docker-compose up -d
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

To stop:
```bash
docker-compose down
```

To reset database:
```bash
docker-compose down -v  # Removes volumes
docker-compose up
```

### Option 2: Local Development (without Docker)

**Prerequisites:**
- Node.js 18+
- PostgreSQL 14+
- Twilio account with Verify service

```bash
# Install dependencies
npm run setup

# Set up database
createdb pinpoint_db

# Copy and configure environment
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend
cp .env.example .env.local
# Edit .env.local with your API URL

# Start backend
npm run dev:backend

# In a new terminal, start frontend
npm run dev
```

## Environment Variables

### Backend (.env)

```env
# Database (Docker uses these defaults)
DB_HOST=postgres  # Use 'localhost' for local dev without Docker
DB_PORT=5432
DB_NAME=pinpoint_db
DB_USER=postgres
DB_PASSWORD=postgres

# Twilio (from your account)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_service_sid_here

# JWT Secrets (generate random strings)
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:3001/api
```

## Authentication Flow

1. User enters phone number → `/login`
2. OTP sent via Twilio SMS → User enters code at `/verify`
3. If **new user** → Redirect to `/pending` (awaiting admin approval)
4. If **approved** → Redirect to dashboard
5. If **suspended** → Error message

## Admin User Management

To create an admin user, insert directly into the database:

```sql
INSERT INTO users (phone_number, name, role, status, approved_at)
VALUES ('+14405550123', 'Admin Name', 'admin', 'approved', CURRENT_TIMESTAMP);
```

Or approve an existing user:

```sql
UPDATE users SET status = 'approved', approved_at = CURRENT_TIMESTAMP, role = 'admin' WHERE phone_number = '+14405550123';
```

## API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/request-otp | Send SMS verification code |
| POST | /api/auth/verify-otp | Verify code, authenticate |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/auth/status | Check authentication status |
| GET | /api/admin/users | List all users (admin only) |
| GET | /api/admin/users/pending | List pending users (admin only) |
| POST | /api/admin/users/:id/approve | Approve pending user (admin only) |
| POST | /api/admin/users/:id/decline | Decline pending user (admin only) |
| POST | /api/admin/users/:id/suspend | Suspend user (admin only) |
| GET | /api/admin/stats | Get user statistics (admin only) |

## App Routes

| Route | Description |
|-------|-------------|
| `/login` | Phone number entry for authentication |
| `/verify` | 6-digit OTP code verification |
| `/pending` | Approval waiting screen for new users |
| `/` | Dashboard (after login) |
| `/customers` | Customer list with search and filters |
| `/customers/new` | Add new customer form |
| `/customers/:id` | Customer detail/edit page |

## Project Structure

```
pinpoint-app/
├── src/                      # Frontend React code
│   ├── pages/               # Page components
│   │   ├── PhoneLogin.tsx   # Phone entry
│   │   ├── OTPVerify.tsx    # Code verification
│   │   ├── ApprovalPending.tsx # Waiting screen
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── CustomerList.tsx # Customer search/list
│   │   ├── CustomerDetail.tsx # Customer edit/view
│   │   └── NewCustomer.tsx  # Add new customer
│   ├── stores/              # Zustand state stores
│   │   ├── authStore.ts     # Authentication state
│   │   └── customerStore.ts # Customer data state
│   └── App.tsx              # Main router
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts      # Authentication routes
│   │   │   └── admin.ts     # Admin management routes
│   │   ├── config/
│   │   │   └── database.ts  # PostgreSQL connection
│   │   └── utils/
│   │       ├── twilio.ts    # Twilio SMS utilities
│   │       └── jwt.ts       # JWT token utilities
│   ├── Dockerfile           # Backend container config
│   └── package.json
├── docker-compose.yml        # Full stack orchestration
├── Dockerfile               # Frontend container config
└── README.md
```

## Development Scripts

```bash
# Setup (install all dependencies)
npm run setup

# Start frontend only (if backend already running)
npm run dev

# Start backend only
npm run dev:backend

# Build for production
npm run build            # Frontend
cd backend && npm run build  # Backend

# Run production server
cd backend && npm start

# Docker commands
docker-compose up        # Start all services
docker-compose up -d     # Start in background
docker-compose down      # Stop services
docker-compose down -v   # Stop and remove volumes (DB reset)

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Customer Management

- **Customer Types**: Homeowner, Contractor, Property Manager, Commercial
- **Status Tracking**: Active, Inactive, Prospect
- **Tags**: Customizable tags for categorization (Interior, Exterior, Repeat Customer, VIP, etc.)
- **Search**: Search by name, phone, email, address, or tags
- **Filters**: Filter by type, status, and tags
- **History**: Track estimate count and total value per customer

## Security

- 15-minute access tokens (JWT)
- 30-day refresh tokens
- Device session tracking
- Rate limiting on auth endpoints
- Helmet.js for HTTP security headers
- CORS protection
- No passwords stored (SMS OTP only)

## Azure Bicep (Future)

Resource Group: `zach`

Planned infrastructure:
- Container Apps for frontend and backend
- Azure Database for PostgreSQL
- Azure Container Registry
- Azure Key Vault for secrets

## License

Private - Pinpoint Painting LLC