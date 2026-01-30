"""App config from environment."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Travel Planner API"
    database_url: str = "sqlite:///./travel.db"
    art_institute_api_base: str = "https://api.artic.edu/api/v1"
    max_places_per_project: int = 10

    model_config = {"env_file": ".env"}


def get_settings():
    return Settings()
