"""
Profile service — manages mentee/mentor profiles and their theme tags.
"""
from sqlalchemy.orm import Session, joinedload

from app.models.profile import Profile
from app.models.theme import Theme, ProfileTheme
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileOut
from app.schemas.theme import ThemeOut
from app.utils.exceptions import NotFoundException, ConflictException, BadRequestException


class ProfileService:
    def __init__(self, db: Session):
        self.db = db

    # ---- internal helpers -------------------------------------------------

    def _get_profile_by_user(self, user_id: str) -> Profile:
        profile = (
            self.db.query(Profile)
            .options(joinedload(Profile.profile_themes).joinedload(ProfileTheme.theme))
            .filter(Profile.user_id == user_id)
            .first()
        )
        if not profile:
            raise NotFoundException("Profile not found for this user")
        return profile

    @staticmethod
    def _to_out(profile: Profile) -> ProfileOut:
        themes = [
            ThemeOut.model_validate(pt.theme) for pt in profile.profile_themes if pt.theme is not None
        ]
        return ProfileOut(
            id=profile.id,
            user_id=profile.user_id,
            current_position=profile.current_position,
            entity=profile.entity,
            phone=profile.phone,
            whatsapp=profile.whatsapp,
            mentoring_role=profile.mentoring_role,
            engagement_type=profile.engagement_type,
            previous_mentoring_experience=profile.previous_mentoring_experience,
            motivations=profile.motivations,
            contributions=profile.contributions,
            active_engagement=profile.active_engagement,
            themes=themes,
        )

    def _assign_themes(self, profile: Profile, theme_ids: list[str]) -> None:
        # Clear existing assignments then re-create; simplest consistent behavior.
        self.db.query(ProfileTheme).filter(ProfileTheme.profile_id == profile.id).delete()
        for theme_id in theme_ids:
            theme = self.db.get(Theme, theme_id)
            if not theme:
                raise BadRequestException(f"Theme '{theme_id}' does not exist")
            self.db.add(ProfileTheme(profile_id=profile.id, theme_id=theme_id))
        self.db.flush()

    # ---- public API ---------------------------------------------------

    def create_profile(self, user_id: str, payload: ProfileCreate) -> ProfileOut:
        existing = self.db.query(Profile).filter(Profile.user_id == user_id).first()
        if existing:
            raise ConflictException("Profile already exists for this user")

        data = payload.model_dump(exclude={"theme_ids"})
        profile = Profile(user_id=user_id, **data)
        self.db.add(profile)
        self.db.flush()  # get profile.id without committing yet

        if payload.theme_ids:
            self._assign_themes(profile, payload.theme_ids)

        self.db.commit()
        profile = self._get_profile_by_user(user_id)
        return self._to_out(profile)

    def get_profile(self, user_id: str) -> ProfileOut:
        profile = self._get_profile_by_user(user_id)
        return self._to_out(profile)

    def update_profile(self, user_id: str, payload: ProfileUpdate) -> ProfileOut:
        profile = self._get_profile_by_user(user_id)
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(profile, field, value)
        self.db.commit()
        profile = self._get_profile_by_user(user_id)
        return self._to_out(profile)

    def delete_profile(self, user_id: str) -> None:
        profile = self._get_profile_by_user(user_id)
        self.db.delete(profile)
        self.db.commit()

    def assign_themes(self, user_id: str, theme_ids: list[str]) -> ProfileOut:
        profile = self._get_profile_by_user(user_id)
        self._assign_themes(profile, theme_ids)
        self.db.commit()
        profile = self._get_profile_by_user(user_id)
        return self._to_out(profile)
