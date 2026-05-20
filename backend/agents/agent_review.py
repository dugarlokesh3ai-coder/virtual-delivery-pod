import json
import re
from typing import Any, Dict, List

from agents._common import _chat_json, _safe_dict


FALLBACK_AGENT_REVIEW_PROMPT = """
You are an internal senior ServiceNow implementation review board.
Review as Architect, Developer, QA, Product Owner, Business Systems Analyst, Project Manager, and Delivery Lead.
Return only valid JSON.
"""

DECISION_VERBS = (
    "confirm", "define", "finalize", "clarify", "decide", "validate", "identify",
    "provide", "establish", "determine", "obtain", "document", "specify", "select",
    "approve", "choose"
)


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


def _safe_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def _safe_list(value: Any) -> List[Any]:
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return [value]


def _make_question(text: str) -> str:
    text = re.sub(r"^[,;:\-\s]+", "", text or "").strip()
    text = re.sub(r"[.;?\s]+$", "", text).strip()
    if not text:
        return ""
    return text[:1].upper() + text[1:] + "?"


def _decision_area_for_question(question: str, fallback: str) -> str:
    q = question.lower()
    if "license" in q or "module" in q or "plugin" in q:
        return "Platform Licensing"
    if "manager" in q:
        return "Manager Approval Routing"
    if "application owner" in q or "app owner" in q or "salesforce owner" in q:
        return "Application Owner Approval Routing"
    if "support group" in q or "assignment group" in q or "fulfillment" in q:
        return "Fulfillment Assignment Group"
    if "notification" in q or "template" in q or "channel" in q or "email" in q:
        return "Notification Content and Channels"
    if "fallback" in q or "error" in q or "misconfigured" in q or "missing" in q:
        return "Routing Fallback and Error Handling"
    if "attachment" in q or "document" in q or "storage" in q:
        return "Attachment and Storage Scope"
    if "audit" in q or "retention" in q or "compliance" in q:
        return "Audit Retention and Compliance"
    if "report" in q or "dashboard" in q:
        return "Reporting Scope"
    return fallback or "Business Decision"


def _split_bundled_decision(decision: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw_question = _safe_text(decision.get("question"))
    if not raw_question:
        return [decision]

    question = re.sub(r"^can\s+(the\s+)?business\s+(please\s+)?", "", raw_question, flags=re.I).strip()
    question = re.sub(r"^please\s+", "", question, flags=re.I).strip()
    # Split only where a new decision verb starts. This catches "confirm X, define Y, finalize Z".
    verb_pattern = "|".join(DECISION_VERBS)
    normalized = re.sub(rf"\s+and\s+(?=({verb_pattern})\b)", ", ", question, flags=re.I)
    normalized = re.sub(rf";\s+(?=({verb_pattern})\b)", ", ", normalized, flags=re.I)
    parts = re.split(rf",\s+(?=({verb_pattern})\b)", normalized, flags=re.I)

    # re.split with a capturing group returns verbs as separate elements. Reassemble verb + phrase.
    rebuilt: List[str] = []
    i = 0
    while i < len(parts):
        part = parts[i]
        if part and part.lower() in DECISION_VERBS and i + 1 < len(parts):
            rebuilt.append(f"{part} {parts[i + 1]}")
            i += 2
        else:
            if part and part.lower() not in DECISION_VERBS:
                rebuilt.append(part)
            i += 1

    cleaned = [_make_question(item) for item in rebuilt if _make_question(item)]
    if len(cleaned) <= 1:
        return [decision]

    split: List[Dict[str, Any]] = []
    for item in cleaned:
        split.append({
            **decision,
            "decision_area": _decision_area_for_question(item, _safe_text(decision.get("decision_area"))),
            "question": item,
        })
    return split


def _normalize_decisions(value: Any) -> List[Dict[str, Any]]:
    decisions: List[Dict[str, Any]] = []
    for item in _safe_list(value):
        if not isinstance(item, dict):
            continue
        for split_item in _split_bundled_decision(item):
            question = _safe_text(split_item.get("question"))
            if not question:
                continue
            decisions.append({
                "decision_area": _safe_text(split_item.get("decision_area")) or _decision_area_for_question(question, "Business Decision"),
                "question": question,
                "why_it_matters": _safe_text(split_item.get("why_it_matters")) or "This decision affects build readiness, testing, or deployment confidence.",
                "impacted_reviewers": _safe_list(split_item.get("impacted_reviewers")) or ["Architect", "Developer", "QA", "Delivery Lead"],
                "recommended_default_if_unanswered": _safe_text(split_item.get("recommended_default_if_unanswered")) or "Use documented MVP assumption and flag for confirmation.",
                "blocks_build_readiness": bool(split_item.get("blocks_build_readiness")) if split_item.get("blocks_build_readiness") is not None else False,
            })

    # De-duplicate by normalized question.
    seen = set()
    unique: List[Dict[str, Any]] = []
    for decision in decisions:
        key = re.sub(r"\W+", " ", decision["question"].lower()).strip()
        if key in seen:
            continue
        seen.add(key)
        unique.append(decision)
    return unique[:12]


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
      "decision_area": "Atomic decision area",
      "question": "One business-answerable question only.",
      "why_it_matters": "Why this matters.",
      "impacted_reviewers": ["Architect", "Developer", "QA", "Delivery Lead"],
      "recommended_default_if_unanswered": "MVP default assumption.",
      "blocks_build_readiness": false
    }}
  ],
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
        "consolidated_decisions_needed": _normalize_decisions(output.get("consolidated_decisions_needed")),
        "priority_fixes": output.get("priority_fixes") if isinstance(output.get("priority_fixes"), list) else fallback["priority_fixes"],
        "final_verdict": output.get("final_verdict") or fallback["final_verdict"],
    }
