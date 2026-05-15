from openai import OpenAI
from dotenv import load_dotenv
import os
import json

from utils.prompt_loader import load_prompt

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_developer_notes(requirement: str, architecture: dict, story_output: dict):
    system_prompt = load_prompt("developer.txt")

    user_prompt = f"""
Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Story Context:
{json.dumps(story_output, indent=2)}

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
            "implementation_summary": "Unable to parse developer output.",
            "service_now_objects": [],
            "flow_designer_notes": [],
            "business_rules": [],
            "ui_policies": [],
            "acl_notes": [],
            "notification_notes": [],
            "deployment_notes": [],
            "technical_assumptions": [
                "Developer agent response could not be parsed as valid JSON."
            ],
        }