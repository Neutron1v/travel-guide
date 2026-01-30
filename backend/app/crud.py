"""DB operations for projects and places."""

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Project, Place
from app.schemas import ProjectCreate, ProjectUpdate, PlaceCreate, PlaceUpdate


def create_project_with_places(db: Session, payload: ProjectCreate) -> Project:
    settings = get_settings()
    if len(payload.places or []) > settings.max_places_per_project:
        raise ValueError(f"Max {settings.max_places_per_project} places per project")

    project = Project(name=payload.name, description=payload.description, start_date=payload.start_date)
    db.add(project)
    db.flush()
    seen = set()
    for p in payload.places or []:
        if p.external_id in seen:
            continue
        seen.add(p.external_id)
        db.add(Place(external_id=p.external_id, notes=p.notes, project_id=project.id))
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session):
    return db.query(Project).order_by(Project.id).all()


def get_project_by_id(db: Session, project_id: int) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()


def update_project(db: Session, project_id: int, payload: ProjectUpdate) -> Project | None:
    project = get_project_by_id(db, project_id)
    if not project:
        return None
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    if payload.start_date is not None:
        project.start_date = payload.start_date
    db.commit()
    db.refresh(project)
    return project


def delete_project_if_no_visited(db: Session, project_id: int) -> bool:
    project = get_project_by_id(db, project_id)
    if not project:
        return False
    if any(p.visited for p in project.places):
        raise ValueError("Cannot delete project with visited places")
    db.delete(project)
    db.commit()
    return True


def add_place_to_project(db: Session, project_id: int, payload: PlaceCreate) -> Place:
    project = get_project_by_id(db, project_id)
    if not project:
        return None
    settings = get_settings()
    if len(project.places) >= settings.max_places_per_project:
        raise ValueError(f"Max {settings.max_places_per_project} places per project")
    if any(p.external_id == payload.external_id for p in project.places):
        raise ValueError("Place already in project")
    place = Place(external_id=payload.external_id, notes=payload.notes, project_id=project_id)
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


def list_places_for_project(db: Session, project_id: int):
    return db.query(Place).filter(Place.project_id == project_id).order_by(Place.id).all()


def get_place_by_id(db: Session, place_id: int) -> Place | None:
    return db.query(Place).filter(Place.id == place_id).first()


def update_place(db: Session, place_id: int, payload: PlaceUpdate) -> Place | None:
    place = get_place_by_id(db, place_id)
    if not place:
        return None
    if payload.notes is not None:
        place.notes = payload.notes
    if payload.visited is not None:
        place.visited = payload.visited
        if payload.visited and all(p.visited for p in place.project.places):
            place.project.completed = True
    db.commit()
    db.refresh(place)
    return place
