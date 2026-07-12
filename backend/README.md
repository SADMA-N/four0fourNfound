# 404 Project Not Found - Backend

This Django REST Framework API serves as the persistence layer for the task Kanban board and image annotation modules. It manages database records in SQLite,performs JWT token validation, handles image uploads, and scales polygon coordinates.

## Environment Stack

- **Python:** `v3.14.3`
- **Django:** `v6.0.7`
- **Django REST Framework:** `v3.17.1`
- **Database:** SQLite Persistence (via Django ORM)

## Run Instructions

Navigate to the backend folder and run the setup commands:

```bash
# Create python virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install required packages
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed the database with demo user & tasks
python manage.py seed_demo

# Run the local development server
python manage.py runserver 0.0.0.0:8000
```

## Demo Credentials

• Email: demo@pronfou.test  
• Password: demo12345

## API Routing Table

• POST /api/auth/login/ -> Authenticates credentials and returns a JWT access token.  
• GET /api/auth/me/ -> Returns the logged-in user profile details (protected).  
• GET /api/tasks/ -> Lists tasks for the user filtered by date query parameter (protected).  
• POST /api/tasks/ -> Creates a new task (protected).  
• PATCH /api/tasks/<id>/ -> Modifies task details or shifts columns (protected).  
• DELETE /api/tasks/<id>/ -> Deletes a task (protected).  
• GET /api/images/ -> Lists uploaded images and their child polygons (protected).  
• POST /api/images/ -> Uploads one or more images to the media folder (protected).  
• DELETE /api/images/<id>/ -> Deletes an image and purges its file from disk (protected).  
• POST /api/images/<id>/polygons/ -> Creates a polygon shape relative to an image (protected).  
• DELETE /api/polygons/<id>/ -> Deletes an annotation polygon shape (protected).

## Difficulties & Solutions

### 1. File Deletion on Model Cleanup

The Villain: Standard Django .delete() calls on model objects remove rows from SQLite but do not clean up physical image assets on disk. This results in orphaned files cluttering storage.
The Solution: Inside ImageDetailView.delete , we explicitly trigger image.image.delete (save=False) to force disk scrubbing prior to DB row deletion, keeping our file directories clean.

### 2. Relative Image Annotation Scales

The Villain: Images render at different pixel widths/heights depending on the client screen size. Absolute pixel coordinates drawn on a desktop screen would align incorrectly on a tablet.  
The Solution: We normalized coordinate vertices to float fractions between 0.0 and 1.0 (relative to the image width and height) on saving, allowing the frontend to scale polygons dynamically to fit any display viewport.
