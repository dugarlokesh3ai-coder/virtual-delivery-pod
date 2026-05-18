import json
from typing import Any, Dict, List

from agents._common import _chat_json, _safe_dict, _safe_list


FALLBACK_DELIVERY_LEAD_CHAT_PROMPT = """
You are the Delivery Lead Copilot for a ServiceNow delivery package.
Answer questions using only the current requirement and package context.
If asked to update the requirement, return a concise suggested_requirement_update.
Return only valid JSON.
"""


def _fallback_chat_response() -> Dict[str, Any]:
    return {
        "answer": "Delivery Lead chat could not generate a response.",
        "delivery_lead_recommendation": "Retry the question or review package manually.",
        "artifact_type": "General",
        "artifact_details": {
            "name": "",
            "table": "",
            "trigger": "",
            "condition": "",
            "recipients": [],
            "subject": "",
            "body": "",
            "steps": [],
            "roles": [],
            "fields": [],
            "expected_result": "",
            "notes": [],
        },
        "suggested_requirement_update": "",
        "should_update_requirement": False,
        "impacted_sections": [],
        "follow_up_questions": [],
        "recommended_next_action": "Retry chat.",
    }


def generate_delivery_lead_chat(
    message: str,
    requirement: str,
    current_package: dict,
    chat_history: List[dict],
) -> Dict[str, Any]:
    user_payload = f"""
User Message:
{message}

Business Requirement:
{requirement}

Current Package:
{json.dumps(current_package, indent=2)}

Chat History:
{json.dumps(chat_history, indent=2)}

Return JSON exactly in this structure:
{{
  "answer": "Direct answer to the user.",
  "delivery_lead_recommendation": "Recommended delivery lead action.",
  "artifact_type": "Business Rule / Flow / Notification / ACL / Story / Requirement Update / General / QA / Table / Field",
  "artifact_details": {{
    "name": "",
    "table": "",
    "trigger": "",
    "condition": "",
    "recipients": [],
    "subject": "",
    "body": "",
    "steps": [],
    "roles": [],
    "fields": [],
    "expected_result": "",
    "notes": []
  }},
  "suggested_requirement_update": "Only populate if user asked to change requirement or if a clear requirement update is needed.",
  "should_update_requirement": false,
  "impacted_sections": [
    "Section name"
  ],
  "follow_up_questions": [
    "Question 1"
  ],
  "recommended_next_action": "Next action"
}}
"""

    output = _chat_json(
        prompt_name="delivery_lead_chat.txt",
        fallback_prompt=FALLBACK_DELIVERY_LEAD_CHAT_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_chat_response(),
        temperature=0.15,
    )

    output = _safe_dict(output)
    fallback = _fallback_chat_response()
    artifact_details = output.get("artifact_details") if isinstance(output.get("artifact_details"), dict) else fallback["artifact_details"]

    return {
        "answer": output.get("answer") or fallback["answer"],
        "delivery_lead_recommendation": output.get("delivery_lead_recommendation") or "",
        "artifact_type": output.get("artifact_type") or "General",
        "artifact_details": artifact_details,
        "suggested_requirement_update": output.get("suggested_requirement_update") or "",
        "should_update_requirement": bool(output.get("should_update_requirement", False)),
        "impacted_sections": output.get("impacted_sections") if isinstance(output.get("impacted_sections"), list) else [],
        "follow_up_questions": output.get("follow_up_questions") if isinstance(output.get("follow_up_questions"), list) else [],
        "recommended_next_action": output.get("recommended_next_action") or "",
    }


# Backward-compatible alias if main.py calls delivery_lead_chat instead.
def delivery_lead_chat(message: str, requirement: str, current_package: dict, chat_history: List[dict]) -> Dict[str, Any]:
    return generate_delivery_lead_chat(message, requirement, current_package, chat_history)
