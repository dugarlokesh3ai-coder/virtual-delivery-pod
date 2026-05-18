from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import re
import traceback

try:
    from utils.prompt_loader import load_prompt
except Exception:
    load_prompt = None

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DEVELOPER_FALLBACK = {
    "implementation_summary": "Developer notes could not be generated or parsed.",
    "service_now_objects": [],
    "flow_designer_notes": [],
    "business_rules": [],
    "ui_policies": [],
    "acl_notes": [],
    "notification_notes": [],
    "deployment_notes": [],
    "technical_assumptions": [
        "Developer agent response could not be generated or parsed as valid JSON."
    ],
}

DEFAULT_DEVELOPER_PROMPT = """
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

Return this JSON structure exactly:
{
  "implementation_summary": "Short technical implementation summary.",
  "service_now_objects": [
    {
      "object_type": "Table / Field / Flow / Business Rule / UI Policy / ACL / Notification / Scheduled Job / Module",
      "name": "Object name",
      "purpose": "What it does"
    }
  ],
  "flow_designer_notes": [
    {
      "flow_name": "Flow name",
      "trigger": "Trigger condition",
      "steps": [
        "Step 1",
        "Step 2"
      ]
    }
  ],
  "business_rules": [
    {
      "name": "Business rule name",
      "when": "Before / After / Async / Display",
      "condition": "When it should run",
      "purpose": "What it does"
    }
  ],
  "ui_policies": [
    {
      "name": "UI policy name",
      "condition": "Condition",
      "actions": [
        "Action 1"
      ]
    }
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
}
"""


def extract_json(content: str):
    if not content:
        return None

    cleaned = content.strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        return None

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def safe_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def normalize_developer_output(output):
    if not isinstance(output, dict):
        return DEVELOPER_FALLBACK

    normalized = {
        "implementation_summary": str(output.get("implementation_summary") or ""),
        "service_now_objects": safe_list(output.get("service_now_objects")),
        "flow_designer_notes": safe_list(output.get("flow_designer_notes")),
        "business_rules": safe_list(output.get("business_rules")),
        "ui_policies": safe_list(output.get("ui_policies")),
        "acl_notes": safe_list(output.get("acl_notes")),
        "notification_notes": safe_list(output.get("notification_notes")),
        "deployment_notes": safe_list(output.get("deployment_notes")),
        "technical_assumptions": safe_list(output.get("technical_assumptions")),
    }

    if not normalized["implementation_summary"].strip():
        normalized["implementation_summary"] = "Technical implementation notes generated from the package context."

    return normalized


def get_system_prompt():
    if load_prompt is None:
        return DEFAULT_DEVELOPER_PROMPT

    try:
        prompt = load_prompt("developer.txt")
        if prompt and prompt.strip():
            return prompt
    except Exception as error:
        print(f"Unable to load developer.txt. Using inline fallback prompt. Error: {error}")

    return DEFAULT_DEVELOPER_PROMPT


def generate_developer_notes(requirement: str, architecture: dict, story_output: dict):
    system_prompt = get_system_prompt()

    user_prompt = f"""
Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Story Context:
{json.dumps(story_output, indent=2)}

Return only valid JSON using the required schema.
"""

    try:
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
        parsed = extract_json(content)

        return normalize_developer_output(parsed)

    except Exception as error:
        print("\n========== Developer Agent FAILED ==========")
        print(str(error))
        traceback.print_exc()
        print("============================================\n")
        return DEVELOPER_FALLBACK
