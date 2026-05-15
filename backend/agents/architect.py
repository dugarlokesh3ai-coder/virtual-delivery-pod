from openai import OpenAI
from dotenv import load_dotenv
import os
import json

from utils.prompt_loader import load_prompt

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_architecture(requirement: str):
    system_prompt = load_prompt("architect.txt")

    user_prompt = f"""
Business Requirement:
{requirement}

Return only valid JSON.
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except Exception:
        return {
            "requirement_summary": "Unable to parse architecture output.",
            "solution_design": content,
            "recommended_app_type": "Review Required",
            "tables": [],
            "workflow_steps": [],
            "risks": [],
            "open_questions": [
                "Architecture output could not be parsed as JSON."
            ],
        }