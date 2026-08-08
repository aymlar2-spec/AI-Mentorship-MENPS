"""
Prompt templates for the AI mentoring assistant.

Centralizing prompts here makes them easy to review, version, and tune
without touching business logic.
"""
from app.models.profile import Profile
from app.models.user import User


def build_profile_context(user: User, profile: Profile | None) -> str:
    """Serialize a user's profile into a compact text block used as AI context."""
    if profile is None:
        return f"User: {user.full_name} ({user.role.value}). No detailed profile available yet."

    themes = ", ".join(pt.theme.name for pt in profile.profile_themes if pt.theme) or "None specified"

    return (
        f"User: {user.full_name}\n"
        f"Role in program: {profile.mentoring_role.value}\n"
        f"Current position: {profile.current_position or 'N/A'}\n"
        f"Organization/entity: {profile.entity or 'N/A'}\n"
        f"Engagement type: {profile.engagement_type.value}\n"
        f"Previous mentoring experience: {'Yes' if profile.previous_mentoring_experience else 'No'}\n"
        f"Motivations: {profile.motivations or 'N/A'}\n"
        f"Contributions/skills offered: {profile.contributions or 'N/A'}\n"
        f"Themes of interest: {themes}\n"
    )


BASE_SYSTEM_INSTRUCTION = (
    "You are an empathetic, professional AI mentoring coach embedded in the "
    "MENPS platform, an AI Mentorship Platform for Women. You support mentors "
    "and mentees with coaching, goal-setting and reflection. You are NOT "
    "responsible for computing mentor-mentee matches — that is handled by a "
    "separate deterministic algorithm. Always be encouraging, concise, and "
    "practical. Ground your answers in the user's profile context when given."
)


def coaching_system_instruction(profile_context: str) -> str:
    return f"{BASE_SYSTEM_INSTRUCTION}\n\nUser profile context:\n{profile_context}"


def smart_goals_prompt(objective: str) -> str:
    return (
        "Help the user turn the following objective into a set of SMART goals "
        "(Specific, Measurable, Achievable, Relevant, Time-bound). Present the "
        f"goals as a short numbered list.\n\nObjective: {objective}"
    )


def session_summary_prompt(session_notes: str) -> str:
    return (
        "Summarize the following mentoring session notes into a concise summary "
        "with: 1) Key discussion points, 2) Decisions made, 3) Next steps.\n\n"
        f"Session notes:\n{session_notes}"
    )


def action_plan_prompt(goal: str) -> str:
    return (
        "Suggest a practical, step-by-step action plan to help the user achieve "
        f"the following goal. Keep it realistic and actionable.\n\nGoal: {goal}"
    )


def explain_match_prompt(mentor_name: str, score: float, explanation: str) -> str:
    return (
        "A deterministic matching algorithm (not you) computed the following "
        "mentor recommendation. Explain in warm, plain language WHY this could "
        "be a good match for the user, based on the algorithm's output. Do not "
        "invent new reasons beyond what is given.\n\n"
        f"Recommended mentor: {mentor_name}\n"
        f"Compatibility score: {score}/100\n"
        f"Algorithm explanation: {explanation}"
    )


def reformulate_prompt(text: str) -> str:
    return (
        "Reformulate the following need or question expressed by the user into "
        "a clearer, more actionable statement, preserving their original intent."
        f"\n\nOriginal text: {text}"
    )


def free_chat_prompt(message: str) -> str:
    return message
