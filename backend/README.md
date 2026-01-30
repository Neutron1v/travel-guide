# Travel Planner API (Backend)

REST API for managing travel projects and places, using the [Art Institute of Chicago API](https://api.artic.edu/docs/#collections) to validate and reference places (artworks).

## Stack

- **Framework:** FastAPI
- **Database:** SQLite (configurable via `DATABASE_URL`)
- **Third-party:** Art Institute of Chicago API for place/artwork validation

## Project structure

```
app/
  main.py         # App, lifespan, CORS, routers
  config.py       # Settings from env
  database.py     # Engine, session, get_db
  models.py       # Project, Place
  schemas.py      # Pydantic request/response
  crud.py         # DB operations
  api/            # deps.py, projects.py, places.py
  services/       # art_institute.py (validate places)
```

## Setup

### Local (no Docker)

1. **Create a virtualenv and install dependencies**

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Optional:** Create a `.env` file to override defaults:

   ```env
   DATABASE_URL=sqlite:///./travel.db
   ART_INSTITUTE_API_BASE=https://api.artic.edu/api/v1
   MAX_PLACES_PER_PROJECT=10
   ```

3. **Run the server**

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   - API: http://localhost:8000  
   - Swagger UI: http://localhost:8000/docs  
   - ReDoc: http://localhost:8000/redoc  

### Docker

From the **repository root** (parent of `backend`):

```bash
docker compose up --build
```

API will be at http://localhost:8000. Database file is persisted in a Docker volume.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./travel.db` | SQLAlchemy database URL |
| `ART_INSTITUTE_API_BASE` | `https://api.artic.edu/api/v1` | Art Institute API base URL |
| `MAX_PLACES_PER_PROJECT` | `10` | Max places per project |

## API overview

- **Travel Projects**
  - `POST /projects/` — Create project (optional body: `places[]` with `external_id` from Art Institute API)
  - `GET /projects/` — List projects
  - `GET /projects/{project_id}` — Get one project
  - `PUT /projects/{project_id}` — Update project (name, description, start_date)
  - `DELETE /projects/{project_id}` — Delete project (forbidden if any place is visited)

- **Project Places**
  - `POST /projects/{project_id}/places` — Add place (validated against Art Institute API)
  - `GET /projects/{project_id}/places` — List places for a project
  - `GET /projects/{project_id}/places/{place_id}` — Get one place
  - `PUT /projects/{project_id}/places/{place_id}` — Update notes or mark as visited

- **General**
  - `GET /health` — Health check

Validation rules:

- Max 10 places per project.
- Place `external_id` must exist in the Art Institute API.
- Same `external_id` cannot be added twice to the same project.
- Project cannot be deleted if any of its places are marked as visited. When all places are visited, the project is marked completed.

## API documentation and Postman

- **OpenAPI (Swagger):** http://localhost:8000/docs  
- **Postman collection:** See [postman/Travel-Planner-API.postman_collection.json](postman/Travel-Planner-API.postman_collection.json). Import it in Postman to run all endpoints and example flows.

## Example requests

**Create project with places (Art Institute artwork IDs):**

```bash
curl -X POST http://localhost:8000/projects/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Chicago Trip", "description": "Museums", "places": [{"external_id": 27992}, {"external_id": 16568}]}'
```

**Add place to existing project:**

```bash
curl -X POST http://localhost:8000/projects/1/places/ \
  -H "Content-Type: application/json" \
  -d '{"external_id": 27992, "notes": "Must see"}'
```

**Mark place as visited:**

```bash
curl -X PUT http://localhost:8000/projects/1/places/1 \
  -H "Content-Type: application/json" \
  -d '{"visited": true}'
```
