from openai import OpenAI
from dotenv import load_dotenv
import os
import json

from utils.prompt_loader import load_prompt

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_agent_review(requirement: str, current_package: dict):
    system_prompt = load_prompt("agent_review.txt")

    user_prompt = f"""
Business Requirement:
{requirement}

Generated Delivery Package:
{json.dumps(current_package, indent=2)}

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
            "overall_review_summary": "Unable to parse agent review output.",
            "architect_review": {
                "what_looks_good": [],
                "concerns": [],
                "recommended_improvements": [],
                "questions_for_business": [],
            },
            "developer_review": {
                "what_looks_good": [],
                "concerns": [],
                "recommended_improvements": [],
                "questions_for_business": [],
            },
            "qa_review": {
                "what_looks_good": [],
                "concerns": [],
                "recommended_improvements": [],
                "questions_for_business": [],
            },
            "delivery_lead_review": {
                "what_looks_good": [],
                "concerns": [],
                "recommended_improvements": [],
                "questions_for_business": [],
            },
            "priority_fixes": [
                {
                    "priority": "High",
                    "fix": "Regenerate agent review.",
                    "reason": "The agent review response could not be parsed as valid JSON.",
                }
            ],
            "final_verdict": "Not Ready",
        }