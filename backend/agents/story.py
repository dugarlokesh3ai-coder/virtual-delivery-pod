import json
from typing import Any, Dict

from agents._common import _chat_json, _safe_dict


FALLBACK_STORY_PROMPT = """
You are a senior ServiceNow BSA/product owner.
Create delivery-ready epics and user stories from the requirement and architecture.
Acceptance criteria must be testable.
Do not invent integrations or requirements not present in the input.
Return only valid JSON.
"""


def _fallback_stories() -> Dict[str, Any]:
    return {
        "epic": "Story generation unavailable.",
        "stories": [],
        "assumptions": [
            "Story agent failed or returned invalid JSON."
        ],
        "dependencies": [
            "Review architecture and requirement manually before build."
        ],
    }


def generate_stories(requirement: str, architecture: dict) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Return JSON exactly in this structure:
{{
  "epic": "Epic statement",
  "stories": [
    {{
      "title": "Story title",
      "persona": "User persona",
      "story": "As a..., I want..., so that...",
      "acceptance_criteria": [
        "Given/When/Then acceptance criterion"
      ],
      "priority": "High / Medium / Low",
      "notes": "Implementation or scope notes"
    }}
  ],
  "assumptions": [
    "Assumption 1"
  ],
  "dependencies": [
    "Dependency 1"
  ]
}}
"""

    output = _chat_json(
        prompt_name="story.txt",
        fallback_prompt=FALLBACK_STORY_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_stories(),
        temperature=0.15,
    )

    output = _safe_dict(output)
    fallback = _fallback_stories()

    return {
        "epic": output.get("epic") or fallback["epic"],
        "stories": output.get("stories") if isinstance(output.get("stories"), list) else [],
        "assumptions": output.get("assumptions") if isinstance(output.get("assumptions"), list) else fallback["assumptions"],
        "dependencies": output.get("dependencies") if isinstance(output.get("dependencies"), list) else fallback["dependencies"],
    }
