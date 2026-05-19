import json
from typing import Any, Dict, List

from agents._common import _chat_json, _safe_dict


FALLBACK_STORY_PROMPT = """
You are a senior ServiceNow BSA/product owner.
Create delivery-ready epics and user stories from the requirement and architecture.
Group stories by delivery epic and include stable story IDs.
Acceptance criteria must be testable.
Do not invent integrations or requirements not present in the input.
Return only valid JSON.
"""


def _fallback_stories() -> Dict[str, Any]:
    return {
        "epic": "Story generation unavailable.",
        "story_groups": [],
        "stories": [],
        "assumptions": [
            "Story agent failed or returned invalid JSON."
        ],
        "dependencies": [
            "Review architecture and requirement manually before build."
        ],
    }


def _safe_list(value: Any) -> List[Any]:
    return value if isinstance(value, list) else []


def _flatten_story_groups(story_groups: List[Any]) -> List[Dict[str, Any]]:
    flattened: List[Dict[str, Any]] = []

    for group in story_groups:
        if not isinstance(group, dict):
            continue

        epic_name = group.get("epic_name") or group.get("name") or group.get("epic") or "General Delivery"
        for story in _safe_list(group.get("stories")):
            if not isinstance(story, dict):
                continue
            normalized = dict(story)
            normalized.setdefault("epic", epic_name)
            flattened.append(normalized)

    return flattened


def generate_stories(requirement: str, architecture: dict) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Create story_groups first, then include a flattened stories array using the exact same story objects.

Return JSON exactly in this structure:
{{
  "epic": "Overall epic title and summary.",
  "story_groups": [
    {{
      "epic_name": "Workflow / Routing / Approvals",
      "epic_summary": "What this epic delivers.",
      "stories": [
        {{
          "story_id": "WF-001",
          "epic": "Workflow / Routing / Approvals",
          "title": "Story title",
          "persona": "Requester / Approver / Admin / Fulfillment user / Reviewer / Other",
          "story": "As a..., I want..., so that...",
          "acceptance_criteria": [
            "Given/When/Then acceptance criterion"
          ],
          "priority": "Must Have / Should Have / Could Have",
          "implementation_type": "OOB Configuration / Flow Designer / UI Policy / Business Rule / ACL / Report / Script / Custom Table / Integration",
          "related_service_now_objects": [
            "Object name"
          ],
          "developer_notes_needed": [
            "Developer note needed"
          ],
          "qa_focus": [
            "QA focus area"
          ],
          "dependencies": [
            "Dependency"
          ],
          "build_sequence": "Sprint 1 / Sprint 2 / Sprint 3 / Later",
          "notes": "Implementation or scope notes"
        }}
      ]
    }}
  ],
  "stories": [
    {{
      "story_id": "WF-001",
      "epic": "Workflow / Routing / Approvals",
      "title": "Story title",
      "persona": "User persona",
      "story": "As a..., I want..., so that...",
      "acceptance_criteria": [
        "Given/When/Then acceptance criterion"
      ],
      "priority": "Must Have / Should Have / Could Have",
      "implementation_type": "OOB Configuration / Flow Designer / UI Policy / Business Rule / ACL / Report / Script / Custom Table / Integration",
      "related_service_now_objects": [
        "Object name"
      ],
      "developer_notes_needed": [
        "Developer note needed"
      ],
      "qa_focus": [
        "QA focus area"
      ],
      "dependencies": [
        "Dependency"
      ],
      "build_sequence": "Sprint 1 / Sprint 2 / Sprint 3 / Later",
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

    story_groups = _safe_list(output.get("story_groups"))
    stories = _safe_list(output.get("stories"))

    if story_groups and not stories:
        stories = _flatten_story_groups(story_groups)

    return {
        "epic": output.get("epic") or fallback["epic"],
        "story_groups": story_groups,
        "stories": stories,
        "assumptions": _safe_list(output.get("assumptions")) or fallback["assumptions"],
        "dependencies": _safe_list(output.get("dependencies")) or fallback["dependencies"],
    }
