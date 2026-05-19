# 🎓 CampusPrint

A modern campus-focused printing and document management platform built for students and college print shops. CampusPrint streamlines document ordering, print service management, admin workflows, QR-based tracking, notifications, and service discovery — all inside a responsive full-stack web application.

---

# 🚀 Overview

CampusPrint is a full-stack web application designed to simplify printing and document service workflows within educational institutions.

Instead of students physically visiting print shops multiple times to:
- check available services,
- upload files,
- place print requests,
- track orders,
- or collect printed documents,

CampusPrint centralizes the entire workflow into a single digital platform.

The platform supports:
- student-side service browsing,
- print order management,
- shopping cart functionality,
- QR-based workflows,
- admin dashboards,
- service toggles,
- document uploads,
- and notification systems.

It is especially useful for:
- College campuses
- University printing centers
- Stationery shops
- Student service hubs
- Hackathon/demo MVPs for campus automation

---

# ✨ Features

## 👨‍🎓 Student Features
- Browse available campus services
- Add printing services to cart
- Upload and manage required documents
- QR-based interactions
- Track order statuses
- View notifications and reminders
- Mobile-friendly UI
- Local offline-friendly fallback services

## 🛠️ Admin Features
- Admin authentication system
- Create/update/delete print services
- Enable/disable services dynamically
- View recent jobs and analytics
- Manage order statuses
- Mark orders as collected
- Upload service-related documents
- Shop open/close status handling

## 📦 Document & Order Management
- File uploads using Supabase Storage
- Organized service-based document storage
- Cart total calculations
- Order workflow management
- Generated tracking/order codes

## 🔔 Productivity Features
- Deadline reminders
- Notification bell system
- Dynamic greetings & motivational study quotes
- Student-safe service filtering

## 📱 UI/UX Features
- Responsive mobile-first interface
- Smooth navigation with React Router
- Dashboard-style admin panel
- Clean component-based architecture
- Modern frontend powered by React + Vite

---

# 🛠️ Tech Stack

## Frontend
- React 19
- Vite
- React Router DOM
- Tailwind CSS
- Lucide React Icons

## Backend
- Node.js
- Express.js
- REST APIs

## Database & Backend Services
- Supabase
  - Authentication
  - PostgreSQL Database
  - Storage Buckets

## Integrations
- Supabase Auth
- Supabase Storage
- QR Code utilities

## Other Libraries & Tools
- Multer (file uploads)
- Cookie Parser
- CORS
- dotenv
- Concurrently
- ESLint

---

# 🏗️ Architecture / How It Works

CampusPrint follows a modern client-server architecture.

## High-Level Flow

```text
Student/Admin
      ↓
React Frontend (Vite)
      ↓
Express Backend APIs
      ↓
Supabase Services
(Database + Auth + Storage)
      ↓
Response returned to frontend
```

## Core Workflow

### Student Side
1. Student opens the platform
2. Available services are fetched from the backend
3. User selects services and adds them to cart
4. Required documents/files are uploaded
5. Orders are created and tracked
6. Notifications/reminders help students stay updated

### Admin Side
1. Admin logs into dashboard
2. Admin manages services
3. Orders are monitored in real time
4. Service availability can be toggled
5. Documents and workflows are controlled centrally

## File Upload Workflow

```text
Frontend Upload
      ↓
Express + Multer Middleware
      ↓
Supabase Storage Bucket
      ↓
Public URL generated
      ↓
Stored in Supabase Database
```

---

# 📂 Folder Structure

```bash
campus-print-main/
│
├── backend/
│   ├── config/              # Supabase configuration
│   ├── controllers/         # API business logic
│   ├── middleware/          # Auth & error middleware
│   ├── routes/              # Express routes
│   ├── supabase/            # SQL schemas & policies
│   ├── utils/               # Utility helpers
│   ├── server.js            # Backend entry point
│   └── app.js               # Express app setup
│
├── public/                  # Static assets
├── scripts/                 # Development helper scripts
│
├── src/
│   ├── api/                 # Frontend API handlers
│   ├── assets/              # Images & static frontend assets
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Local services & utilities
│   ├── pages/               # Route-level pages
│   ├── utils/               # Utility functions
│   ├── App.jsx              # App routing
│   └── main.jsx             # Frontend entry
│
├── .env.example
├── package.json
└── README.md
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/campus-print.git
cd campus-print
```

