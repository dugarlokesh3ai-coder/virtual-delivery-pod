import json
from typing import Any, Dict, List

from agents._common import _chat_json, _safe_dict


FALLBACK_DEVELOPER_PROMPT = """
You are a senior ServiceNow developer / technical lead.
Create practical implementation notes from the business requirement, architecture, and stories.
Map technical work to story IDs, delivery epics, and build sequence.
Prefer ServiceNow configuration before customization.
Clearly flag where scripting/customization may be required.
Return only valid JSON.
"""


def _fallback_developer_notes() -> Dict[str, Any]:
    return {
        "implementation_summary": "Developer notes could not be generated.",
        "service_now_objects": [],
        "flow_designer_notes": [],
        "business_rules": [],
        "ui_policies": [],
        "acl_notes": [
            "Developer agent failed or returned invalid JSON. Review security manually."
        ],
        "notification_notes": [],
        "build_sequence": [],
        "epic_build_map": [],
        "deployment_notes": [
            "Retry developer generation before build handoff."
        ],
        "technical_assumptions": [
            "Developer output unavailable."
        ],
    }


def _safe_list(value: Any) -> List[Any]:
    return value if isinstance(value, list) else []


def generate_developer_notes(
    requirement: str,
    architecture: dict,
    story_output: dict,
) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Story Context:
{json.dumps(story_output, indent=2)}

Use story_id values from story_groups/stories in every technical item where possible.

Return JSON exactly in this structure:
{{
  "implementation_summary": "Short technical implementation summary.",
  "service_now_objects": [
    {{
      "object_type": "Table / Field / Choice List / Flow / Business Rule / UI Policy / ACL / Role / Notification / Report / Scheduled Job / Module / User Criteria / Configuration",
      "name": "Object name",
      "purpose": "What it does",
      "related_story_ids": ["WF-001"],
      "epic": "Workflow / Routing / Approvals",
      "implementation_type": "Flow Designer / ACL / Report / Configuration / Script / Custom Table",
      "configuration_or_code": "Configuration / Code / Mixed",
      "build_sequence": "Sprint 1 / Sprint 2 / Sprint 3 / Later",
      "technical_debt_level": "Low / Medium / High / None",
      "technical_debt_notes": "Why this is or is not technical debt."
    }}
  ],
  "flow_designer_notes": [
    {{
      "flow_name": "Flow name",
      "trigger": "Trigger condition",
      "steps": [
        "Step 1"
      ],
      "related_story_ids": ["WF-001"],
      "epic": "Workflow / Routing / Approvals",
      "implementation_type": "Flow Designer",
      "configuration_or_code": "Configuration",
      "build_sequence": "Sprint 2",
      "technical_debt_level": "Low / Medium / High / None"
    }}
  ],
  "business_rules": [
    {{
      "name": "Business rule name",
      "when": "Before / After / Async / Display",
      "condition": "When it should run",
      "purpose": "What it does",
      "related_story_ids": ["DATA-001"],
      "epic": "Data Model / Tables / Fields",
      "implementation_type": "Business Rule",
      "configuration_or_code": "Code",
      "build_sequence": "Sprint 2",
      "technical_debt_level": "Low / Medium / High / None",
      "technical_debt_notes": "Why it is needed and how to mitigate."
    }}
  ],
  "ui_policies": [
    {{
      "name": "UI policy name",
      "condition": "Condition",
      "actions": [
        "Action 1"
      ],
      "related_story_ids": ["UX-001"],
      "epic": "Forms / UX / Catalog Experience",
      "build_sequence": "Sprint 1"
    }}
  ],
  "acl_notes": [
    "ACL note 1 with related story IDs where possible"
  ],
  "notification_notes": [
    "Notification note 1 with related story IDs where possible"
  ],
  "build_sequence": [
    {{
      "sprint": "Sprint 1",
      "epic": "Data Model / Tables / Fields",
      "technical_work": ["Object or flow name"],
      "related_story_ids": ["DATA-001"],
      "dependencies": ["Dependency"]
    }}
  ],
  "epic_build_map": [
    {{
      "epic": "Workflow / Routing / Approvals",
      "story_ids": ["WF-001"],
      "objects": ["Flow or object name"],
      "build_sequence": "Sprint 2",
      "notes": "How this epic should be built."
    }}
  ],
  "deployment_notes": [
    "Deployment note 1"
  ],
  "technical_assumptions": [
    "Assumption 1"
  ]
}}
"""

    output = _chat_json(
        prompt_name="developer.txt",
        fallback_prompt=FALLBACK_DEVELOPER_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_developer_notes(),
        temperature=0.12,
    )

    output = _safe_dict(output)
    fallback = _fallback_developer_notes()

    return {
        "implementation_summary": output.get("implementation_summary") or fallback["implementation_summary"],
        "service_now_objects": _safe_list(output.get("service_now_objects")),
        "flow_designer_notes": _safe_list(output.get("flow_designer_notes")),
        "business_rules": _safe_list(output.get("business_rules")),
        "ui_policies": _safe_list(output.get("ui_policies")),
        "acl_notes": _safe_list(output.get("acl_notes")) or fallback["acl_notes"],
        "notification_notes": _safe_list(output.get("notification_notes")),
        "build_sequence": _safe_list(output.get("build_sequence")),
        "epic_build_map": _safe_list(output.get("epic_build_map")),
        "deployment_notes": _safe_list(output.get("deployment_notes")) or fallback["deployment_notes"],
        "technical_assumptions": _safe_list(output.get("technical_assumptions")) or fallback["technical_assumptions"],
    }
