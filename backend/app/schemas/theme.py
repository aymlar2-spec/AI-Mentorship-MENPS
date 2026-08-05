"""
Pydantic schemas for Theme.
"""
from pydantic import BaseModel, ConfigDict


class ThemeBase(BaseModel):
    name: str


class ThemeCreate(ThemeBase):
    pass


class ThemeOut(ThemeBase):
    model_config = ConfigDict(from_attributes=True)
    id: str


class AssignThemesRequest(BaseModel):
    theme_ids: list[str]
