"""Pydantic schemas."""

from datetime import date
from typing import Optional, List

from pydantic import BaseModel


class PlaceCreate(BaseModel):
    external_id: int
    notes: Optional[str] = None


class PlaceUpdate(BaseModel):
    notes: Optional[str] = None
    visited: Optional[bool] = None


class PlaceOut(BaseModel):
    id: int
    external_id: int
    notes: Optional[str]
    visited: bool

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    places: Optional[List[PlaceCreate]] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    start_date: Optional[date]
    completed: bool
    places: List[PlaceOut] = []

    model_config = {"from_attributes": True}
