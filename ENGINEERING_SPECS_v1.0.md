# Engineering Specs v1.0

## API Endpoints

### Projects
- `GET /api/projects` — List all projects
- `POST /api/projects` — Create new project
- `GET /api/projects/:id` — Get project details
- `PUT /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project

### Budget Items
- `GET /api/projects/:id/items` — List budget items
- `POST /api/projects/:id/items` — Add item
- `PUT /api/items/:id` — Update item
- `DELETE /api/items/:id` — Delete item

## Database
- **Engine:** PostgreSQL 15+
- **Tables:** users, projects, budget_items, predictions
- **Connection Pool:** pg (10-20 connections)

## Authentication
- **Method:** JWT (JSON Web Tokens)
- **Duration:** 24 hours
- **Refresh:** Via refresh token endpoint
