import json
from typing import Any, Dict, List

from agents._common import _chat_json, _safe_dict


FALLBACK_STORY_PROMPT = """
You are a senior ServiceNow BSA/product owner.
Create delivery-ready epics and user stories from the requirement and architecture.
Group stories by delivery epic and connect them to developer and QA work.
Return only valid JSON.
"""

EPIC_PREFIXES = {
    "Architecture / Platform Decision": "ARCH",
    "Data Model / Tables / Fields": "DATA",
    "Forms / UX / Catalog Experience": "UX",
    "Workflow / Routing / Approvals": "WF",
    "Security / Roles / ACLs": "SEC",
    "Notifications / Communications": "NOTIF",
    "Reporting / Dashboards": "RPT",
    "Admin / Configuration": "ADMIN",
    "Integration / Data Migration": "INT",
    "Testing / Deployment / Cutover": "TEST",
    "Hypercare / Maintenance": "HC",
}


def _fallback_stories() -> Dict[str, Any]:
    return {
        "epic": "Story generation unavailable.",
        "story_groups": [],
        "stories": [],
        "technical_build_tasks": [],
        "assumptions": ["Story agent failed or returned invalid JSON."],
        "dependencies": ["Review architecture and requirement manually before build."],
    }


def _safe_list(value: Any) -> List[Any]:
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return [value]


def _safe_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def _infer_epic(story: Dict[str, Any]) -> str:
    raw = " ".join(
        [
            _safe_text(story.get("epic")),
            _safe_text(story.get("title")),
            _safe_text(story.get("story")),
            _safe_text(story.get("notes")),
            _safe_text(story.get("implementation_type")),
        ]
    ).lower()

    if any(token in raw for token in ["catalog", "form", "portal", "variable", "requester", "submit"]):
        return "Forms / UX / Catalog Experience"
    if any(token in raw for token in ["approval", "workflow", "flow", "route", "routing", "state", "task", "fulfillment"]):
        return "Workflow / Routing / Approvals"
    if any(token in raw for token in ["role", "acl", "security", "access", "visibility", "user criteria"]):
        return "Security / Roles / ACLs"
    if any(token in raw for token in ["notification", "email", "message", "reminder"]):
        return "Notifications / Communications"
    if any(token in raw for token in ["report", "dashboard", "metric", "kpi"]):
        return "Reporting / Dashboards"
    if any(token in raw for token in ["table", "field", "data", "choice", "mapping"]):
        return "Data Model / Tables / Fields"
    if any(token in raw for token in ["architecture", "platform", "oob", "module", "license"]):
        return "Architecture / Platform Decision"
    if any(token in raw for token in ["test", "uat", "sit", "deployment", "release", "cutover"]):
        return "Testing / Deployment / Cutover"
    return "Admin / Configuration"


def _normalize_story(story: Dict[str, Any], epic: str, index: int) -> Dict[str, Any]:
    prefix = EPIC_PREFIXES.get(epic, "GEN")
    story_id = _safe_text(story.get("story_id")) or f"{prefix}-{index + 1:03d}"
    title = _safe_text(story.get("title")) or "Untitled story"

    return {
        "story_id": story_id,
        "epic": epic,
        "story_type": _safe_text(story.get("story_type")) or "Business Story",
        "title": title,
        "persona": _safe_text(story.get("persona")) or "Other",
        "story": _safe_text(story.get("story")) or title,
        "acceptance_criteria": [
            _safe_text(item) for item in _safe_list(story.get("acceptance_criteria")) if _safe_text(item)
        ],
        "priority": _safe_text(story.get("priority")) or "Must Have",
        "implementation_type": _safe_text(story.get("implementation_type")) or "OOB Configuration",
        "related_service_now_objects": [
            _safe_text(item) for item in _safe_list(story.get("related_service_now_objects")) if _safe_text(item)
        ],
        "developer_notes_needed": [
            _safe_text(item) for item in _safe_list(story.get("developer_notes_needed")) if _safe_text(item)
        ],
        "qa_focus": [
            _safe_text(item) for item in _safe_list(story.get("qa_focus")) if _safe_text(item)
        ],
        "dependencies": [
            _safe_text(item) for item in _safe_list(story.get("dependencies")) if _safe_text(item)
        ],
        "build_sequence": _safe_text(story.get("build_sequence")) or "Sprint 1",
        "notes": _safe_text(story.get("notes")),
    }


def _normalize_output(output: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _fallback_stories()
    output = _safe_dict(output)

    raw_groups = _safe_list(output.get("story_groups"))
    normalized_groups: List[Dict[str, Any]] = []
    flat_stories: List[Dict[str, Any]] = []

    if raw_groups:
        for group in raw_groups:
            if not isinstance(group, dict):
                continue
            epic = _safe_text(group.get("epic_name") or group.get("epic") or group.get("name")) or "Admin / Configuration"
            stories = []
            for index, story in enumerate(_safe_list(group.get("stories"))):
                if not isinstance(story, dict):
                    continue
                normalized = _normalize_story(story, epic, index)
                stories.append(normalized)
                flat_stories.append(normalized)
            if stories:
                normalized_groups.append(
                    {
                        "epic_name": epic,
                        "epic_summary": _safe_text(group.get("epic_summary") or group.get("summary")),
                        "stories": stories,
                    }
                )

    if not normalized_groups:
        grouped: Dict[str, List[Dict[str, Any]]] = {}
        for index, story in enumerate(_safe_list(output.get("stories"))):
            if not isinstance(story, dict):
                continue
            epic = _safe_text(story.get("epic")) or _infer_epic(story)
            normalized = _normalize_story(story, epic, len(grouped.get(epic, [])))
            grouped.setdefault(epic, []).append(normalized)
            flat_stories.append(normalized)

        normalized_groups = [
            {
                "epic_name": epic,
                "epic_summary": f"{len(stories)} story{'ies' if len(stories) != 1 else ''} for {epic}.",
                "stories": stories,
            }
            for epic, stories in grouped.items()
        ]

    return {
        "epic": output.get("epic") or fallback["epic"],
        "story_groups": normalized_groups,
        "stories": flat_stories,
        "technical_build_tasks": output.get("technical_build_tasks") if isinstance(output.get("technical_build_tasks"), list) else [],
        "assumptions": output.get("assumptions") if isinstance(output.get("assumptions"), list) else fallback["assumptions"],
        "dependencies": output.get("dependencies") if isinstance(output.get("dependencies"), list) else fallback["dependencies"],
    }


def generate_stories(requirement: str, architecture: dict) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Create grouped ServiceNow delivery epics and stories.

Return JSON exactly in the structure required by the system prompt, including:
- epic
- story_groups
- stories flat compatibility list
- technical_build_tasks
- assumptions
- dependencies
"""

    output = _chat_json(
        prompt_name="story.txt",
        fallback_prompt=FALLBACK_STORY_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_stories(),
        temperature=0.12,
    )

    return _normalize_output(output)
