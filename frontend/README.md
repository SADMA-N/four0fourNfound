# 404 Project Not Found — Frontend

A professional, high-performance Kanban Task Board and Image Annotation Workspace built with React, TypeScript, and Tailwind CSS. The user interface implements a cohesive, technical "Drafting Table" design aesthetic.

---

## Overview

The frontend serves as the primary workspace for:
1. **Task Planning**: A daily Kanban board with columns structured as *To Do*, *In Progress*, and *Done* (modeled as "Zones 01, 02, and 03"). Tasks support priority tags, custom category tags, and exact drag-and-drop ordering.
2. **Computer Vision Annotations**: An interactive image uploader, uploader film-strip rail, and vector canvas that handles scaling, saving, and removing custom polygon annotations on uploaded media.

The client links securely with the backend API service using JWT-based authentication tokens.

---

## Current Features

- **Authentication Suite**: Custom styled Sign In and Create Account pages featuring distinct, interactive technical schematic blueprint diagrams (drawn using pure vector CSS and HTML structures).
- **Protected Routes**: React Router client-side path validation. Unauthenticated navigation routes directly back to `/login`.
- **Date-Based Task Board**: Interactive date navigator that queries tasks scoped to specific calendar dates.
- **Kanban Columns**: Task zones featuring clean typography contrast, priority badges, category tags, and counters.
- **Advanced Drag-and-Drop**: Same-column reordering and cross-column status transitions with exact insertion index tracking and position persistence.
- **Image Scroller**: A film-strip thumbnail preview rail with active selections, selection accent bars, and polygon count badges.
- **Annotation Canvas**: Multi-vertex drawing overlay rendering vectors on a checkerboard backdrop. Supports active cursor tracing, point undo, canvas clearing, custom labels, and nameable color palettes.
- **Responsive Workspace**: Clean stacking layouts for tablet/mobile widths.
- **Accessible Design**: Focus indicators for keyboard navigation, autocomplete attributes for browser autofill, and screen reader-friendly roles (`role="alert"` for form errors).
- **Drafting Table Theme**: Warm drafting paper surfaces, blueprint-indigo text, cyan primary action triggers, and strict monospace metadata fonts.

---

## Technology Stack

- **React**: `v19.2.7` (runs as a Single Page Application)
- **TypeScript**: `v7.0.2` (strict module syntax enforced)
- **Vite**: `v8.1.4` (compiled via `@tailwindcss/vite` plugin)
- **Tailwind CSS**: `v4.3.2` (modern CSS variable utility framework)
- **@dnd-kit**: `@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`, `@dnd-kit/utilities ^3.2.2` (for smooth physics-based drag-and-drop)
- **Lucide React**: `v1.24.0` (for technical iconography)
- **React Router DOM**: `v7.18.1` (client-side routing)

---

## Frontend Architecture

- **Entry Point**: `src/main.tsx` mounts the React tree into `index.html`.
- **Routing**: `src/App.tsx` configures the public authentication routes, private routes, navigation sidebar, and version stamp footer.
- **State Flow**:
  - `src/context/AuthContext.tsx`: Tracks current logged-in user profile, handles credential state, tokens, login, signup, and logout.
  - `src/context/DateContext.tsx`: Manages active calendar date selections throughout the task board.
- **API Integration**: `src/api.ts` houses a centralized class wrapping fetch queries. Injects `Authorization: Bearer <token>` automatically and handles JSON conversion.
- **Pages**:
  - `src/pages/LoginPage.tsx`: Renders the login card alongside the "Workspace Overview" system blueprint.
  - `src/pages/SignupPage.tsx`: Renders the signup card alongside the "Workspace Construction" blueprint.
  - `src/pages/TasksPage.tsx`: The primary Kanban task management interface.
  - `src/pages/AnnotatePage.tsx`: The computer vision uploader and workspace.
- **Components**:
  - `src/components/Board.tsx` & `Column.tsx`: Layout blocks orchestrating column grids, empty states, and dnd sorting areas.
  - `src/components/TaskCard.tsx`: Task items containing priorities, tags, metadata, edit triggers, and drag handles.
  - `src/components/TaskModal.tsx`: Popup window handling task creation and detail updates.
  - `src/components/DateSelector.tsx`: Date calendar inputs and navigation buttons.
  - `src/components/ImageScroller.tsx`: Thumbnail scroller rail for uploaded images.
  - `src/components/AnnotationCanvas.tsx`: Interactive SVG and vector drawing canvas.

