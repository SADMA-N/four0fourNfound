# 404 Project Not Found - Frontend

This React/TypeScript single-page application serves as the frontend client dashboard for the task Kanban board and image annotation workspace. It uses Tailwind CSS v4 for modern styling, Lucide React for UI iconography, and `@dnd-kit` for drag-and-drop mechanics.

---

## Environment Stack & Versions

- **Node.js Version:** `v24.14.0` (tested)
- **npm Version:** `v11.9.0` (tested)
- **TypeScript Version:** `v7.0.2`
- **React Version:** `v19.2.7`
- **Vite Version:** `v8.1.4` (with `@tailwindcss/vite` compiler integration)

---

## Run Instructions (Step-by-Step)

To run the frontend client locally:

### 1. Install Node.js Dependencies
Navigate to the `frontend/` directory and install the packages:
```bash
npm install
```

### 2. Configure Local Environment Variables
By default, the client points to the local backend service:
```env
VITE_API_URL=http://127.0.0.1:8000/api
```
To target a different API server, create a `.env` file in the `frontend/` root folder and declare the variable.

### 3. Launch the Local Development Server
Start the Vite dev server:
```bash
npm run dev
```
The application will now be running at `http://localhost:5173`. Open this URL in your web browser.

---

## Saga of the Villains (Difficulties & Solutions)

Throughout the development saga, several dark villains emerged to disrupt our frontend architecture. Here is how they were defeated using the power of AI, documentation, and friendship:

### Villain 1: TypeScript Event Types under `verbatimModuleSyntax`
* **The Threat:** The strict `"verbatimModuleSyntax": true` configuration blocks mixed runtime/type imports. Attempting to write `import { FormEvent, useState } from "react"` caused immediate compiler failures.
* **The Victory:** By reading the compiler guidelines and using TypeScript type imports explicitly (`import type { FormEvent } from "react"`), we kept runtime and compile-time structures separated, resolving the compile errors.

### Villain 2: Timezone-Safe ISO Date Math
* **The Threat:** Standard JavaScript `.toISOString()` calls convert dates to UTC time. When adding or selecting dates near midnight, timezone offsets shifted the local date selection forward or backward by one full day.
* **The Victory:** In `DateContext.tsx`, we created a custom timezone-aware date parser helper. By adjusting the timezone minute offsets prior to parsing the ISO string, date queries remain perfectly consistent with the user's local calendar day.

### Villain 3: Drag and Drop Button Clicks
* **The Threat:** Standard drag sensors intercept all pointer/click events. Clicking "Edit" or "Delete" inside task cards was hijacked, triggering a drag event instead of the action button clicks.
* **The Victory:** We applied an `activationConstraint: { distance: 5 }` on `@dnd-kit`'s `PointerSensor` and restricted the drag handle target to the `GripVertical` icon handle. This leaves standard card buttons fully clickable and functional.

### Villain 4: Sortable Drag-and-Drop and Inter-Column Movement
* **The Threat:** The initial drag-and-drop system was naive: moving a task to a column always appended it to the bottom, and reordering within the same column was completely unsupported.
* **The Victory:** We rebuilt the drag-and-drop handler to track drop target indicators, calculate exact vertical hover coordinates, and dynamically compute the insertion index based on cursor drop position. The backend updates the position values of all existing items on save to persist this sequence.
