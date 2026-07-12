# 404 Project Not Found - Frontend

This React/TypeScript single-page application serves as the frontend client dashboard for the task Kanban board and image annotation workspace. It uses Tailwind CSS v4 for modern styling, Lucide React for UI iconography, and `@dnd-kit` for drag-and-drop mechanics.

# Environment Stack

- **Node.js:** `v24.14.0` (tested)
- **npm:** `11.9.0` (tested)
- **TypeScript:** `v7.0.2`
- **React:** `v19.2.7`
- **Vite:** `v8.1.4` (with `@tailwindcss/vite` compiler integration)

## Run Instructions

Navigate to the frontend folder and run the setup commands:

```bash
# Install node packages
npm install

# Run the local development server (starts on http://localhost:5173)
npm run dev
```

## Environment Config

By default, the frontend points to the local backend URL:  
 VITE_API_URL=http://127.0.0.1:8000/api

This can be overridden by creating a .env file in the frontend root directory.

## Demo Credentials

• Email: demo@pronfou.test  
 • Password: demo12345

## Difficulties & Solutions

### 1. Typescript Event Types under verbatimModuleSyntax

The Villain: Strict "verbatimModuleSyntax": true configuration blocks mixed runtime/type imports. Mix imports like import { FormEvent, useState } from "react" caused immediate compiler failures.
The Solution: We separated types into explicit import type imports, keeping TS compile-checks safe.

### 2. Timezone-Safe ISO Date Math

The Villain: Standard .toISOString() calls convert times to UTC. Shifting dates forward or backward near midnight offset the local date selection by one day depending on the user's local timezone.  
The Solution: Inside DateContext.tsx we implemented toLocalIsoDate , offsetting timezone minutes prior to string parsing, keeping date filtering accurate.

### 3. Drag and Drop Button Clicks

The Villain: Simple pointer-drag sensors hijack clicks. Clicking "Edit" or "Delete" inside task cards triggered drag events instead of clicks.  
The Solution: We defined an `activationConstraint: { distance: 5 }` on `@dnd-kit`'s `PointerSensor` and attached the drag handles exclusively to the `GripVertical` icon. This leaves standard card buttons fully interactive.

### 4. Sortable Drag-and-Drop and Inter-Column Movement

The Villain: The initial drag-and-drop system was naive: moving a task to a column always appended it to the bottom, and reordering within the same column was completely unsupported.
The Solution: We rebuilt the drag-and-drop handler to track drop target indicators, calculate exact vertical hover coordinates, and dynamically compute the insertion index based on cursor drop position. The backend updates the position values of all existing items on save to persist this sequence.
