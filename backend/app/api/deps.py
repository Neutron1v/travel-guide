"""API dependencies."""

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project, Place
from app.crud import get_project_by_id, get_place_by_id


def get_project(project_id: int, db: Session = Depends(get_db)) -> Project:
    project = get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def get_place_in_project(project_id: int, place_id: int, db: Session = Depends(get_db)) -> Place:
    place = get_place_by_id(db, place_id)
    if not place or place.project_id != project_id:
        raise HTTPException(status_code=404, detail="Place not found")
    return place
