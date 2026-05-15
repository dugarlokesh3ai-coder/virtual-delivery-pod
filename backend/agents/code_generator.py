from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_code_for_technical_card(card: dict, full_context: str):
    prompt = f"""
You are a senior ServiceNow developer.

Generate implementation guidance and code/configuration details for this selected technical item.

Selected Technical Card:
{card}

Full Requirement Context:
{full_context}

Rules:
- Be practical.
- Include ServiceNow configuration steps.
- Include code only where scripting is appropriate.
- If Flow Designer is better than script, say so.
- Do not invent integrations.
- Use copy-paste-ready snippets where useful.
- For scripts, include comments.

Return in this structure:

Implementation Approach:
...

Configuration Steps:
1. ...

Code / Script:
...

Testing Notes:
...
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior ServiceNow developer."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content