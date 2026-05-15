from openai import OpenAI
from dotenv import load_dotenv
import os
import json

from utils.prompt_loader import load_prompt

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_qa_package(
    requirement: str,
    architecture: dict,
    story_output: dict,
    developer_output: dict,
):
    system_prompt = load_prompt("qa.txt")

    user_prompt = f"""
Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Story Context:
{json.dumps(story_output, indent=2)}

Developer / Technical Context:
{json.dumps(developer_output, indent=2)}

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
            "test_strategy": "Unable to parse QA output.",
            "test_scenarios": [],
            "test_cases": [],
            "uat_cases": [],
            "edge_cases": [],
            "test_data_needs": [],
            "regression_areas": [
                "QA agent response could not be parsed as valid JSON."
            ],
        }