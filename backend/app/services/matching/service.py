"""
Matching service — orchestrates the deterministic matching engine and
persists results to the database.
"""
from sqlalchemy.orm import Session

from app.models.matching import Matching
from app.models.user import User, UserRole
from app.schemas.matching import MatchResponse, MatchCandidate
from app.schemas.user import UserOut
from app.services.matching.engine import find_top_mentors
from app.utils.exceptions import NotFoundException, BadRequestException


class MatchingService:
    def __init__(self, db: Session):
        self.db = db

    def match_mentee(self, mentee_id: str, top_n: int = 3) -> MatchResponse:
        mentee = self.db.get(User, mentee_id)
        if not mentee:
            raise NotFoundException("Mentee not found")
        if mentee.role not in (UserRole.MENTEE,):
            raise BadRequestException("Only users with role 'mentee' can be matched to mentors")

        results = find_top_mentors(self.db, mentee, top_n=top_n)

        # Persist each computed match for auditing / history purposes.
        for result in results:
            record = Matching(
                mentor_id=result.mentor.id,
                mentee_id=mentee.id,
                score=result.score,
                explanation=result.explanation,
            )
            self.db.add(record)
        self.db.commit()

        candidates = [
            MatchCandidate(
                mentor=UserOut.model_validate(r.mentor),
                score=r.score,
                explanation=r.explanation,
            )
            for r in results
        ]
        return MatchResponse(mentee_id=mentee_id, top_matches=candidates)

    def history_for_user(self, user_id: str) -> list[Matching]:
        return (
            self.db.query(Matching)
            .filter((Matching.mentee_id == user_id) | (Matching.mentor_id == user_id))
            .order_by(Matching.created_at.desc())
            .all()
        )
