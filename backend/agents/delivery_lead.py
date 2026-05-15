from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_delivery_lead_review(requirement: str, architecture: dict, story_output: dict, developer_output: dict, qa_output: dict):
    prompt = f"""
You are the Delivery Lead Agent for a Virtual ServiceNow Delivery Pod.

Your job is to review the business requirement and the generated delivery package like a senior ServiceNow delivery lead.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Do not say "certainly".
Do not say "if you want".

Focus on:
- What the team understood
- MVP scope
- Phase 2 / future scope
- Assumptions
- Missing or weak requirements
- Clarifying questions
- Recommended next steps

Business Requirement:
{requirement}

Architecture Output:
{json.dumps(architecture, indent=2)}

Story Output:
{json.dumps(story_output, indent=2)}

Developer Output:
{json.dumps(developer_output, indent=2)}

QA Output:
{json.dumps(qa_output, indent=2)}

Return this JSON structure exactly:

{{
  "understanding": "Clear summary of what the business appears to need.",
  "mvp_scope": [
    "MVP item 1"
  ],
  "phase_2_scope": [
    "Future item 1"
  ],
  "assumptions": [
    "Assumption 1"
  ],
  "missing_requirements": [
    {{
      "gap": "Missing requirement",
      "why_it_matters": "Why this matters for delivery"
    }}
  ],
  "clarifying_questions": [
    "Question 1"
  ],
  "recommended_next_steps": [
    "Next step 1"
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior ServiceNow Delivery Lead. Return only valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "understanding": "Unable to parse Delivery Lead review.",
            "mvp_scope": [],
            "phase_2_scope": [],
            "assumptions": [],
            "missing_requirements": [],
            "clarifying_questions": [],
            "recommended_next_steps": []
        }