"""Places API."""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_project, get_place_in_project
from app.models import Project, Place
from app.schemas import PlaceCreate, PlaceUpdate, PlaceOut
from app.crud import add_place_to_project, list_places_for_project, update_place
from app.services.art_institute import validate_place_cached

router = APIRouter(prefix="/projects", tags=["Places"])


@router.post("/{project_id}/places", response_model=PlaceOut, status_code=201)
def add_place(
    project: Project = Depends(get_project),
    place: PlaceCreate = Body(...),
    db: Session = Depends(get_db),
):
    if not validate_place_cached(place.external_id):
        raise HTTPException(status_code=400, detail="Place not found in Art Institute API")
    try:
        return add_place_to_project(db, project.id, place)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{project_id}/places", response_model=list[PlaceOut])
def list_places(project: Project = Depends(get_project), db: Session = Depends(get_db)):
    return list_places_for_project(db, project.id)


@router.get("/{project_id}/places/{place_id}", response_model=PlaceOut)
def get_place(place: Place = Depends(get_place_in_project)):
    return place


@router.put("/{project_id}/places/{place_id}", response_model=PlaceOut)
def update_place_route(
    place: Place = Depends(get_place_in_project),
    db: Session = Depends(get_db),
    payload: PlaceUpdate = Body(...),
):
    updated = update_place(db, place.id, payload)
    return updated