---

## Project Structure

```
frontend/
├── .impeccable/          # Design tokens and stages metadata
├── .vercel/              # Local Vercel deploy configuration
├── public/               # Public assets (icons, favicon)
├── src/
│   ├── assets/           # Client assets
│   ├── components/       # Reusable components
│   ├── context/          # State providers (Auth, Date)
│   ├── pages/            # Page templates (Login, Signup, Tasks, Annotate)
│   ├── api.ts            # REST API client
│   ├── App.tsx           # Router and Navigation Sidebar
│   ├── main.tsx          # App mounter
│   ├── types.ts          # TypeScript models
│   └── index.css         # Tailwind tokens & custom utilities
├── index.html            # Entry HTML template
├── package.json          # Dependency list
├── tsconfig.json         # TypeScript compiler configurations
├── vercel.json           # Vercel deployment routes config
└── vite.config.ts        # Vite build configurations
```

---

## Prerequisites

- **Node.js**: `v24.14.0` (tested and recommended)
- **npm**: `v11.9.0` (or compatible yarn/pnpm version)
- **Running Backend**: The frontend expects the Django REST Framework API to be running on `http://127.0.0.1:8000/api` for local operation.

---

## Environment Variables

The application can be configured by creating a `.env` file in the `frontend/` root:

```env
# URL pointing to the running backend service
VITE_API_URL=http://127.0.0.1:8000/api
```

---

## Installation and Setup

Follow these numbered steps to run the frontend client locally:

1. **Enter the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```
   *Expected Output: A standard npm tree installation report with zero package conflicts.*

3. **Configure environment (Optional)**:
   Create a `.env` file matching the template if your backend API is hosted at a different address.

4. **Launch Vite Development Server**:
   ```bash
   npm run dev
   ```
   *Expected Output:*
   ```
   VITE v8.1.4 ready in 433 ms
   ➜ Local: http://localhost:5173/
   ```

5. **Open Browser**:
   Open `http://localhost:5173` in your web browser.

---

## Running the Frontend

Use the following npm scripts defined in `package.json`:

- **Run Dev Server**: `npm run dev`
- **Build Client Bundle**: `npm run build` (runs typechecking and compiles client into `dist/`)
- **Preview Production Bundle**: `npm run preview` (runs local server serving the `dist/` directory)

*Note: No custom test scripts or linter scripts are defined in this package.*

---

## Connecting to the Backend

The client communicates with the backend via JSON REST payloads. When a user logs in, the JWT token returned by the server is saved in the browser's `localStorage` as `pronfou_token`. Subsequent API calls retrieve the token and inject it as a bearer credential header:
```http
Authorization: Bearer <token>
```
CORS middleware configured on the Django server authorizes incoming client requests originating from local dev ports (`http://localhost:5173`, etc.).

---

## Main User Workflows

### 1. Account Login or Registration
- Open `http://localhost:5173/login`. Use default demo credentials (`demo@pronfou.test` / `demo12345`) or click **Sign up** to register a new profile.
- Registration validates matching passwords client-side and authenticates directly.

### 2. Task Management (CRUD)
- On the dashboard, click **Add task** to trigger the modal.
- Enter title, choose column status (*To Do*, *In Progress*, *Done*), select priority, set a due date, and input tag items. Click **Save task**.
- Click the edit pencil icon on a task card to modify details, or click the trash can icon to delete it.

### 3. Drag-and-Drop Task Reordering
- Press and hold the vertical grip handle on any task card.
- Drag the card either vertically within the same column to reorder, or drag horizontally across columns to switch status.
- Dropping triggers an optimistic UI reorder while immediately dispatching a PUT request to `/api/tasks/reorder/` to update position values.

### 4. Image Annotations
- Navigate to the **Annotate** workspace from the sidebar.
- Click **Upload images** and select image files.
- Click on an image in the thumbnail rail. Place points sequentially on the canvas to draw an annotation boundary.
- Enter an object label name, select a color swatch, and click **Save polygon**.
- Click the trash can next to a polygon in the sidebar list to delete it from both the list and the vector overlay.

---

## Design System

