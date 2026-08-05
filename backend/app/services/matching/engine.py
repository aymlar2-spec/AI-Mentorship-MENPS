"""
Deterministic Matching Engine.

IMPORTANT: This module NEVER calls the AI/Gemini API. Matching scores are
computed purely from structured profile data so that results are
reproducible, explainable and auditable.

Scoring breakdown (weights sum to 1.0):
    - Common themes (skills vs needs overlap)....... 0.40
    - Mentoring experience compatibility............. 0.20
    - Availability / engagement type match........... 0.20
    - Organization / entity relationship............. 0.20

The engine returns the Top N mentors for a given mentee, each with a
0-100 compatibility score and a human-readable explanation.
"""
from dataclasses import dataclass

from sqlalchemy.orm import Session, joinedload

from app.models.profile import Profile
from app.models.theme import ProfileTheme
from app.models.user import User, UserRole

# Weights for each scoring component. Kept as module-level constants so they
# are easy to tune without touching the algorithm's logic.
WEIGHT_COMMON_THEMES = 0.40
WEIGHT_MENTORING_EXPERIENCE = 0.20
WEIGHT_AVAILABILITY = 0.20
WEIGHT_ENTITY = 0.20


@dataclass
class MatchResult:
    mentor: User
    score: float
    explanation: str


def _theme_ids(profile: Profile) -> set[str]:
    return {pt.theme_id for pt in profile.profile_themes}


def _theme_names(profile: Profile) -> list[str]:
    return [pt.theme.name for pt in profile.profile_themes if pt.theme is not None]


def _score_common_themes(mentee_profile: Profile, mentor_profile: Profile) -> tuple[float, str]:
    """
    Score based on overlap between mentee's needs (themes) and mentor's
    skills/interests (themes). Uses a Jaccard-like ratio over the mentee's
    theme set so the score reflects how well the mentor covers what the
    mentee is looking for.
    """
    mentee_themes = _theme_ids(mentee_profile)
    mentor_themes = _theme_ids(mentor_profile)

    if not mentee_themes:
        return 0.0, "No themes defined on mentee profile"

    common = mentee_themes & mentor_themes
    ratio = len(common) / len(mentee_themes)

    common_names = [
        pt.theme.name
        for pt in mentor_profile.profile_themes
        if pt.theme_id in common and pt.theme is not None
    ]
    if common_names:
        explanation = f"Shares {len(common_names)} common theme(s): {', '.join(common_names)}"
    else:
        explanation = "No shared themes with mentee"

    return ratio, explanation


def _score_mentoring_experience(mentor_profile: Profile) -> tuple[float, str]:
    """Mentors with prior mentoring experience score higher."""
    if mentor_profile.previous_mentoring_experience:
        return 1.0, "Mentor has previous mentoring experience"
    return 0.4, "Mentor has no previous mentoring experience"


def _score_availability(mentee_profile: Profile, mentor_profile: Profile) -> tuple[float, str]:
    """
    Compares engagement type (remote / in_person / hybrid) and whether the
    mentor is actively engaged in the program.
    """
    if not mentor_profile.active_engagement:
        return 0.0, "Mentor is not currently active in the program"

    if mentee_profile.engagement_type == mentor_profile.engagement_type:
        return 1.0, f"Matching engagement preference: {mentor_profile.engagement_type.value}"

    # Hybrid mentors/mentees are compatible with either remote or in-person.
    if "hybrid" in (mentee_profile.engagement_type.value, mentor_profile.engagement_type.value):
        return 0.7, "Compatible engagement type (hybrid flexibility)"

    return 0.3, "Different engagement type preferences"


def _score_entity(mentee_profile: Profile, mentor_profile: Profile) -> tuple[float, str]:
    """
    Organizations differ in philosophy: some programs prefer mentors from a
    DIFFERENT entity than the mentee (broader perspective / no conflict of
    interest), which is the default assumption here. Same-entity pairs still
    receive a moderate score since logistics (in-person meetups) can be
    easier.
    """
    mentee_entity = (mentee_profile.entity or "").strip().lower()
    mentor_entity = (mentor_profile.entity or "").strip().lower()

    if not mentee_entity or not mentor_entity:
        return 0.5, "Entity information incomplete for one profile"

    if mentee_entity == mentor_entity:
        return 0.6, f"Same organization/entity: {mentor_profile.entity}"

    return 1.0, "Different organization/entity — broader perspective"


def compute_match_score(mentee_profile: Profile, mentor_profile: Profile) -> MatchResult:
    """Compute a single mentor's compatibility score against a mentee."""
    theme_score, theme_expl = _score_common_themes(mentee_profile, mentor_profile)
    experience_score, experience_expl = _score_mentoring_experience(mentor_profile)
    availability_score, availability_expl = _score_availability(mentee_profile, mentor_profile)
    entity_score, entity_expl = _score_entity(mentee_profile, mentor_profile)

    weighted_total = (
        theme_score * WEIGHT_COMMON_THEMES
        + experience_score * WEIGHT_MENTORING_EXPERIENCE
        + availability_score * WEIGHT_AVAILABILITY
        + entity_score * WEIGHT_ENTITY
    )
    score_percent = round(weighted_total * 100, 2)

    explanation = " | ".join([theme_expl, experience_expl, availability_expl, entity_expl])

    return MatchResult(mentor=mentor_profile.user, score=score_percent, explanation=explanation)


def find_top_mentors(db: Session, mentee: User, top_n: int = 3) -> list[MatchResult]:
    """
    Compute and return the top N mentor matches for a given mentee.

    Requires the mentee to have a completed profile. Only users with role
    MENTOR and an active engagement flag are considered as candidates.
    """
    mentee_profile = (
        db.query(Profile)
        .options(joinedload(Profile.profile_themes).joinedload(ProfileTheme.theme))
        .filter(Profile.user_id == mentee.id)
        .first()
    )
    if mentee_profile is None:
        return []

    mentor_profiles = (
        db.query(Profile)
        .join(User, Profile.user_id == User.id)
        .options(joinedload(Profile.profile_themes).joinedload(ProfileTheme.theme))
        .filter(User.role == UserRole.MENTOR, User.is_active.is_(True))
        .filter(Profile.user_id != mentee.id)
        .all()
    )

    results = [compute_match_score(mentee_profile, mp) for mp in mentor_profiles]
    results.sort(key=lambda r: r.score, reverse=True)

    return results[:top_n]
