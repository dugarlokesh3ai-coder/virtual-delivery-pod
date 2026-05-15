from openai import OpenAI
from dotenv import load_dotenv
import os
import json

from utils.prompt_loader import load_prompt

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def chat_with_delivery_lead(
    user_message: str,
    requirement: str,
    current_package: dict | None,
    chat_history: list,
):
    system_prompt = load_prompt("delivery_lead_chat.txt")

    user_prompt = f"""
User Message:
{user_message}

Current Requirement:
{requirement}

Current Generated Package:
{json.dumps(current_package or {}, indent=2)}

Prior Delivery Lead Chat:
{json.dumps(chat_history or [], indent=2)}

Instructions:
Answer the user's question using the current package first.
If the user asks for a business rule, notification/email, flow, ACL, table, field, story, or QA detail, return artifact-level details.
If details are missing from the package, say they are missing and provide a clearly marked suggested draft.
If the user asks to update the requirement, provide suggested_requirement_update and set should_update_requirement to true.

Return only valid JSON using the required schema.
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        temperature=0.15,
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "answer": content,
            "delivery_lead_recommendation": "The Delivery Lead response could not be parsed as structured JSON.",
            "artifact_type": "General Guidance",
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
                "notes": [
                    "Response parsing failed. Review the raw answer."
                ],
            },
            "suggested_requirement_update": "",
            "should_update_requirement": False,
            "impacted_sections": [],
            "follow_up_questions": [],
            "recommended_next_action": "No Action",
        }