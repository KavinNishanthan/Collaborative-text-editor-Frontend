# CollabEdit — Frontend

A real-time collaborative text editor frontend with Google Docs-like editing experience. Built with React, TypeScript, TipTap, and Yjs CRDTs over Socket.IO.

---

# Live URL 

Live App: --> [http://16.176.171.124/login](http://16.176.171.124/login) 

---

# Backend Repo URL 
Repo URL:--> [https://github.com/KavinNishanthan/Collaborative-text-editor-Backend.com](https://github.com/KavinNishanthan/Collaborative-text-editor-Backend)

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [AI Tools Used](#ai-tools-used)
- [Known Limitations](#known-limitations)

---

## Features

- **Secure Authentication** — Login & register with OTP email verification, JWT session management
- **Dashboard** — Document list with search, create/rename/delete, role badges (Owner / Editor / Viewer)
- **Rich Text Editor** — TipTap-powered editor with bold, italic, strikethrough, highlight, headings (H1/H2), bullet/ordered lists, blockquotes, horizontal rules, and text alignment
- **Real-Time Collaboration** — Yjs CRDT over custom Socket.IO provider for conflict-free multi-user editing
- **Live Cursors & Presence** — Color-coded collaborative cursors with user names, online user avatars with green-dot indicators
- **Auto-Save Status** — Visual indicator (Saving… / Saved ✓ / Error) in the header
- **Document Sharing** — Generate shareable links and invite members by email with role selection
- **Invitation Inbox** — Notification bell with pending invitations (accept/decline) and real-time polling
- **Member Management** — View members, change roles (editor ↔ viewer), and remove members (owner only)
- **Threaded Comments** — Add comments, reply in threads, and resolve when addressed
- **Version History** — Browse version timeline grouped by date, hover-to-preview with diff highlighting, one-click restore
- **Responsive Design** — Collapsible sidebar, mobile-friendly layout with backdrop overlay

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     React Application                        │
│                                                              │
│  ┌─────────────┐     ┌───────────────┐     ┌───────────────┐ │
│  │  Pages:     │     │  Components:  │     │  Lib:         │ │
│  │   Login     │     │   Editor      │     │  SocketIO     │ │
│  │   Register  │     │   ShareLink   │     │  Provider     │ │
│  │   Dashboard │     │  Sidebar:     │     │  CollabCursor │ │
│  │             │     │   Members     │     │               │ │
│  │             │     │   Comments    │     └───────┬───────┘ │
│  │             │     │   History     │             │         │
│  │             │     │   Activity    │             │         │
│  └──────┬──────┘     └──────┬───────┘              │         │
│         │                   │                      │         │
│  ┌──────▼───────────────────▼──────────────────────▼───────┐ │
│  │                    State Layer                          │ │
│  │   Zustand (Auth Store)  +  React State  +  Yjs (Y.Doc)  │ │
│  └──────┬───────────────────────────────────┬──────────────┘ │
│         │  REST API (Axios)                 │  WebSocket     │
└─────────┼───────────────────────────────────┼────────────────┘
          ▼                                   ▼
    Express REST API                  Socket.IO Server
    (Auth, CRUD, Members,             (Yjs sync, awareness,
     Comments, History)                auto-save, presence)
```

### Real-Time Editing Flow

1. User opens a document → creates a `Y.Doc` + `SocketIOProvider`
2. Provider connects to backend Socket.IO and joins the document room
3. Server sends `sync-init` with persisted Yjs state → applied to local `Y.Doc`
4. TipTap Collaboration extension binds to `Y.Doc` for rendering
5. Local edits → Yjs update → sent via Socket.IO → applied on all peers
6. Awareness protocol broadcasts cursor position + user info to all peers
7. CollabCursor extension renders remote cursors with name labels

---

## Tech Stack

| Layer          | Technology                                                              |
|----------------|-------------------------------------------------------------------------|
| **Framework**  | React 19                                                                |
| **Language**   | TypeScript 5                                                            |
| **Build Tool** | Vite 8                                                                  |
| **Styling**    | Tailwind CSS 4                                                          |
| **Editor**     | TipTap 3 (StarterKit, Collaboration, Highlight, TextAlign, Placeholder) |
| **CRDT**       | Yjs + y-protocols (awareness)                                           |
| **Real-Time**  | Socket.IO Client 4                                                      |
| **State**      | Zustand 5                                                               |
| **HTTP**       | Axios                                                                   |
| **Linting**    | ESLint 9 + TypeScript ESLint                                            |
| **Container**  | Docker (Nginx-based production build)                                   |
| **CI/CD**      | GitLab CI/CD                                                            |

---

## Project Structure

```
src/
├── main.tsx                    # React DOM entry point
├── App.tsx                     # Router configuration (public/protected routes)
├── index.css                   # Global styles & Tailwind directives
│
├── Pages/
│   ├── LoginPage/              # Email & password login form
│   ├── RegisterPage/           # Registration with OTP verification flow
│   └── DashboardPage/          # Main app: document list + editor + sidebar panels
│
├── components/
│   ├── Editor.tsx              # TipTap editor wrapper (standalone route)
│   ├── Join.tsx                # Share link join handler
│   ├── ShareLinkPanel.tsx      # Modal for generating & copying share links
│   └── sidebar/
│       ├── ActivityPanel.tsx   # Activity log timeline
│       ├── CommentsPanel.tsx   # Threaded comments with resolve
│       ├── HistoryPanel.tsx    # Version history with preview & restore
│       └── MembersPanel.tsx    # Member list, invite by email, role management
│
├── lib/
│   ├── SocketIOProvider.ts     # Custom Yjs provider over Socket.IO
│   └── CollabCursor.ts         # TipTap extension for collaborative cursors
│
├── api/                        # Axios API layer (auth, documents, members, etc.)
├── Store/
│   └── useAuthStore.ts         # Zustand store for auth state
├── Router/
│   └── ProtectedRoute.tsx      # Auth guard for protected routes
├── interface/                  # TypeScript type definitions
└── Utils/                      # Utility functions (formatDate, getInitials, etc.)
```
---

## Setup Instructions

### Prerequisites

- **Node.js** v20+
- **npm** v9+
- Backend server running (see [Backend README](https://github.com/KavinNishanthan/Collaborative-text-editor-Backend))

### 1. Clone the Repository

```bash
git clone https://github.com/KavinNishanthan/Collaborative-text-editor-Frontend.git
cd Collaborative-text-editor-Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your backend URLs (see [Environment Variables](#environment-variables) below).

### 4. Run in Development Mode

```bash
npm run dev
```

Opens at `http://localhost:5173` by default.

### 5. Build for Production

```bash
npm run build
npm run preview
```

### 6. Run with Docker

```bash
docker build -t collabedit-frontend .
docker run -p 80:80 collabedit-frontend
```

---

## Environment Variables

| Variable          | Description                    | Example                       |
|-------------------|--------------------------------|-------------------------------|
| `VITE_BASE_URL`   | Backend REST API base URL      | `http://localhost:8080/api`   |
| `VITE_SOCKET_URL` | Backend Socket.IO server URL   | `http://localhost:8080`       |

---

## Deployment

The project is deployed using a production-ready DevOps pipeline:

- **AWS:** Frontend and backend services are hosted on AWS
- **Docker:** Application services are containerized for consistency across development and production environments  
- **GitLab CI/CD:** Automated pipelines handle build, testing, and deployment processes  
- **Version Control:** Git-based workflow integrated with GitLab for seamless collaboration and deployment  

This architecture enables efficient delivery, reproducibility, and streamlined deployments.

Frontend ci/cd

<img width="1512" height="982" alt="Screenshot 2026-04-04 at 11 59 33 PM" src="https://github.com/user-attachments/assets/fe08c80c-669a-41f1-967a-6243869708b6" />

Backend ci/cd

<img width="1512" height="982" alt="Screenshot 2026-04-05 at 12 02 08 AM" src="https://github.com/user-attachments/assets/0e0ebbd5-b593-4861-88e5-01c594b65a76" />

---

## API Endpoints

### Authentication
| Method | Endpoint                    | Description                  |
|--------|-----------------------------|------------------------------|
| POST   | `/api/auth/register`        | Register & send OTP          |
| POST   | `/api/auth/verify-otp`      | Verify OTP & create account  |
| POST   | `/api/auth/login`           | Login & set JWT cookie       |

### Documents
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| POST   | `/api/documents`                 | Create document          |
| GET    | `/api/documents`                 | List user's documents    |
| GET    | `/api/documents/:documentId`     | Get document detail      |
| PUT    | `/api/documents/:documentId`     | Update document title    |

### Members
| Method | Endpoint                                         | Description            |
|--------|--------------------------------------------------|------------------------|
| GET    | `/api/members/:documentId`                       | List document members  |
| POST   | `/api/members/:documentId/invite`                | Send email invitation  |
| PUT    | `/api/members/:documentId/:memberId/role`        | Update member role     |
| DELETE | `/api/members/:documentId/:memberId`             | Remove member          |

### Comments
| Method | Endpoint                                                | Description        |
|--------|---------------------------------------------------------|--------------------|
| GET    | `/api/comments/:documentId`                             | List comments      |
| POST   | `/api/comments/:documentId`                             | Add comment        |
| POST   | `/api/comments/:documentId/:commentId/reply`            | Reply to comment   |
| PUT    | `/api/comments/:documentId/:commentId/resolve`          | Resolve comment    |

### History
| Method | Endpoint                                              | Description          |
|--------|-------------------------------------------------------|----------------------|
| GET    | `/api/history/:documentId`                            | List version history |
| POST   | `/api/history/:documentId/:historyId/restore`         | Restore a version    |

### Sharing
| Method | Endpoint                                  | Description            |
|--------|-------------------------------------------|------------------------|
| POST   | `/api/share/:documentId/generate`         | Generate share link    |
| POST   | `/api/share/join`                         | Join via share token   |

### Invitations
| Method | Endpoint                                    | Description              |
|--------|---------------------------------------------|--------------------------|
| GET    | `/api/invitations/pending`                  | List pending invitations |
| POST   | `/api/invitations/:invitationId/accept`     | Accept invitation        |
| POST   | `/api/invitations/:invitationId/decline`    | Decline invitation       |

### Activity
| Method | Endpoint                        | Description          |
|--------|---------------------------------|----------------------|
| GET    | `/api/activity/:documentId`     | Get activity log     |

---

## AI Tools Used

| Tool                 |                                                                                       
|----------------------|
|  **Gemini,ChatGPT**  |

> AI tools such as ChatGPT and Gemini were used to accelerate development and support learning,Debug complex real-time synchronization issues, particularly while working with technologies like Socket.IO and real-time synchronization. 

---

## Known Limitations

- **No Offline Support** — Requires active WebSocket connection; no local-first editing
- **Comment Highlighting** — Comments store selected text but don't display inline highlights in the editor
- **Cursor Cleanup** — Remote cursors may briefly persist after a user disconnects (cleared on next awareness cycle)
- **No Mobile Editor Toolbar** — The rich text toolbar is not optimized for small mobile screens
- **Share Link Role** — Share links always grant viewer access; role-specific links are not supported
- **No Image/File Uploads** — The editor supports text formatting only; media embedding is not implemented
- **Browser Support** — Tested on Chrome and Firefox; Safari WebSocket support may vary

