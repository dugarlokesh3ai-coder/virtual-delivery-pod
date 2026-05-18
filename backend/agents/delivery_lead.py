import json
from typing import Any, Dict

from agents._common import _chat_json, _safe_dict


FALLBACK_DELIVERY_LEAD_PROMPT = """
You are a ServiceNow delivery lead.
Review requirement, architecture, stories, developer notes, and QA output.
Separate confirmed scope from assumptions and open questions.
Return only valid JSON.
"""


def _fallback_delivery_lead_review() -> Dict[str, Any]:
    return {
        "understanding": "Delivery Lead review could not be generated.",
        "mvp_scope": [],
        "phase_2_scope": [],
        "assumptions": [
            "Delivery Lead agent failed or returned invalid JSON."
        ],
        "missing_requirements": [],
        "clarifying_questions": [
            "Review the requirement manually before build handoff."
        ],
        "recommended_next_steps": [
            "Retry Delivery Lead review."
        ],
    }


def generate_delivery_lead_review(
    requirement: str,
    architecture: dict,
    story_output: dict,
    developer_output: dict,
    qa_output: dict,
) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Story Context:
{json.dumps(story_output, indent=2)}

Developer Context:
{json.dumps(developer_output, indent=2)}

QA Context:
{json.dumps(qa_output, indent=2)}

Return JSON exactly in this structure:
{{
  "understanding": "Delivery lead understanding of the request.",
  "mvp_scope": [
    "MVP scope item"
  ],
  "phase_2_scope": [
    "Phase 2 scope item"
  ],
  "assumptions": [
    "Assumption 1"
  ],
  "missing_requirements": [
    {{
      "gap": "Missing or weak requirement",
      "why_it_matters": "Why it matters"
    }}
  ],
  "clarifying_questions": [
    "Question 1"
  ],
  "recommended_next_steps": [
    "Next step 1"
  ]
}}
"""

    output = _chat_json(
        prompt_name="delivery_lead.txt",
        fallback_prompt=FALLBACK_DELIVERY_LEAD_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_delivery_lead_review(),
        temperature=0.1,
    )

    output = _safe_dict(output)
    fallback = _fallback_delivery_lead_review()

    return {
        "understanding": output.get("understanding") or fallback["understanding"],
        "mvp_scope": output.get("mvp_scope") if isinstance(output.get("mvp_scope"), list) else [],
        "phase_2_scope": output.get("phase_2_scope") if isinstance(output.get("phase_2_scope"), list) else [],
        "assumptions": output.get("assumptions") if isinstance(output.get("assumptions"), list) else fallback["assumptions"],
        "missing_requirements": output.get("missing_requirements") if isinstance(output.get("missing_requirements"), list) else [],
        "clarifying_questions": output.get("clarifying_questions") if isinstance(output.get("clarifying_questions"), list) else fallback["clarifying_questions"],
        "recommended_next_steps": output.get("recommended_next_steps") if isinstance(output.get("recommended_next_steps"), list) else fallback["recommended_next_steps"],
    }
