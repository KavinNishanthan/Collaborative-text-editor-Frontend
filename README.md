# CollabEdit — Frontend

A real-time collaborative text editor frontend with Google Docs-like editing experience. Built with React, TypeScript, TipTap, and Yjs CRDTs over Socket.IO.

---

# Live URL 

Live App: --> [http://16.176.171.124/login](http://16.176.171.124/login) 

user this to login or you can create one new...
email : kavinnishanthanpd@gmail.com
pass : 12345678

![Screenshot 2026-04-05 at 1 41 06 PM](https://github.com/user-attachments/assets/653107e8-ee6d-4adc-9ecc-e99576e3a7e7)

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

**FRontend:**

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

**Backend:**

| Layer          | Technology                                                                |
|----------------|---------------------------------------------------------------------------|
| **Runtime**    | Node.js 20                                                                |
| **Framework**  | Express 5                                                                 |
| **Language**   | TypeScript 5                                                              |
| **Database**   | MongoDB Atlas (via Mongoose)                                              |
| **Real-Time**  | Socket.IO 4                                                               |
| **CRDT**       | Yjs + y-protocols (awareness)                                             |
| **Auth**       | JWT (jsonwebtoken) + bcryptjs                                             |
| **Validation** | Joi                                                                       |
| **Email**      | Nodemailer (Gmail SMTP)                                                   |
| **Container**  | Docker (multi-stage build, node:20-alpine)                                |
| **CI/CD**      | GitLab CI/CD (build → Docker push to ECR → deploy to EC2)                 |

---

## Project Structure

**Frontend:**
```
src/
├── main.tsx                    
├── App.tsx                     
├── index.css                 
│
├── Pages/
│   ├── LoginPage/            
│   ├── RegisterPage/
│   └── DashboardPage/         
│
├── components/
│   ├── Editor.tsx            
│   ├── Join.tsx                
│   ├── ShareLinkPanel.tsx      
│   └── sidebar/
│       ├── ActivityPanel.tsx  
│       ├── CommentsPanel.tsx   
│       ├── HistoryPanel.tsx   
│       └── MembersPanel.tsx    
│
├── lib/
│   ├── SocketIOProvider.ts     
│   └── CollabCursor.ts        
│
├── api/                        
├── Store/
│   └── useAuthStore.ts        
├── Router/
│   └── ProtectedRoute.tsx     
├── interface/                
└── Utils/                      
```

**Backend**
```
src/
├── index.ts                  
├── configs/
│   ├── mongoose.config.ts    
│   └── socket.config.ts      
├── constants/
│   ├── http-message.constant.ts
│   └── response-message.constant.ts
├── controllers/
│   ├── auth.controller.ts   
│   ├── document.controller.ts
│   ├── member.controller.ts  
│   ├── comment.controller.ts 
│   ├── history.controller.ts 
│   ├── sharing.controller.ts 
│   ├── invitation.controller.ts 
│   └── activity.controller.ts
├── helpers/
│   ├── cookie.helper.ts     
│   ├── mail.helper.ts       
│   ├── otp.helper.ts       
│   ├── profile-colour.helper.ts 
│   └── uuid.helper.ts       
├── interfaces/              
├── middlewares/              
├── models/
│   ├── user.model.ts
│   ├── document.model.ts
│   ├── document-member.model.ts
│   ├── document-history.model.ts
│   ├── comment.model.ts
│   ├── invitation.model.ts
│   ├── activity-log.model.ts
│   └── otp.model.ts
├── routes/                   
├── types/                  
└── utils/             
```

---

## Setup Instructions

### Prerequisites (Frontend)

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

### Prerequisites (Backend)

- **Node.js** v20+
- **npm** v9+
- **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Gmail account** with [App Password](https://support.google.com/accounts/answer/185833) for SMTP

### 1. Clone the Repository

```bash
git clone https://github.com/KavinNishanthan/Collaborative-text-editor-Backend.git
cd Collaborative-text-editor-Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables) below).

### 4. Run in Development Mode

```bash
npm run dev
```

This runs the TypeScript compiler in watch mode and Nodemon concurrently. The server starts on `http://localhost:8080`.

### 5. Build for Production

```bash
npm run build
npm start
```

### 6. Run with Docker

```bash
docker build -t collabedit-backend .
docker run -p 8080:8080 --env-file .env collabedit-backend
```

---


## Environment Variables

**Frontrnd:**

| Variable          | Description                    | Example                       |
|-------------------|--------------------------------|-------------------------------|
| `VITE_BASE_URL`   | Backend REST API base URL      | `http://localhost:8080/api`   |
| `VITE_SOCKET_URL` | Backend Socket.IO server URL   | `http://localhost:8080`       |

**Backend:**

| Variable        | Description                                  | Example                                     |
|-----------------|----------------------------------------------|---------------------------------------------|
| `NODE_ENV`      | Environment mode                             | `development` / `production`                |
| `PORT`          | Server port                                  | `8080`                                      |
| `MONGOURI`      | MongoDB connection string                    | `mongodb+srv://user:pass@cluster/dbname`    |
| `CORS_ORIGIN`   | Allowed origins (comma-separated)            | `http://localhost:5173,https://example.com` |
| `CLIENT_URL`    | Frontend URL (for email links)               | `http://localhost:5173`                     |
| `JWT_SECRET`    | Secret key for JWT signing                   | `your_jwt_secret_here`                      |
| `SMTP_MAIL`     | Gmail address for sending emails             | `your_email@gmail.com`                      |
| `SMTP_PASSWORD` | Gmail App Password                           | `xxxx xxxx xxxx xxxx`                       |

---

## Deployment

The application is containerized with Docker and deployed via a GitLab CI/CD pipeline:

1. **Build Stage** — TypeScript compilation (`npm run build`)
2. **Docker Stage** — Multi-stage Docker build, push to AWS ECR
3. **Deploy Stage** — SSH into EC2 instance, pull latest image, run container with environment variables

See [`.gitlab-ci.yml`](.gitlab-ci.yml) for full pipeline configuration. 

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

