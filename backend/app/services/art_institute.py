"""Validate places against Art Institute of Chicago API."""

import requests
from functools import lru_cache

from app.config import get_settings


def _place_exists(external_id: int) -> bool:
    settings = get_settings()
    url = f"{settings.art_institute_api_base.rstrip('/')}/artworks/{external_id}"
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        return r.json().get("data") is not None
    except (requests.RequestException, KeyError):
        return False


@lru_cache(maxsize=512)
def validate_place_cached(external_id: int) -> bool:
    """Return True if artwork exists in Art Institute API (cached)."""
    return _place_exists(external_id)
