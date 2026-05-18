import json
from typing import Any, Dict, Optional

from agents._common import _chat_json, _safe_dict


FALLBACK_QUALITY_PROMPT = """
You are a strict ServiceNow delivery quality reviewer.
Score honestly. Do not be generous. Do not give the same score repeatedly.
Quick packages are scored as readiness drafts. Full packages are scored as build handoff packages.
Return only valid JSON.
"""


def _normalize_score(value: Any) -> Optional[int]:
    try:
        if value is None:
            return None
        score = int(round(float(value)))
        return max(0, min(score, 100))
    except Exception:
        return None


def _fallback_quality_score() -> Dict[str, Any]:
    return {
        "overall_score": None,
        "completeness_score": None,
        "risk_score": None,
        "readiness_score": None,
        "rating": "Score unavailable",
        "summary": "Quality score could not be generated or parsed.",
        "score_rationale": {
            "completeness": "Unable to score.",
            "risk": "Unable to score.",
            "readiness": "Unable to score.",
        },
        "score_caps_applied": [
            "Quality score agent failed or returned invalid JSON."
        ],
        "strengths": [],
        "weaknesses": [
            "Quality score unavailable."
        ],
        "recommended_fixes": [
            "Retry quality scoring and review the package manually."
        ],
        "build_readiness_verdict": "Not assessed",
    }


def generate_quality_score(
    requirement: str,
    architecture: dict,
    story_output: dict,
    developer_output: dict,
    qa_output: dict,
    delivery_lead_review: dict,
) -> Dict[str, Any]:
    is_quick_package = not developer_output or not qa_output

    user_payload = f"""
Package Type:
{"QUICK PACKAGE" if is_quick_package else "FULL PACKAGE"}

Business Requirement:
{requirement}

Architecture Output:
{json.dumps(architecture, indent=2)}

Story Output:
{json.dumps(story_output, indent=2)}

Developer Output:
{json.dumps(developer_output, indent=2)}

QA Output:
{json.dumps(qa_output, indent=2)}

Delivery Lead Review:
{json.dumps(delivery_lead_review, indent=2)}

Return JSON exactly in this structure:
{{
  "overall_score": 0,
  "completeness_score": 0,
  "risk_score": 0,
  "readiness_score": 0,
  "rating": "Strong / Good Draft / Needs Work / Weak / Not Build Ready",
  "summary": "Clear summary of why this score was assigned.",
  "score_rationale": {{
    "completeness": "Why completeness score was assigned.",
    "risk": "Why risk score was assigned.",
    "readiness": "Why readiness score was assigned."
  }},
  "score_caps_applied": [
    "Score cap or penalty. Empty list if none."
  ],
  "strengths": [
    "Strength 1"
  ],
  "weaknesses": [
    "Weakness 1"
  ],
  "recommended_fixes": [
    "Fix 1"
  ],
  "build_readiness_verdict": "Clear verdict."
}}
"""

    output = _chat_json(
        prompt_name="quality_score.txt",
        fallback_prompt=FALLBACK_QUALITY_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_quality_score(),
        temperature=0.05,
    )

    output = _safe_dict(output)
    fallback = _fallback_quality_score()

    overall = _normalize_score(output.get("overall_score"))
    completeness = _normalize_score(output.get("completeness_score"))
    risk = _normalize_score(output.get("risk_score"))
    readiness = _normalize_score(output.get("readiness_score"))

    if any(value is None for value in [overall, completeness, risk, readiness]):
        return fallback

    return {
        "overall_score": overall,
        "completeness_score": completeness,
        "risk_score": risk,
        "readiness_score": readiness,
        "rating": output.get("rating") or "Needs Review",
        "summary": output.get("summary") or "",
        "score_rationale": output.get("score_rationale") if isinstance(output.get("score_rationale"), dict) else fallback["score_rationale"],
        "score_caps_applied": output.get("score_caps_applied") if isinstance(output.get("score_caps_applied"), list) else [],
        "strengths": output.get("strengths") if isinstance(output.get("strengths"), list) else [],
        "weaknesses": output.get("weaknesses") if isinstance(output.get("weaknesses"), list) else [],
        "recommended_fixes": output.get("recommended_fixes") if isinstance(output.get("recommended_fixes"), list) else [],
        "build_readiness_verdict": output.get("build_readiness_verdict") or "",
    }
