# 𝓐𝓢𝓐 — AI Study Assistant

**An intelligent, bilingual (Arabic/English) study platform powered by AI.**

ASA helps students upload documents and automatically generates summaries, quizzes, study plans, and provides an AI-powered chat assistant — all with full Arabic and English support including RTL layout.

---

## 🚀 Features

### For Students
- **📄 Document Upload** — Upload PDF, DOCX, TXT, and images (OCR via AI)
- **📝 Smart Summarization** — Generate structured summaries with key points and detailed sections
- **❓ Quiz Generation** — Auto-generate multiple-choice quizzes from any document
- **📅 Study Plans** — Create multi-day structured study plans with daily tasks and mini-quizzes
- **💬 AI Chat** — Context-aware chat that references your uploaded documents
- **👤 Profile Management** — Manage your account settings

### For Administrators
- **📊 Admin Dashboard** — Real-time overview of users, documents, and AI usage
- **👥 User Management** — View, promote to admin, activate/deactivate, delete users
- **📁 Document Management** — View all uploaded documents across users
- **📈 Analytics** — MAU tracking, retention rate, weekly growth charts, feature distribution
- **📋 Activity Logs** — Searchable system logs with level filtering
- **⚙️ Platform Settings** — Key-value configuration management

### Internationalization
- **🌐 Bilingual** — Full English and Arabic support
- **🔁 RTL Layout** — Complete right-to-left layout for Arabic
- **🌍 Auto-detection** — Detects browser language on first visit
- **💾 Persistent** — Language preference saved in localStorage

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 14)                      │
│              Port 3000                                       │
│  React 18 · Tailwind CSS 4 · Framer Motion · shadcn/ui       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Backend (FastAPI - Python)                     │
│              Port 8000                                       │
│  Auth · File Management · AI Orchestration · Admin APIs       │
│  Database: SQLite via SQLAlchemy ORM                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP POST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            AI Service (FastAPI - Python)                     │
│              Port 5000                                       │
│  OpenAI GPT-4o-mini · Structured JSON Output                  │
│  Parallel Batch Generation · OCR via Vision API               │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 4, Framer Motion, Radix UI (shadcn/ui), Recharts, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, SQLite, JWT (python-jose), bcrypt (passlib) |
| **AI Service** | Python 3.11+, FastAPI, OpenAI SDK (GPT-4o-mini), Structured Outputs |
| **Auth** | JWT tokens + Google OAuth 2.0 |
| **i18n** | Custom React Context provider (English/Arabic + RTL) |

---

## 📋 Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **OpenAI API Key** (for AI features)

---

## 🔧 Setup & Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd graduation_project
```

### 2. Environment Variables
Copy the example env files and fill in your values:
```bash
cp ai_service/.env.example ai_service/.env
cp backend_service/.env.example backend_service/.env
cp frontend_service/.env.example frontend_service/.env.local
```

Required keys:
- `OPENAI_API_KEY` — Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- `BACKEND_SECRET_KEY` — Any random string (used for JWT signing)
- `GOOGLE_CLIENT_ID` — Optional, for Google Sign-In

### 3. Backend & AI Service Setup
```bash
# Backend
cd backend_service
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# AI Service
cd ../ai_service
python -m venv venv
venv\Scripts\activate  # Windows
pip install openai fastapi uvicorn python-dotenv
```

### 4. Frontend Setup
```bash
cd frontend_service
npm install
```

### 5. Run the Services
Use the startup script (starts all 3 services):
```bash
.\start_all.bat
```

Or start them individually:
```bash
# Terminal 1: AI Service (port 5000)
cd ai_service && venv\Scripts\python -m uvicorn main:app --port 5000

# Terminal 2: Backend (port 8000)
cd backend_service && .venv\Scripts\python -m uvicorn app:app --port 8000

# Terminal 3: Frontend (port 3000)
cd frontend_service && npm run dev
```

### 6. Access the App
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

```bash
# Backend tests (if implemented)
cd backend_service
pytest

# Frontend linting
cd frontend_service
npm run lint
```

---

## 📁 Project Structure

```
graduation_project/
├── ai_service/              # AI Service (port 5000)
│   ├── ai_engine.py         # Core AI logic (OpenAI integration)
│   ├── main.py              # FastAPI routes
│   └── .env.example         # Environment variables template
├── backend_service/         # Backend API (port 8000)
│   ├── app.py               # Main FastAPI application
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # Database connection
│   ├── text_extractor.py    # PDF/DOCX/Image text extraction
│   ├── services/
│   │   └── ai_service.py    # HTTP client to AI Service
│   └── .env.example
├── frontend_service/        # Next.js Frontend (port 3000)
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   │   ├── layout/          # Shell, Sidebar, Header
│   │   ├── ui/              # shadcn/ui components
│   │   ├── chat/            # AI Chat FAB
│   │   ├── shared/          # Shared components
│   │   └── providers/       # Theme & I18n providers
│   ├── lib/                 # Utilities & API clients
│   └── hooks/               # Custom React hooks
├── start_all.bat            # Launch all services
├── .gitignore
└── README.md
```

---

## 🎯 Key Highlights

### Why ASA stands out:

1. **3-Tier Architecture** — Clean separation of concerns between frontend, backend, and AI service
2. **Bilingual with RTL** — Full Arabic support, rare in study assistant applications
3. **Structured AI Outputs** — Uses OpenAI's structured JSON output for reliable, parseable results
4. **Parallel Generation** — Study plans and quizzes use parallel batch generation for speed
5. **Admin Analytics** — Real-time platform metrics, user management, and AI usage tracking
6. **Comprehensive Feature Set** — Summarization, quizzes, study plans, and AI chat in one platform

---

## 🔒 Security Notes

- JWT tokens expire after 30 minutes (configurable)
- Passwords hashed with bcrypt
- API keys should never be committed to version control
- SMTP not required for local development (passwords printed to console)

---

## 📝 License

This project is developed for educational purposes as a graduation project.

---

## 👥 Team

Developed by [Your Name] — Graduation Project 2026
