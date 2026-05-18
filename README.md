# Rental App - Property Rental Website

It's a rental marketplace where users can list and browse properties, request leases, and leave reviews. We built it with Next.js on the frontend and Node.js/Express + MongoDB on the backend.

**Live site:**   - https://rental-app-omega-two.vercel.app
**Backend API:** - https://rental-app-k2r9.onrender.com/api

---

## What it does

- Browse and search rental properties (filter by city, price, type, rooms)
- Register/login with JWT auth
- List your own property with photos
- Request a lease on a property
- Leave star ratings and reviews
- See who else is online in real time (WebSocket)

---

## Tech stack

- **Frontend** - Next.js 14, CSS Modules
- **Backend** - Node.js, Express, MongoDB (Mongoose)
- **Auth** - JWT (jsonwebtoken + bcryptjs)
- **Real-time** - WebSockets (ws library)
- **File uploads** - UploadThing
- **Testing** - Jest, Supertest

---

## How to run locally

You need Node.js 18+ and MongoDB installed.

### 1. Clone the repo

```bash
git clone https://github.com/RenataAkhmetshina/rental-app.git
cd rental-app
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in your values (see env vars section below), then:

```bash
npm run dev
```

Backend will run on http://localhost:5000

### 3. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` (see below), then:

```bash
npm run dev
```

Frontend will run on http://localhost:3000

---

## Environment variables

### Backend `/backend/.env`

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rental_app
JWT_SECRET=put_any_random_string_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend `/frontend/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
UPLOADTHING_TOKEN=your_uploadthing_token
JWT_SECRET=your_jwt_secret
```

---

## API routes

### Auth
| Method | Route              | Description      |
|--------|--------------------|------------------|
| POST   | /api/auth/register | Create account   |
| POST   | /api/auth/login    | Login            |
| GET    | /api/auth/me       | Get current user |

### Properties
| Method | Route                    | Description                                                                           |
|--------|--------------------------|---------------------------------------------------------------------------------------|
| GET    | /api/properties          | List properties (supports ?search, ?city, ?type, ?minPrice, ?maxPrice, ?rooms, ?page) |
| GET    | /api/properties/:id      | Single property                                                                       |
| POST   | /api/properties          | Create property (auth required)                                                       |
| PUT    | /api/properties/:id      | Edit property (owner only)                                                            |
| DELETE | /api/properties/:id      | Delete property (owner only)                                                          |

### Leases
| Method | Route                  | Description               |
|--------|------------------------|---------------------------|
| GET    | /api/leases            | My leases                 |
| POST   | /api/leases            | Request lease             |
| PUT    | /api/leases/:id/status | Approve or reject (owner) |
| DELETE | /api/leases/:id        | Cancel pending lease      |

### Reviews
| Method | Route                     | Description            |
|--------|---------------------------|------------------------|
| GET    | /api/reviews/property/:id | Reviews for a property |
| POST   | /api/reviews              | Post a review          |
| PUT    | /api/reviews/:id          | Edit your review       |
| DELETE | /api/reviews/:id          | Delete your review     |

---

## Running tests

```bash
# backend tests
cd backend
npm test

# frontend tests
cd frontend
npm test
```

---

## Project structure

```
rental-app/
├── backend/
│   ├── models/        # Mongoose schemas (User, Property, Lease, Review)
│   ├── routes/        # Express route handlers
│   ├── middleware/    # JWT auth middleware
│   ├── utils/         # JWT helper, WebSocket server
│   ├── tests/         # Jest + Supertest
│   └── server.js
└── frontend/
    ├── app/           # Pages (home, properties, auth, dashboard, leases, profile)
    ├── components/    # Navbar, PropertyCard, PropertyForm, LeaseModal, Reviews
    ├── context/       # AuthContext, WSContext
    ├── lib/           # API client
    └── styles/        # Global CSS
```

---

## Team

- Renata Akhmetshina  - backend, database, auth, deployment 
- Serikkhan Erkebulan - frontend, UI, components, real-time WebSocket
