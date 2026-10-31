import re
from pydantic import BaseModel, EmailStr, Field, field_validator

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    purpose: str = Field(min_length=1, max_length=80)
    # Kept for any older client that still sends these; no longer collected
    # by the registration form, so both are optional and unused going forward.
    phone: str | None = Field(default=None, max_length=30)
    region: str | None = Field(default=None, max_length=80)
    role: str = Field(default='user', max_length=20)

    @field_validator('role')
    @classmethod
    def _check_role(cls, v):
        if v != 'user':
            raise ValueError('Only normal User registration is allowed. Admin accounts are created by the project administrator.')
        return v

    @field_validator('password')
    @classmethod
    def _strong_password(cls, v):
        problems = []
        if len(v) < 8: problems.append('at least 8 characters')
        if not re.search(r'[A-Z]', v): problems.append('one uppercase letter')
        if not re.search(r'[a-z]', v): problems.append('one lowercase letter')
        if not re.search(r'[^A-Za-z0-9\s]', v): problems.append('one special character')
        if problems:
            raise ValueError('Password needs ' + ', '.join(problems))
        return v

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r'^\d{6}$')
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator('new_password')
    @classmethod
    def _strong_password(cls, v):
        problems = []
        if len(v) < 8: problems.append('at least 8 characters')
        if not re.search(r'[A-Z]', v): problems.append('one uppercase letter')
        if not re.search(r'[a-z]', v): problems.append('one lowercase letter')
        if not re.search(r'[^A-Za-z0-9\s]', v): problems.append('one special character')
        if problems:
            raise ValueError('Password needs ' + ', '.join(problems))
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RecommendationRequest(BaseModel):
    soil_ph: float = Field(ge=0, le=14)
    rainfall_mm: float = Field(ge=0, le=10000)
    temperature_c: float = Field(ge=-50, le=70)
    soil_type: str
    N: float = Field(ge=0, le=1000)
    P: float = Field(ge=0, le=1000)
    K: float = Field(ge=0, le=1000)
    # Where the person is actually going to plant. Filters the candidate
    # species BEFORE ranking, so e.g. a terrace-gardening request never
    # surfaces Coconut/Teak/Neem regardless of how well their soil/climate
    # numbers happen to match. Optional so old clients don't break; when
    # omitted, no space-based filtering is applied (matches old behaviour).
    planting_space: str | None = Field(
        default=None,
        description="One of: terrace_container, small_backyard, open_farm"
    )

    @field_validator('planting_space')
    @classmethod
    def _check_space(cls, v):
        if v is None:
            return v
        allowed = {'terrace_container', 'small_backyard', 'open_farm'}
        if v not in allowed:
            raise ValueError(f"planting_space must be one of {sorted(allowed)}")
        return v

class PlantationRequest(BaseModel):
    length_m: float = Field(gt=0, le=100000)
    width_m: float = Field(gt=0, le=100000)
    tree_spacing_m: float = Field(gt=0, le=100)
    row_spacing_m: float = Field(gt=0, le=100)
    boundary_gap_m: float = Field(ge=0, le=100)
    # A real plot is rarely a single species monoculture, so this takes a
    # list. A single species is just a list of length 1 -- backward
    # compatible with a client that only ever picks one. The land is split
    # into contiguous row-bands across the given species, sized either
    # evenly or by the optional matching ratios.
    species: list[str] = Field(min_length=1, max_length=8)
    # Optional relative proportions, same length/order as `species`, e.g.
    # [2, 1] to give the first species roughly twice the rows of the
    # second. Omit for an even split across all selected species.
    ratios: list[float] | None = Field(default=None, max_length=8)

    @field_validator('species')
    @classmethod
    def _dedupe_species(cls, v):
        if len(set(v)) != len(v):
            raise ValueError("species list contains duplicates")
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
