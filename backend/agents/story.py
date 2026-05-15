from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_stories(requirement: str, architecture: dict):
    prompt = f"""
You are a senior ServiceNow Business Systems Analyst.

Create delivery-ready user stories from the business requirement and architecture.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Do not say "certainly".
Do not say "if you want".

Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Return this JSON structure exactly:

{{
  "epic": "Epic title",
  "stories": [
    {{
      "title": "Story title",
      "persona": "User persona",
      "story": "As a [persona], I want [capability], so that [business value].",
      "acceptance_criteria": [
        "Given..., when..., then...",
        "Given..., when..., then..."
      ],
      "priority": "High / Medium / Low",
      "notes": "Any business notes or assumptions"
    }}
  ],
  "assumptions": [
    "Assumption 1"
  ],
  "dependencies": [
    "Dependency 1"
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior ServiceNow BSA. Return only valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "epic": "Unable to parse story output.",
            "stories": [],
            "assumptions": [],
            "dependencies": []
        }