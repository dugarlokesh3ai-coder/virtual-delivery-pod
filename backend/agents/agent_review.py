import json
from typing import Any, Dict

from agents._common import _chat_json, _safe_dict


FALLBACK_AGENT_REVIEW_PROMPT = """
You are an internal review board for a ServiceNow delivery package.
Review as Architect, Developer, QA, and Delivery Lead.
Identify contradictions, gaps, and priority fixes.
Return only valid JSON.
"""


def _empty_feedback() -> Dict[str, Any]:
    return {
        "what_looks_good": [],
        "concerns": [],
        "recommended_improvements": [],
        "questions_for_business": [],
    }


def _fallback_agent_review() -> Dict[str, Any]:
    return {
        "overall_review_summary": "Agent review could not be generated.",
        "architect_review": _empty_feedback(),
        "developer_review": _empty_feedback(),
        "qa_review": _empty_feedback(),
        "delivery_lead_review": _empty_feedback(),
        "priority_fixes": [
            {
                "priority": "High",
                "fix": "Retry agent review.",
                "reason": "Agent review failed or returned invalid JSON.",
            }
        ],
        "final_verdict": "Not assessed",
    }


def generate_agent_review(requirement: str, current_package: dict) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Current Package:
{json.dumps(current_package, indent=2)}

Return JSON exactly in this structure:
{{
  "overall_review_summary": "Overall review summary.",
  "architect_review": {{
    "what_looks_good": [],
    "concerns": [],
    "recommended_improvements": [],
    "questions_for_business": []
  }},
  "developer_review": {{
    "what_looks_good": [],
    "concerns": [],
    "recommended_improvements": [],
    "questions_for_business": []
  }},
  "qa_review": {{
    "what_looks_good": [],
    "concerns": [],
    "recommended_improvements": [],
    "questions_for_business": []
  }},
  "delivery_lead_review": {{
    "what_looks_good": [],
    "concerns": [],
    "recommended_improvements": [],
    "questions_for_business": []
  }},
  "priority_fixes": [
    {{
      "priority": "High / Medium / Low",
      "fix": "Recommended fix",
      "reason": "Reason"
    }}
  ],
  "final_verdict": "Ready / Needs Work / Not Ready"
}}
"""

    output = _chat_json(
        prompt_name="agent_review.txt",
        fallback_prompt=FALLBACK_AGENT_REVIEW_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_agent_review(),
        temperature=0.1,
    )

    output = _safe_dict(output)
    fallback = _fallback_agent_review()

    return {
        "overall_review_summary": output.get("overall_review_summary") or fallback["overall_review_summary"],
        "architect_review": output.get("architect_review") if isinstance(output.get("architect_review"), dict) else _empty_feedback(),
        "developer_review": output.get("developer_review") if isinstance(output.get("developer_review"), dict) else _empty_feedback(),
        "qa_review": output.get("qa_review") if isinstance(output.get("qa_review"), dict) else _empty_feedback(),
        "delivery_lead_review": output.get("delivery_lead_review") if isinstance(output.get("delivery_lead_review"), dict) else _empty_feedback(),
        "priority_fixes": output.get("priority_fixes") if isinstance(output.get("priority_fixes"), list) else fallback["priority_fixes"],
        "final_verdict": output.get("final_verdict") or fallback["final_verdict"],
    }
