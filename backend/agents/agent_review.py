import json
import re
from typing import Any, Dict, List

from agents._common import _chat_json, _safe_dict


FALLBACK_AGENT_REVIEW_PROMPT = """
You are an internal review board for a ServiceNow delivery package.
Review as Architect, Developer, QA, and Delivery Lead.
Identify contradictions, gaps, and priority fixes.
Deduplicate overlapping business questions into consolidated_decisions_needed.
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
        "consolidated_decisions_needed": [],
        "priority_fixes": [
            {
                "priority": "High",
                "fix": "Retry agent review.",
                "reason": "Agent review failed or returned invalid JSON.",
            }
        ],
        "final_verdict": "Not assessed",
    }


def _ensure_list(value: Any) -> List[Any]:
    return value if isinstance(value, list) else []


def _normalize_feedback(value: Any) -> Dict[str, Any]:
    if not isinstance(value, dict):
        return _empty_feedback()

    return {
        "what_looks_good": _ensure_list(value.get("what_looks_good")),
        "concerns": _ensure_list(value.get("concerns")),
        "recommended_improvements": _ensure_list(value.get("recommended_improvements")),
        "questions_for_business": _ensure_list(value.get("questions_for_business")),
    }


def _normalize_decision(value: Any) -> Dict[str, Any]:
    if not isinstance(value, dict):
        return {}

    return {
        "decision_area": value.get("decision_area") or value.get("area") or "General",
        "question": value.get("question") or "",
        "why_it_matters": value.get("why_it_matters") or value.get("reason") or "",
        "impacted_reviewers": _ensure_list(value.get("impacted_reviewers")),
        "recommended_default_if_unanswered": value.get("recommended_default_if_unanswered") or "Treat as unresolved and do not mark production build-ready.",
        "blocks_build_readiness": bool(value.get("blocks_build_readiness", False)),
    }


def _decision_area_for_question(question: str) -> str:
    q = question.lower()
    if any(term in q for term in ["license", "licensing", "grc", "irm", "module", "platform", "catalog", "flow designer", "custom"]):
        return "Platform / Licensing"
    if any(term in q for term in ["approver", "approval", "group", "membership", "escalation", "routing", "owner"]):
        return "Approval Routing"
    if any(term in q for term in ["attachment", "retention", "encryption", "masking", "sensitive", "legal hold", "data", "privacy"]):
        return "Security / Attachments"
    if any(term in q for term in ["notification", "template", "email", "channel"]):
        return "Notifications"
    if any(term in q for term in ["extension", "renewal", "expire", "expiration"]):
        return "Lifecycle / Extension"
    if any(term in q for term in ["report", "dashboard", "metric", "analytics"]):
        return "Reporting"
    return "Business Decision"


def _fingerprint_question(question: str) -> str:
    text = re.sub(r"[^a-z0-9 ]", " ", question.lower())
    stop = {"what", "who", "when", "where", "why", "how", "are", "is", "the", "a", "an", "and", "or", "for", "to", "of", "in", "on", "be", "should", "can", "please", "confirm", "provide", "exact", "specific"}
    tokens = [token for token in text.split() if token and token not in stop]
    # Keep the most important repeated concepts while removing purely stylistic wording.
    return " ".join(sorted(set(tokens))[:12])


def _dedupe_decisions(output: Dict[str, Any]) -> List[Dict[str, Any]]:
    explicit = [
        _normalize_decision(item)
        for item in _ensure_list(output.get("consolidated_decisions_needed"))
    ]
    explicit = [item for item in explicit if item.get("question")]

    if explicit:
        seen = set()
        result = []
        for item in explicit:
            key = _fingerprint_question(str(item.get("question", "")))
            if key in seen:
                continue
            seen.add(key)
            result.append(item)
        return result[:10]

    reviewer_map = {
        "Architect": output.get("architect_review"),
        "Developer": output.get("developer_review"),
        "QA": output.get("qa_review"),
        "Delivery Lead": output.get("delivery_lead_review"),
    }

    grouped: Dict[str, Dict[str, Any]] = {}
    for reviewer, feedback in reviewer_map.items():
        normalized = _normalize_feedback(feedback)
        for question in normalized.get("questions_for_business", []):
            question_text = str(question).strip()
            if not question_text:
                continue
            key = _fingerprint_question(question_text)
            if not key:
                key = question_text.lower()

            if key not in grouped:
                grouped[key] = {
                    "decision_area": _decision_area_for_question(question_text),
                    "question": question_text,
                    "why_it_matters": "This decision affects architecture, delivery readiness, implementation, or test coverage.",
                    "impacted_reviewers": [reviewer],
                    "recommended_default_if_unanswered": "Treat as unresolved and keep build readiness at Needs Discovery or Ready with Assumptions.",
                    "blocks_build_readiness": True,
                }
            else:
                if reviewer not in grouped[key]["impacted_reviewers"]:
                    grouped[key]["impacted_reviewers"].append(reviewer)

    return list(grouped.values())[:10]


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
  "consolidated_decisions_needed": [
    {{
      "decision_area": "Platform / Licensing / Approval Routing / Security / Attachments / Notifications / Lifecycle / Extension / Reporting",
      "question": "Single deduplicated business decision question.",
      "why_it_matters": "Why this decision matters.",
      "impacted_reviewers": ["Architect", "Developer", "QA", "Delivery Lead"],
      "recommended_default_if_unanswered": "What the package should assume if the business does not answer.",
      "blocks_build_readiness": true
    }}
  ],
  "priority_fixes": [
    {{
      "priority": "High / Medium / Low",
      "fix": "Recommended fix",
      "reason": "Reason"
    }}
  ],
  "final_verdict": "Ready / Conditionally Ready / Needs Work / Not Ready"
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

    normalized = {
        "overall_review_summary": output.get("overall_review_summary") or fallback["overall_review_summary"],
        "architect_review": _normalize_feedback(output.get("architect_review")),
        "developer_review": _normalize_feedback(output.get("developer_review")),
        "qa_review": _normalize_feedback(output.get("qa_review")),
        "delivery_lead_review": _normalize_feedback(output.get("delivery_lead_review")),
        "priority_fixes": _ensure_list(output.get("priority_fixes")) or fallback["priority_fixes"],
        "final_verdict": output.get("final_verdict") or fallback["final_verdict"],
    }
    normalized["consolidated_decisions_needed"] = _dedupe_decisions({**output, **normalized})
    return normalized
