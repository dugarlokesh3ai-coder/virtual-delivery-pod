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

QA_FALLBACK = {
    "test_strategy": "QA package could not be generated or parsed.",
    "test_scenarios": [],
    "test_cases": [],
    "uat_cases": [],
    "edge_cases": [],
    "test_data_needs": [],
    "regression_areas": [
        "QA agent response could not be generated or parsed as valid JSON."
    ],
}

DEFAULT_QA_PROMPT = """
You are a senior ServiceNow QA lead.

Create a practical QA package from the business requirement, architecture, stories, and developer notes.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Do not invent integrations unless the user mentioned them.
Include positive, negative, edge, security, regression, and UAT coverage where relevant.

Return this JSON structure exactly:
{
  "test_strategy": "Short QA strategy.",
  "test_scenarios": [
    "Scenario 1"
  ],
  "test_cases": [
    {
      "id": "TC-001",
      "title": "Test case title",
      "type": "Functional / Negative / Security / Regression / Integration / Workflow",
      "preconditions": [
        "Precondition 1"
      ],
      "steps": [
        "Step 1",
        "Step 2"
      ],
      "expected_result": "Expected result",
      "priority": "High / Medium / Low"
    }
  ],
  "uat_cases": [
    {
      "id": "UAT-001",
      "title": "UAT case title",
      "persona": "Business user / Approver / Admin / Agent",
      "steps": [
        "Step 1"
      ],
      "expected_result": "Expected result"
    }
  ],
  "edge_cases": [
    "Edge case 1"
  ],
  "test_data_needs": [
    "Data need 1"
  ],
  "regression_areas": [
    "Regression area 1"
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


def normalize_qa_output(output):
    if not isinstance(output, dict):
        return QA_FALLBACK

    normalized = {
        "test_strategy": str(output.get("test_strategy") or ""),
        "test_scenarios": safe_list(output.get("test_scenarios")),
        "test_cases": safe_list(output.get("test_cases")),
        "uat_cases": safe_list(output.get("uat_cases")),
        "edge_cases": safe_list(output.get("edge_cases")),
        "test_data_needs": safe_list(output.get("test_data_needs")),
        "regression_areas": safe_list(output.get("regression_areas")),
    }

    if not normalized["test_strategy"].strip():
        normalized["test_strategy"] = "Validate the generated ServiceNow process across workflow, security, notifications, reporting, and UAT scenarios."

    return normalized


def get_system_prompt():
    if load_prompt is None:
        return DEFAULT_QA_PROMPT

    try:
        prompt = load_prompt("qa.txt")
        if prompt and prompt.strip():
            return prompt
    except Exception as error:
        print(f"Unable to load qa.txt. Using inline fallback prompt. Error: {error}")

    return DEFAULT_QA_PROMPT


def generate_qa_package(
    requirement: str,
    architecture: dict,
    story_output: dict,
    developer_output: dict,
):
    system_prompt = get_system_prompt()

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

        return normalize_qa_output(parsed)

    except Exception as error:
        print("\n========== QA Agent FAILED ==========")
        print(str(error))
        traceback.print_exc()
        print("=====================================\n")
        return QA_FALLBACK
