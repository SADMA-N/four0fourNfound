# 404 Project Not Found — Backend

A robust Django REST Framework (DRF) API service serving as the persistence and business logic layer for the unified Task Kanban Board and Computer Vision Image Annotation Workspace.

---

## Overview

The backend supports:
1. **User Identity Operations**: User registration, login verification, and profile extraction using JSON Web Tokens (JWT).
2. **Scoped Kanban Board**: CRUD operations for tasks scoped by date. Handles same-column and cross-column reordering index positioning.
3. **Annotation Assets**: Media uploader files handling and normalized vector polygon coordinate storage.

---

## Current Features

- **Authentication Control**: JWT-based stateless authentication (`djangorestframework-simplejwt`).
- **Owner Scope Isolations**: Row-level object ownership constraints. Users can only query, edit, or reorder their own tasks and images.
- **Task Attributes**: Priority tags, status fields, category tags, due date targets, and ordering keys.
- **Position Persistence**: Positional indices updated transactionally via a dedicated `/api/tasks/reorder/` PUT request.
- **Media File Storage**: Dynamic image uploading. Integrates local disk storage for development environments and Cloudinary CDN for cloud environments.
- **Coordinates Normalization**: Polygon coordinates saved as percentage fractions (`0.0` - `1.0`) relative to width/height to support responsive client layouts.
- **Database Schema**: Pre-configured SQLite migrations for quick local setup, and Neon PostgreSQL adapters for scalable production deployments.

---

## Technology Stack

- **Python**: `v3.14.3` (tested and verified)
- **Django**: `v6.0.7` (web application framework)
- **Django REST Framework**: `v3.17.1` (REST interface compiler)
- **djangorestframework-simplejwt**: `v5.3` (JWT handlers)
- **Database**:
  - Local: SQLite (`db.sqlite3` initialized by default)
  - Production: Neon PostgreSQL (`psycopg2-binary` connector)
- **File Cloud storage**: `cloudinary` and `django-cloudinary-storage`
- **Environment variables manager**: `python-dotenv`

---

## Backend Architecture

- **Project Entry**: `manage.py` starts the local web app and migration tasks.
- **Routing**: `config/urls.py` directs endpoints to `api/urls.py`.
- **API Apps**:
  - `api/models.py`: Database models:
    - `Task`: Holds description details, priority, status column targets, dates, tags, and position indices.
    - `AnnotatedImage`: Tracks uploaded file objects and names.
    - `AnnotationPolygon`: Contains uploader color hex keys, text labels, and point lists.
  - `api/views.py`: API controllers enforcing auth and handling operations:
    - `LoginView`/`SignupView`/`UserMeView`: Authentication endpoints.
    - `TaskListView`/`TaskDetailView`/`TaskReorderView`: Task CRUD and reorder positioning logic.
    - `ImageListView`/`ImageDetailView`: File uploads and removals.
    - `PolygonCreateView`/`PolygonDetailView`: Annotation handlers.
  - `api/serializers.py`: Serializes and validates payloads.
- **Settings**: `config/settings.py` manages environment options, CORS policies, security, and cloud storage triggers.

---

## Project Structure

```
backend/
├── api/                  # Primary API App
│   ├── management/       # Seeding commands
│   ├── migrations/       # Schema files
│   ├── models.py         # DB Models
│   ├── serializers.py    # Serializers
│   ├── urls.py           # Endpoint routes
│   └── views.py          # View handlers
├── config/               # Settings and Configurations
│   ├── settings.py       # Django Settings
│   └── urls.py           # Core URL Routing
├── manage.py             # Django Manager CLI
└── requirements.txt      # Python Dependencies
```

---

## Prerequisites

- **Python**: `v3.14.3` (recommended)
- **pip**: Python package manager
- **Database**: SQLite (default local) or PostgreSQL (configured via env variables)

---

## Environment Variables

Configure a `.env` file inside `backend/` to override default settings:

