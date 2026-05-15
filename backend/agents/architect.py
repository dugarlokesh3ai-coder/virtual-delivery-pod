from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_architecture(requirement: str):
    prompt = f"""
You are a senior ServiceNow solution architect.

Analyze the business requirement and return ONLY valid JSON.

Do not include markdown.
Do not include explanations outside JSON.
Do not say "certainly".
Do not say "if you want".
Do not invent integrations unless the user mentioned them.
Use practical ServiceNow implementation language.

Requirement:
{requirement}

Return this JSON structure exactly:

{{
  "requirement_summary": "Short summary of the business requirement.",
  "solution_design": "Practical ServiceNow solution design.",
  "recommended_app_type": "Scoped app / OOB module / App Engine / Unknown",
  "tables": [
    {{
      "table_name": "Proposed table name",
      "purpose": "What this table stores",
      "type": "Custom / OOB / Config / Reference"
    }}
  ],
  "workflow_steps": [
    "Step 1",
    "Step 2"
  ],
  "risks": [
    {{
      "risk": "Risk description",
      "mitigation": "Mitigation"
    }}
  ],
  "open_questions": [
    "Question 1"
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior ServiceNow solution architect. Return only valid JSON."
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
            "requirement_summary": "Unable to parse structured architecture output.",
            "solution_design": content,
            "recommended_app_type": "Unknown",
            "tables": [],
            "workflow_steps": [],
            "risks": [],
            "open_questions": []
        }