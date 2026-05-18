from typing import Any, Dict

from agents._common import _chat_json, _safe_dict


FALLBACK_INTAKE_PROMPT = """
You are a ServiceNow delivery lead analyzing intake quality.
Identify whether the input is ready to generate a package.
Return only valid JSON.
"""


def _fallback_intake_analysis() -> Dict[str, Any]:
    return {
        "understanding": "Intake analysis could not be generated.",
        "can_generate_package": False,
        "confidence": "Low",
        "clarifying_questions": [
            "Please review the requirement manually and retry analysis."
        ],
        "assumptions": [],
        "missing_requirements": [
            {
                "gap": "Intake analyzer failed or returned invalid JSON.",
                "why_it_matters": "The package may miss critical delivery details."
            }
        ],
        "recommended_next_step": "Retry analysis or generate a package with caution.",
    }


def analyze_requirement_intake(requirement: str) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Return JSON exactly in this structure:
{{
  "understanding": "What the requirement appears to ask for.",
  "can_generate_package": true,
  "confidence": "High / Medium / Low",
  "clarifying_questions": [
    "Question 1"
  ],
  "assumptions": [
    "Assumption 1"
  ],
  "missing_requirements": [
    {{
      "gap": "Missing or weak requirement",
      "why_it_matters": "Why this matters"
    }}
  ],
  "recommended_next_step": "Recommended next action"
}}
"""

    output = _chat_json(
        prompt_name="intake_analyzer.txt",
        fallback_prompt=FALLBACK_INTAKE_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_intake_analysis(),
        temperature=0.1,
    )

    output = _safe_dict(output)
    fallback = _fallback_intake_analysis()

    return {
        "understanding": output.get("understanding") or fallback["understanding"],
        "can_generate_package": bool(output.get("can_generate_package", False)),
        "confidence": output.get("confidence") or fallback["confidence"],
        "clarifying_questions": output.get("clarifying_questions") if isinstance(output.get("clarifying_questions"), list) else fallback["clarifying_questions"],
        "assumptions": output.get("assumptions") if isinstance(output.get("assumptions"), list) else [],
        "missing_requirements": output.get("missing_requirements") if isinstance(output.get("missing_requirements"), list) else fallback["missing_requirements"],
        "recommended_next_step": output.get("recommended_next_step") or fallback["recommended_next_step"],
    }
