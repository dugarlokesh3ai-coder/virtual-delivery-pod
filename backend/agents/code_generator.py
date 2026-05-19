import json
import os
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

from utils.prompt_loader import load_prompt

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


FALLBACK_CODE_GENERATOR_PROMPT = """
You are a senior ServiceNow developer.
Generate practical implementation guidance for the selected technical card.
Prefer configuration and Flow Designer before custom scripting.
Use related_story_ids, epic, implementation_type, configuration_or_code, build_sequence, and technical_debt_level when provided.
When code is useful, provide ServiceNow-oriented examples and explain where they belong.
Do not invent external integrations.
Return plain text. Do not return JSON unless explicitly asked.
"""


def generate_code_for_technical_card(card: Any, full_context: str) -> str:
    prompt = load_prompt("code_generator.txt", FALLBACK_CODE_GENERATOR_PROMPT)

    user_payload = f"""
Selected Technical Card:
{json.dumps(card, indent=2)}

Full Package Context:
{full_context}

Create implementation guidance/code notes for this card.
Explicitly reference related story IDs and build sequence if available.
"""

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior ServiceNow developer. Return clear implementation guidance aligned to the related story IDs.",
                },
                {
                    "role": "user",
                    "content": f"{prompt}\n\nINPUT CONTEXT:\n{user_payload}",
                },
            ],
            temperature=0.12,
        )

        return response.choices[0].message.content or "No implementation guidance returned."
    except Exception as error:
        print("Code generation failed:", error)
        return "Unable to generate implementation guidance. Check backend logs."
