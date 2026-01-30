"""Projects API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_project
from app.models import Project
from app.schemas import ProjectCreate, ProjectUpdate, ProjectOut
from app.crud import (
    create_project_with_places,
    list_projects,
    update_project,
    delete_project_if_no_visited,
)
from app.services.art_institute import validate_place_cached

router = APIRouter(prefix="/projects", tags=["Projects"])


def _validate_places(places):
    seen = set()
    for p in places or []:
        if p.external_id in seen:
            raise HTTPException(status_code=400, detail=f"Duplicate external_id {p.external_id}")
        seen.add(p.external_id)
        if not validate_place_cached(p.external_id):
            raise HTTPException(status_code=400, detail=f"Place {p.external_id} not found in Art Institute API")


@router.post("/", response_model=ProjectOut, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    _validate_places(payload.places)
    try:
        return create_project_with_places(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[ProjectOut])
def list_projects_route(db: Session = Depends(get_db)):
    return list_projects(db)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project_route(project: Project = Depends(get_project)):
    return project


@router.put("/{project_id}", response_model=ProjectOut)
def update_project_route(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    updated = update_project(db, project_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated


@router.delete("/{project_id}", status_code=204)
def delete_project_route(project_id: int, db: Session = Depends(get_db)):
    try:
        if not delete_project_if_no_visited(db, project_id):
            raise HTTPException(status_code=404, detail="Project not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