```env
# Production Database Connection URL
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require

# Cloudinary Integration API Keys (leave empty for local disk storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Installation and Setup

Follow these numbered steps to configure the backend locally on your system:

1. **Enter the backend folder**:
   ```bash
   cd backend
   ```

2. **Initialize Python Virtual Environment**:
   ```bash
   python3 -m venv .venv
   ```

3. **Activate Virtual Environment**:
   - **Linux/macOS**:
     ```bash
     source .venv/bin/activate
     ```
   - **Windows**:
     ```cmd
     .venv\Scripts\activate
     ```

4. **Install backend dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *Expected Output: Installs Django, DRF, JWT adapters, and storage engines with confirmation logs.*

5. **Apply Database Migrations**:
   Create SQLite tables:
   ```bash
   python manage.py migrate
   ```
   *Expected Output: Logs detailing migrations successfully applied for authentication modules and API models.*

6. **Seed Local Database with Demo Account**:
   ```bash
   python manage.py seed_demo
   ```
   *Expected Output: Console confirmation that user `demo@pronfou.test` with password `demo12345` and sample tasks have been seeded.*

7. **Launch Development Server**:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
   *Expected Output:*
   ```
   System check identified no issues (0 silenced).
   Django version 6.0.7, using settings 'config.settings'
   Starting development server at http://0.0.0.0:8000/
   ```

---

## Running the Backend

The primary server runs locally using:
```bash
python manage.py runserver 0.0.0.0:8000
```
To query test suites, execute:
```bash
python manage.py test
```

---

## Database Setup and Migrations

Migrations are managed via standard Django CLI:
- Track schema alterations: `python manage.py makemigrations`
- Write changes to the DB: `python manage.py migrate`

Local SQLite `db.sqlite3` runs automatically if no `DATABASE_URL` matches. In production environments, `DATABASE_URL` is parsed by `dj-database-url` to establish SSL connections to PostgreSQL databases.

---

## API Overview

| Method | Endpoint | Description | Auth Required | Keys |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/signup/` | Register a profile | No | `email`, `password` |
| **POST** | `/api/auth/login/` | Request JWT token | No | `email`, `password` |
| **GET** | `/api/auth/me/` | Fetch current profile details | Yes | None |
| **GET** | `/api/tasks/` | List tasks by date query | Yes | `date` |
| **POST** | `/api/tasks/` | Create a task card | Yes | `title`, `status`, `priority`, `dueDate`, `tags` |
| **PATCH** | `/api/tasks/<id>/` | Modify task attributes | Yes | Partial update fields |
| **DELETE** | `/api/tasks/<id>/` | Remove task card | Yes | None |
| **PUT** | `/api/tasks/reorder/` | Batch save positions | Yes | `date`, `order` mapping |
| **GET** | `/api/images/` | Fetch uploaded assets | Yes | None |
| **POST** | `/api/images/` | Upload files as form data | Yes | `images` array |
| **DELETE** | `/api/images/<id>/` | Delete asset and clean storage | Yes | None |
| **POST** | `/api/images/<id>/polygons/` | Add annotation points | Yes | `points`, `color`, `label` |
| **DELETE** | `/api/polygons/<id>/` | Delete annotation polygon | Yes | None |

---

## Authentication Flow

1. Client POSTs login credentials. View returns SimpleJWT JWT token (`access` and `refresh`).
2. Client includes the token string inside headers for request permissions.
3. SimpleJWT verifies token hashes against DB profiles. Rejecting invalid requests with `401 Unauthorized` headers.
4. Logging out simply destroys the client local state.

---

## Data Models

- **User**: Standard Django user database (username used for email).
- **Task**: Fields map titles, priorities (low, medium, high, urgent), statuses (todo, in_progress, done), and position index keys.
- **AnnotatedImage**: Records image uploads, absolute server links, original names, and owner IDs.
- **AnnotationPolygon**: Tracks polygon vertices, labels, colors, and links directly to parent uploader files.

