# 404 Project Not Found - Backend

This Django REST Framework API serves as the persistence layer for the task Kanban board and image annotation modules. It manages database records, performs JWT token validation, handles image uploads, and scales polygon coordinates.

---

## Environment Stack & Versions

- **Python Version:** `v3.14.3` (tested)
- **Django Version:** `v6.0.7`
- **Django REST Framework Version:** `v3.17.1`
- **Database:** Neon PostgreSQL (Local & Production via DATABASE_URL)
- **Cloud Storage Integration:** Cloudinary (for persistent image uploads on serverless platforms)

---

## Run Instructions (Step-by-Step)

To run the backend service locally:

### 1. Create a Python Virtual Environment

Navigate to the `backend/` directory and initialize a virtualenv:

```bash
python3 -m venv .venv
```

### 2. Activate the Virtual Environment

Activate the environment to isolate dependencies:

- **Linux/macOS:**
  ```bash
  source .venv/bin/activate
  ```
- **Windows:**
  ```cmd
  .venv\Scripts\activate
  ```

### 3. Install Dependencies

Install all packages defined in the requirements file:

```bash
pip install -r requirements.txt
```

### 4. Database Migrations

Generate and apply migrations to build the database schema (SQLite or PostgreSQL depending on environment):

```bash
python manage.py migrate
```

### 5. Seed Demo Data

Populate the database with a pre-configured demo user and task setup:

```bash
python manage.py seed_demo
```

### 6. Run the Local Development Server

Launch the local server:

```bash
python manage.py runserver 0.0.0.0:8000
```

The server will now be accessible at `http://127.0.0.1:8000`.

---

## Environment Configuration

Create a `.env` file in the `backend/` root directory to customize the environment:

```env
# Database configuration url (defaults to local SQLite if omitted)
DATABASE_URL=postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require

# Cloudinary Integration (leave blank to fall back to local disk storage in development)
CLOUDINARY_CLOUD_NAME=NAME
CLOUDINARY_API_KEY=API_KEY
CLOUDINARY_API_SECRET=SECRET_API
```

---

## API Routing Table

- **POST** `/api/auth/login/` -> Authenticates credentials and returns a JWT access token.
- **GET** `/api/auth/me/` -> Returns the logged-in user profile details (protected).
- **GET** `/api/tasks/` -> Lists tasks for the user filtered by date query parameter (protected).
- **POST** `/api/tasks/` -> Creates a new task (protected).
- **PATCH** `/api/tasks/<id>/` -> Modifies task details or shifts columns (protected).
- **DELETE** `/api/tasks/<id>/` -> Deletes a task (protected).
- **GET** `/api/images/` -> Lists uploaded images and their child polygons (protected).
- **POST** `/api/images/` -> Uploads one or more images (protected).
- **DELETE** `/api/images/<id>/` -> Deletes an image and purges its file (protected).
- **POST** `/api/images/<id>/polygons/` -> Creates a polygon shape relative to an image (protected).
- **DELETE** `/api/polygons/<id>/` -> Deletes an annotation polygon shape (protected).

---

## Saga of the Villains (Difficulties & Solutions)

Throughout the development saga, several dark villains emerged to disrupt our systems. Here is how they were defeated using the power of AI, documentation, and friendship:

### Villain 1: File Deletion on Model Cleanup

- **The Threat:** Standard Django `.delete()` calls on model objects removed rows from the database but left the physical files orphaned on the storage disk.
- **The Victory:** In `ImageDetailView.delete`, we added code to explicitly invoke `image.image.delete(save=False)` right before calling the database delete, successfully purging the file on disk.

### Villain 2: Relative Image Annotation Scales

- **The Threat:** Images render at different pixel widths/heights depending on client screen sizes. Absolute pixel coordinate paths drawn on one screen layout would align incorrectly on another device.
- **The Victory:** Guided by documentation, we normalized coordinate vertices to float fractions between `0.0` and `1.0` (relative to width and height) on saving, allowing the frontend to dynamically scale polygons to fit any screen viewport.

### Villain 3: The Production Database Schema Mismatch

- **The Threat:** Applying database migrations locally on Neon PostgreSQL added a `position` column with a `NOT NULL` constraint. However, the Vercel production server was running older backend code that did not supply a value for `position` during task creation, triggering `IntegrityError` (500) alerts.
- **The Victory:** We redeployed the updated Django views to Vercel, ensuring the codebase and database schema are in perfect synchronization.

### Villain 4: Ephemeral Filesystem Storage on Vercel Serverless

- **The Threat:** Vercel serverless containers are ephemeral and completely isolated. Uploading files to `/tmp/media` on one container resulted in immediate `404 Not Found` errors when subsequent requests were routed to different container instances.
- **The Victory:** We integrated `django-cloudinary-storage` as our production file storage engine. Uploaded media is now securely offloaded to Cloudinary CDN, guaranteeing that images load consistently across all serverless requests.

### Villain 5: Signature Authorization Failures from Copied Credentials

- **The Threat:** Copying API Secrets from screenshots introduced character confusion due to sans-serif font rendering. Lowercase `l` and uppercase `I` look identical, causing Cloudinary to reject uploads with an `Invalid Signature` exception.
- **The Victory:** We wrote an automated Python validation script to test all potential credential permutations against the Cloudinary endpoint, revealing the correct API secret contained a capital `I` (`Ymf5__jKFT5cKmGAIxWHQjJG1XY`) instead of a lowercase `l`.