The visual design follows a cohesive, professional **Drafting Table** schema:
- **Paper Backdrop**: Saturated warm neutral surfaces (`oklch(96.8% 0.007 85)`) reminiscent of technical layout paper.
- **Architectural Ink**: Deep blueprint indigo typography (`oklch(22% 0.04 258)`) replaces harsh blacks.
- **Blueprint Accents**: Primary action buttons and selections use cyan (`oklch(66% 0.155 215)`) referencing blueprint cyan.
- **Monospace Elements**: Numeric counts, date parameters, and title blocks use JetBrains Mono to reinforce technical clarity.

---

## Challenges, Villains, and How We Overcame Them

### Villain 1: TypeScript verbatimModuleSyntax Compilation Blocker
- **Problem**: React packages utilize type bindings that failed compilation under strict module syntax.
- **Symptom**: Compilation errored out with imports containing both type names and component variables.
- **Root Cause**: `"verbatimModuleSyntax": true` in `tsconfig.json` forbids mixed module type declarations.
- **Approach & Solution**: Separated all type-level bindings by utilizing `import type { ... }` in components like `TaskModal.tsx`.
- **Verification**: Verified using `npm run build` which runs the compiler (`tsc -b`). Completed with zero errors.

### Villain 2: Keyboard Trigger Conflicts on Drag Handles
- **Problem**: Card action buttons (Edit/Delete) became unreachable.
- **Symptom**: Clicking Edit or Delete on mobile viewport or via mouse triggered a drag event instead of opening the modals.
- **Root Cause**: `@dnd-kit`'s default `PointerSensor` hijacked all raw clicks inside the card bounding boxes.
- **Approach & Solution**: Structured a custom sensor array, applying an `activationConstraint: { distance: 5 }` restriction and confining the drag handles specifically to the `GripVertical` handle node.
- **Verification**: Tested manually in local browser, confirming modals open instantly on click while drag transitions function on drag handles.

### Villain 3: Responsive Annotation Canvas Scaling
- **Problem**: Vector polygons misaligned when viewing the canvas across screen widths.
- **Symptom**: Annotations drawn on desktop sizes rendered off-center or clipped when displayed on mobile sizes.
- **Root Cause**: Original coordinates were saved as absolute pixels relative to a fixed screen container size.
- **Approach & Solution**: Normalized all drawn canvas coordinates to relative float values between `0.0` and `1.0` relative to the image's bounding box. The canvas scales these percentages dynamically on window resize hooks.
- **Verification**: Resized the browser layout using DevTools from `1280px` to `375px` and verified that polygons scaled and aligned perfectly with the underlying pixels.

---

## Verification and Testing

Since no automated test scripts are configured for the frontend:
- **Compilation Check**: Run `npm run build` to confirm TypeScript compile validation.
- **Responsive Check**: Emulate mobile viewport sizes (`375px`) in browser inspector.
- **Session Validation**: Perform logouts, register new accounts, and verify redirect protections manually.

---

## Troubleshooting

- **Backend Connection Failure**: Ensure the Django backend service is running and accessible on port `8000`.
- **CORS Blockers**: Verify `VITE_API_URL` environment variables exactly match backend settings hosts.
- **Incorrect Date Queries**: Confirm your computer's system calendar matches the date selected in the task navigator.

---

## Production Build

To build and run the production version:
1. Compile assets:
   ```bash
   npm run build
   ```
2. Serve the built bundle locally:
   ```bash
   npm run preview
   ```

---

## Known Limitations

- **Touch Interactivity**: Drag-and-drop operations on mobile touch viewports may require firm touch holds to distinguish scroll gestures from card grips.
- **Canvas Undo Limits**: Annotation point undo steps are tracked in memory and clear if the selected image changes or page reloads.

---

## Future Improvements

- Add automated unit tests for layout pages using vitest.
- Support multi-layer polygon annotation options.

---

## Version and Environment Summary

- **Node.js**: `v24.14.0`
- **npm**: `v11.9.0`
- **Vite**: `v8.1.4`
- **React**: `v19.2.7`
- **TypeScript**: `v7.0.2`
- **OS Platform**: Linux (Ubuntu/Debian)
- **Local Dev Client URL**: `http://localhost:5173`
- **Local API Endpoint URL**: `http://127.0.0.1:8000/api`

---

## Developer Skills Implemented

This project utilized specialized agent workflows to harden and refine frontend design and code qualities:
- **Grill Me**: Used to align complex architectural patterns and deep technical questions around coordinate scaling and state transitions prior to code writing.
- **Impeccable**: Used to audit, refine, and shape visual hierarchies, contrast ratios, micro-animations, and z-index structures to create a premium Drafting Table aesthetic.