---

## Main Request Flows

- **Reordering**:
  - `TaskReorderView` wraps actions in a transaction.
  - Queries all user-owned tasks matching the target date.
  - Validates that every ID submitted is matching.
  - Sequentially applies position integer values based on order arrays.
- **Image Deletions**:
  - `ImageDetailView` handles deletes.
  - Triggers filesystem file cleaning automatically prior to removing the DB database record.

---

## Media and File Uploads

- **Storage Engine**: `FileSystemStorage` (dev) / `CloudinaryStorage` (production).
- **Formats**: Supports JPEG, PNG, WEBP.
- **Cleaning**: Overrides standard API limits to delete files from servers when the model drops from database indexes.

---

## Challenges, Villains, and How We Overcame Them

### Villain 1: Orphaned Local & Cloud Files on DB Deletion
- **Problem**: File resources remained stored on disks or Cloudinary containers after tasks were deleted.
- **Symptom**: Cloud storage limits filled up with orphaned assets.
- **Root Cause**: Django REST Framework `.delete()` commands remove database records but do not clean storage assets.
- **Approach & Solution**: Overwrote `ImageDetailView.delete` method to explicitly trigger `image.image.delete(save=False)` prior to executing super deletion.
- **Verification**: Verified by uploading an image, deleting it, and checking the uploads directory. The file was purged.

### Villain 2: Position Constraint Mismatches on Postgres
- **Problem**: Reordering operations triggered occasional database conflicts when applying positions.
- **Symptom**: Saving reorders on Postgres returned `IntegrityError` duplicate key conflicts.
- **Root Cause**: Updating positions inline in database columns triggers constraint checks mid-transaction.
- **Approach & Solution**: Leveraged atomic transaction blocks and bulk-ordered positional increments dynamically.
- **Verification**: Ran `python manage.py test` to execute ordering tests on temporary databases. All tests passed.

### Villain 3: Invalid Cloudinary Signatures from Copied Credentials
- **Problem**: Cloud uploads returned `Invalid Signature` credential errors.
- **Symptom**: Images failed to load when pushing code to serverless containers.
- **Root Cause**: Character confusion in credentials string (lowercase `l` vs capital `I`).
- **Approach & Solution**: Wrote a credential tester script that tested permutations of keys, revealing the correct API key string.
- **Verification**: Verified using live upload tests, which returned successful response blocks.

---

## Verification and Testing

Execute the test suites:
```bash
python manage.py test
```
*Expected Output: Runs 20+ tests verifying authentication scopes, CORS parameters, task reordering conflicts, uploader cleaning, and database schemas.*

---

## Troubleshooting

- **Database Integrity Error on Reorder**: Verify that all task IDs match the owner and target date.
- **Cloudinary signature errors**: Check credentials inside `.env` configurations.
- **CORS blockages**: Check CORS configurations in `config/settings.py`.

---

## Deployment Notes

Deploys natively to Vercel via WSGI handler bindings in `vercel.json` and WSGI integrations inside the `config/` module.

---

## Known Limitations

- **Media size limit**: Cloudinary free tier enforces limits on single file sizes.
- **Concurrent DB writes**: SQLite enforces file locks during concurrent writes, so PostgreSQL should be used for production settings.

---

## Future Improvements

- Set up automated migration verification checks.
- Add support for pagination on task list collections.

---

## Version and Environment Summary

- **Python**: `v3.14.3`
- **Django**: `v6.0.7`
- **DRF**: `v3.17.1`
- **Database**: SQLite (local) / Neon PostgreSQL (production)
- **Local Dev URL**: `http://localhost:8000`

---

## Developer Skills Implemented

This project utilized agent frameworks to enforce design and code standards:
- **Grill Me**: Used to formulate the task position reordering protocol to handle cross-column index moves safely.
- **Impeccable**: Used to polish formatting styles and API JSON responses to match client expectations.
