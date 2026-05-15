from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_developer_notes(requirement: str, architecture: dict, story_output: dict):
    prompt = f"""
You are a senior ServiceNow developer / technical lead.

Create practical implementation notes from the business requirement, architecture, and user stories.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Do not say "certainly".
Do not say "if you want".
Do not invent integrations unless the user mentioned them.
Prefer ServiceNow configuration before customization.
Clearly flag where scripting/customization may be required.

Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Story Context:
{json.dumps(story_output, indent=2)}

Return this JSON structure exactly:

{{
  "implementation_summary": "Short technical implementation summary.",
  "service_now_objects": [
    {{
      "object_type": "Table / Field / Flow / Business Rule / UI Policy / ACL / Notification / Scheduled Job / Module",
      "name": "Object name",
      "purpose": "What it does"
    }}
  ],
  "flow_designer_notes": [
    {{
      "flow_name": "Flow name",
      "trigger": "Trigger condition",
      "steps": [
        "Step 1",
        "Step 2"
      ]
    }}
  ],
  "business_rules": [
    {{
      "name": "Business rule name",
      "when": "Before / After / Async / Display",
      "condition": "When it should run",
      "purpose": "What it does"
    }}
  ],
  "ui_policies": [
    {{
      "name": "UI policy name",
      "condition": "Condition",
      "actions": [
        "Action 1"
      ]
    }}
  ],
  "acl_notes": [
    "ACL note 1"
  ],
  "notification_notes": [
    "Notification note 1"
  ],
  "deployment_notes": [
    "Deployment note 1"
  ],
  "technical_assumptions": [
    "Assumption 1"
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior ServiceNow developer. Return only valid JSON."
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
            "implementation_summary": "Unable to parse developer output.",
            "service_now_objects": [],
            "flow_designer_notes": [],
            "business_rules": [],
            "ui_policies": [],
            "acl_notes": [],
            "notification_notes": [],
            "deployment_notes": [],
            "technical_assumptions": []
        }