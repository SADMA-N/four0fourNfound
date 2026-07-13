# 404 Project Not Found

A unified full-stack workspace combining a date-based Kanban task board, an interactive image polygon annotation tool, and secure user-specific data management—all styled with a technical "Drafting Table" design aesthetic.

---

## Project Overview

**404 Project Not Found** is a productivity dashboard designed for computer vision engineers, annotators, and project coordinators. It bridges the gap between task management and annotation workflows by providing:
- A Kanban task planning workspace that organizes and sequences daily task flows.
- An image annotation canvas that captures and processes polygon vector metadata relative to uploader images.

The frontend interface communicates with a Django REST API. All records, task-order sequences, image metadata, and polygon vectors are securely persisted using row-level ownership protections in the database.

---

## Main Features

- **Authentication Suite**: JWT-protected login and signup, featuring custom interactive technical schematics drawn in pure vector CSS and HTML.
- **Protected Routing**: React Router authentication redirects that protect workspace paths.
- **Date-Based Kanban Board**: Daily planner columns segmented as *To Do*, *In Progress*, and *Done* (Zones 01, 02, and 03), featuring task counters and tag filters.
- **Advanced Drag-and-Drop**: Same-column reordering and cross-column status transitions with exact drop-position calculation and positional persistence on the database.
- **Task Management**: Simple task creation, attribute editing, category tags, priority symbols, and deletion.
- **Image Scroller Rail**: Film-strip thumbnail preview rail with active selections, uploader widgets, and count badges indicating active polygon annotations.
- **Vector Canvas**: Coordinate-scaled SVG canvas. Supports custom object labels, color hex parameters, point undo controls, canvas clearing, and live drawing projection.
- **Polygons List Panel**: Sidebar panel showing current vectors. Deleting a row dynamically cleans both list states and canvas boundaries.
- **Responsive Stacking**: Fluid layout support for mobile viewports (`375px`) without horizontal overflow.

---

## Technology Stack

| Area | Technologies | Confirm Version |
| :--- | :--- | :--- |
| **Frontend** | React SPA, Vite builder | React `v19.2.7`, Vite `v8.1.4`, TypeScript `v7.0.2` |
| **Backend** | Python, Django, Django REST Framework | Python `v3.14.3`, Django `v6.0.7`, DRF `v3.17.1` |
| **Database** | SQLite (Local dev), Neon PostgreSQL (Production) | SQLite3 / PostgreSQL `v16+` |
| **Authentication** | JSON Web Tokens | SimpleJWT `v5.3` |
| **Styling** | Tailwind CSS utility system | Tailwind `v4.3.2` |
| **Drag and Drop** | DnD Kit physics-based sensors | `@dnd-kit/core v6.3.1`, `@dnd-kit/sortable v10.0.0` |
| **Annotation** | SVG overlay & canvas scaling | Custom HTML Canvas / React SVG Render |

---

## High-Level Architecture

The platform architecture follows a clear 6-step request-response sequence:

1. **User Interaction**: The user clicks, inputs tasks, drags cards, or places polygon coordinates on the frontend canvas.
2. **Authenticated Request**: The frontend API wrapper formats a REST query, injects the user's `Authorization: Bearer <token>` header, and sends it to the server.
3. **Validation & Ownership**: The Django backend checks the JWT token's validity and enforces row-level permissions (ensuring users can only access their own tasks, images, or polygons).
4. **Database Operation**: The Django models map records, coordinate calculations, or positional array sequences, executing transaction queries on the database.
5. **Response & Optimistic Sync**: The backend responds with updated JSON models, confirming database states. The frontend synchronizes client states immediately.
6. **Persistence**: All tasks, positions, images, and coordinate boundaries are securely stored, rendering accurately across sessions and page reloads.

---

## Repository Structure

```text
.
├── backend/              # Django REST API project folder
│   ├── api/              # API app modules (models, views, serials)
│   ├── config/           # Central settings and core URL routing
│   ├── manage.py         # Django CLI Manager
│   ├── requirements.txt  # Python dependency specification
│   └── README.md         # Detailed Backend documentation
├── frontend/             # React SPA project folder
│   ├── public/           # Static asset assets
│   ├── src/              # React source files (components, contexts, pages)
│   ├── package.json      # Node dependency specification
│   ├── vite.config.ts    # Vite bundler options
│   └── README.md         # Detailed Frontend documentation
├── .impeccable/          # Redesign parameters and token targets
└── README.md             # Core project overview (this file)
```

---

## Prerequisites

- **Node.js**: `v24.14.0` (tested)
- **npm**: `v11.9.0`
- **Python**: `v3.14.3` (tested)
- **pip**: Python package installer

---

## Quick Start Guide

To run the complete full-stack project locally, execute the following commands in separate terminals:

### 1. Run the Backend API
Navigate to the `backend/` directory, create a virtual environment, install packages, run migrations, and seed mock data:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000
```
*The backend API server will run at `http://127.0.0.1:8000`.*

### 2. Run the Frontend Client
Navigate to the `frontend/` directory, install packages, and launch Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
*The frontend client dev server will run at `http://localhost:5173`.*

### 3. Access the Application
1. Open `http://localhost:5173` in your browser.
2. Log in using the seeded credentials:
   - **Email**: `demo@pronfou.test`
   - **Password**: `demo12345`
3. Verify task board CRUD and drag-and-drop ordering.
4. Navigate to `/annotate` and upload images to test coordinates rendering.

---

## Developer Skills & Tooling Implemented

Development followed strict quality audits using agentic workflow commands and MCP tooling:
- **Grill Me**: Used to formulate the task position reordering protocol to handle cross-column index moves safely, and to stress-test coordinate normalization math and Postgres database transaction safety.
- **Impeccable**: Used to audit, refine, and shape visual hierarchies, contrast ratios, micro-animations, focus states, and z-index layout elements, ensuring a premium Technical Drafting Table aesthetic.
- **Caveman**: Used for raw, robust step-by-step local console logging, manual regression checks, and sanity testing of authentication cookies and local Storage state configurations.
- **Handoff**: Used for generating clean pre-commit checklists, git status checks, and detailed project milestone documentation to enable smooth transitions between development cycles.
- **Chrome DevTools MCP**: Integrated to automate browser viewport emulation (desktop `1280px` vs mobile `375px`), programmatically execute user interaction scripts (click events, input forms fills), and capture rendered page state screenshots.
- **Vercel MCP**: Integrated to list project configurations, query active deployments, fetch build logs, and monitor remote deployment pipelines directly.