---

## 2️⃣ Install Frontend Dependencies

```bash
npm install
```

---

## 3️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 4️⃣ Configure Environment Variables

Create the following files:

```bash
.env
backend/.env
```

Use the environment variable examples provided below.

---

## 5️⃣ Run the Frontend

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

## 6️⃣ Run the Backend

```bash
cd backend
npm run dev
```

Backend runs on:

```bash
http://localhost:5000
```

---

## 7️⃣ Run Full Stack Together

```bash
npm run dev:all
```

---

# 🔑 Environment Variables

## Frontend `.env`

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
```

### Explanation
| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key |
| `VITE_API_BASE_URL` | Backend API base URL |

---

## Backend `backend/.env`

```env
PORT=5000
CLIENT_URL=http://localhost:5173

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

SUPABASE_STORAGE_BUCKET=
SUPABASE_DOCUMENTS_BUCKET=
```

### Explanation
| Variable | Purpose |
|---|---|
| `PORT` | Backend server port |
| `CLIENT_URL` | Allowed frontend origin |
| `SUPABASE_URL` | Supabase instance URL |
| `SUPABASE_ANON_KEY` | Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-level Supabase key |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket for uploads |
| `SUPABASE_DOCUMENTS_BUCKET` | Dedicated document storage bucket |

---

# 🧪 Usage

## Student Workflow

1. Open the application
2. Browse available services
3. Add services to cart
4. Upload documents if required
5. Place requests/orders
6. Track status updates
7. Collect completed prints

---

## Admin Workflow

1. Login to admin dashboard
2. Create or manage services
3. Monitor active print jobs
4. Update order statuses
5. Upload/manage service documents
6. Track completion and collections

---

# 📸 Screenshots / Demo

Recommended screenshots to include:

- 🏠 Homepage
- 🛒 Cart page
- 📄 Order page
- 🔐 Admin login
- 📊 Admin dashboard
- 📱 Mobile responsive view
- 📷 QR scanner interface

Suggested structure:

```md
![Homepage](./screenshots/homepage.png)
![Admin Dashboard](./screenshots/admin-dashboard.png)
```

---

# 🚧 Challenges & Learnings

## Challenges Faced

### 🔄 Managing Frontend + Backend Synchronization
Handling real-time state updates between the React frontend and Express APIs required careful API structuring and local state management.

### 📁 File Upload Handling
Implementing secure document uploads with Supabase Storage and maintaining organized storage paths was a major backend challenge.

### 🔐 Authentication & Role Management
Managing separate student/admin workflows while maintaining security and usability required layered authentication logic.

### 📱 Mobile Responsiveness
Creating a smooth mobile-first UI for students while still supporting admin dashboards required responsive design optimization.

### ⚡ Local Fallback Architecture
Building fallback/local service logic for demo resilience and offline-friendly behavior added architectural complexity.

---

## Technical Learnings

- Designing scalable REST APIs with Express
- Structuring large React applications cleanly
- Using Supabase for full-stack backend services
- Managing cloud storage workflows
- Handling CORS and secure environment variables
- Building reusable React components
- Implementing role-based application flows

---

# 🔮 Future Improvements

- 💳 Online payment gateway integration
- 📊 Advanced analytics dashboard
- 📦 Live order tracking system
- 📲 Push notifications
- 🖨️ Smart printer queue management
- 🤖 AI-based print recommendations
- 🌐 Multi-campus support
- 📄 PDF preview before printing
- 🔍 Search & filter services
- 📈 Admin reporting exports

---

# 🤝 Contributing

Contributions are welcome!

## Steps
1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/amazing-feature
```

3. Commit changes

```bash
git commit -m "Add amazing feature"
```

4. Push to your branch

```bash
git push origin feature/amazing-feature
```

5. Open a Pull Request

---

# 📜 License

This project is licensed under the MIT License.

```text
MIT License © 2026 CampusPrint
```

---

# ⭐ Final Note

CampusPrint demonstrates how modern full-stack technologies can be combined to solve practical campus-level operational problems with a scalable and user-friendly architecture.

If you found this project interesting, consider giving it a ⭐ on GitHub!
