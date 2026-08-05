"""
AI service — orchestrates Gemini calls for coaching-related use cases.

Per project requirements, the AI NEVER computes mentor-mentee matching. It
only assists with coaching, SMART goals, summaries, action plans, matching
EXPLANATIONS (of an already-computed match), Q&A and need reformulation.
"""
from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.models.user import User
from app.services.ai import prompts
from app.services.ai.gemini_client import GeminiClient
from app.services.conversation_service import ConversationService
from app.utils.exceptions import NotFoundException


class AIService:
    def __init__(self, db: Session, client: GeminiClient | None = None):
        self.db = db
        self.client = client or GeminiClient()
        self.conversations = ConversationService(db)

    # ---- internal helpers -------------------------------------------------

    def _profile_context(self, user: User) -> str:
        profile = self.db.query(Profile).filter(Profile.user_id == user.id).first()
        return prompts.build_profile_context(user, profile)

    def _run(self, user: User, conversation_id: str | None, user_prompt: str) -> tuple[str, list]:
        """Send a prompt to Gemini, storing both sides in conversation history."""
        conversation = self.conversations.get_or_create(user, conversation_id)
        self.conversations.add_message(conversation, role="user", content=user_prompt)

        system_instruction = prompts.coaching_system_instruction(self._profile_context(user))
        reply_text = self.client.generate(system_instruction, user_prompt)

        self.conversations.add_message(conversation, role="assistant", content=reply_text)
        messages = self.conversations.list_messages(conversation.id)
        return reply_text, messages, conversation.id  # type: ignore[return-value]

    # ---- public use cases ---------------------------------------------

    def chat(self, user: User, conversation_id: str | None, message: str) -> tuple[str, str, list]:
        reply, messages, conv_id = self._run(user, conversation_id, prompts.free_chat_prompt(message))
        return reply, conv_id, messages

    def generate_smart_goals(self, user: User, conversation_id: str | None, objective: str):
        prompt = prompts.smart_goals_prompt(objective)
        reply, messages, conv_id = self._run(user, conversation_id, prompt)
        return reply, conv_id, messages

    def summarize_session(self, user: User, conversation_id: str | None, session_notes: str):
        prompt = prompts.session_summary_prompt(session_notes)
        reply, messages, conv_id = self._run(user, conversation_id, prompt)
        return reply, conv_id, messages

    def suggest_action_plan(self, user: User, conversation_id: str | None, goal: str):
        prompt = prompts.action_plan_prompt(goal)
        reply, messages, conv_id = self._run(user, conversation_id, prompt)
        return reply, conv_id, messages

    def explain_match(self, user: User, conversation_id: str | None, mentor_id: str):
        mentor = self.db.get(User, mentor_id)
        if not mentor:
            raise NotFoundException("Mentor not found")

        from app.models.matching import Matching  # local import avoids circularity at module load

        latest = (
            self.db.query(Matching)
            .filter(Matching.mentor_id == mentor_id, Matching.mentee_id == user.id)
            .order_by(Matching.created_at.desc())
            .first()
        )
        score = latest.score if latest else 0.0
        explanation = latest.explanation if latest else "No prior computed match found."

        prompt = prompts.explain_match_prompt(mentor.full_name, score, explanation)
        reply, messages, conv_id = self._run(user, conversation_id, prompt)
        return reply, conv_id, messages

    def reformulate_need(self, user: User, conversation_id: str | None, text: str):
        prompt = prompts.reformulate_prompt(text)
        reply, messages, conv_id = self._run(user, conversation_id, prompt)
        return reply, conv_id, messages
