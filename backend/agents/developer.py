import json
from typing import Any, Dict

from agents._common import _chat_json, _safe_dict


FALLBACK_DEVELOPER_PROMPT = """
You are a senior ServiceNow developer / technical lead.
Create practical implementation notes from the business requirement, architecture, and stories.
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
        "deployment_notes": [
            "Retry developer generation before build handoff."
        ],
        "technical_assumptions": [
            "Developer output unavailable."
        ],
    }


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

Return JSON exactly in this structure:
{{
  "implementation_summary": "Short technical implementation summary.",
  "service_now_objects": [
    {{
      "object_type": "Table / Field / Flow / Business Rule / UI Policy / ACL / Notification / Scheduled Job / Module / Role / Report",
      "name": "Object name",
      "purpose": "What it does"
    }}
  ],
  "flow_designer_notes": [
    {{
      "flow_name": "Flow name",
      "trigger": "Trigger condition",
      "steps": [
        "Step 1"
      ]
    }}
  ],
  "business_rules": [
    {{
      "name": "Business rule name",
      "when": "Before / After / Async / Display",
      "condition": "When it should run",
      "purpose": "What it does"
    }}
  ],
  "ui_policies": [
    {{
      "name": "UI policy name",
      "condition": "Condition",
      "actions": [
        "Action 1"
      ]
    }}
  ],
  "acl_notes": [
    "ACL note 1"
  ],
  "notification_notes": [
    "Notification note 1"
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
        "service_now_objects": output.get("service_now_objects") if isinstance(output.get("service_now_objects"), list) else [],
        "flow_designer_notes": output.get("flow_designer_notes") if isinstance(output.get("flow_designer_notes"), list) else [],
        "business_rules": output.get("business_rules") if isinstance(output.get("business_rules"), list) else [],
        "ui_policies": output.get("ui_policies") if isinstance(output.get("ui_policies"), list) else [],
        "acl_notes": output.get("acl_notes") if isinstance(output.get("acl_notes"), list) else fallback["acl_notes"],
        "notification_notes": output.get("notification_notes") if isinstance(output.get("notification_notes"), list) else [],
        "deployment_notes": output.get("deployment_notes") if isinstance(output.get("deployment_notes"), list) else fallback["deployment_notes"],
        "technical_assumptions": output.get("technical_assumptions") if isinstance(output.get("technical_assumptions"), list) else fallback["technical_assumptions"],
    }
