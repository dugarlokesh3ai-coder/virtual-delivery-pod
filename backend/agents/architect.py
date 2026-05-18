import json
from typing import Any, Dict

from agents._common import _chat_json, _safe_dict


FALLBACK_ARCHITECT_PROMPT = """
You are a senior ServiceNow solution architect.
Create a practical architecture/design package from the requirement.
Prefer ServiceNow configuration and OOB capability before customization.
Do not invent integrations unless explicitly mentioned.
Return only valid JSON matching the requested structure.
"""


def _fallback_architecture() -> Dict[str, Any]:
    return {
        "requirement_summary": "Architecture could not be generated.",
        "solution_design": "Unable to generate solution design. Check backend logs.",
        "recommended_app_type": "Needs review",
        "tables": [],
        "workflow_steps": [],
        "risks": [
            {
                "risk": "Architecture agent failed or returned invalid JSON.",
                "mitigation": "Retry generation and review backend logs.",
            }
        ],
        "open_questions": [
            "Architecture output was unavailable. Confirm requirement details manually."
        ],
    }


def generate_architecture(requirement: str) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Return JSON exactly in this structure:
{{
  "requirement_summary": "Short summary of the requirement.",
  "solution_design": "Practical ServiceNow solution design.",
  "recommended_app_type": "Catalog Item / OOB Module / Custom Scoped Application / Custom scoped application with Service Catalog intake front door",
  "tables": [
    {{
      "table_name": "Table name",
      "purpose": "Purpose",
      "type": "Core / Configuration / Task / M2M / Extension"
    }}
  ],
  "workflow_steps": [
    "Step 1"
  ],
  "risks": [
    {{
      "risk": "Risk",
      "mitigation": "Mitigation"
    }}
  ],
  "open_questions": [
    "Question 1"
  ]
}}
"""

    output = _chat_json(
        prompt_name="architect.txt",
        fallback_prompt=FALLBACK_ARCHITECT_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_architecture(),
        temperature=0.12,
    )

    output = _safe_dict(output)
    fallback = _fallback_architecture()

    return {
        "requirement_summary": output.get("requirement_summary") or fallback["requirement_summary"],
        "solution_design": output.get("solution_design") or fallback["solution_design"],
        "recommended_app_type": output.get("recommended_app_type") or fallback["recommended_app_type"],
        "tables": output.get("tables") if isinstance(output.get("tables"), list) else [],
        "workflow_steps": output.get("workflow_steps") if isinstance(output.get("workflow_steps"), list) else [],
        "risks": output.get("risks") if isinstance(output.get("risks"), list) else fallback["risks"],
        "open_questions": output.get("open_questions") if isinstance(output.get("open_questions"), list) else fallback["open_questions"],
    }
