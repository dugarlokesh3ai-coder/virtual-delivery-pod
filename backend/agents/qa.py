from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_qa_package(requirement: str, architecture: dict, story_output: dict, developer_output: dict):
    prompt = f"""
You are a senior ServiceNow QA lead.

Create QA and UAT artifacts from the business requirement, architecture, stories, and technical implementation notes.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Do not say "certainly".
Do not say "if you want".
Test cases must be practical and executable by a QA analyst or UAT tester.
Every test case must include steps and expected result.

Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Story Context:
{json.dumps(story_output, indent=2)}

Developer Context:
{json.dumps(developer_output, indent=2)}

Return this JSON structure exactly:

{{
  "test_strategy": "Short QA strategy.",
  "test_scenarios": [
    "Scenario 1"
  ],
  "test_cases": [
    {{
      "id": "TC001",
      "title": "Test case title",
      "type": "Positive / Negative / Regression / Security / UAT",
      "preconditions": [
        "Precondition 1"
      ],
      "steps": [
        "Step 1",
        "Step 2"
      ],
      "expected_result": "Expected result",
      "priority": "High / Medium / Low"
    }}
  ],
  "uat_cases": [
    {{
      "id": "UAT001",
      "title": "UAT case title",
      "persona": "Business user persona",
      "steps": [
        "Step 1"
      ],
      "expected_result": "Expected result"
    }}
  ],
  "edge_cases": [
    "Edge case 1"
  ],
  "test_data_needs": [
    "Test data need 1"
  ],
  "regression_areas": [
    "Regression area 1"
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior ServiceNow QA lead. Return only valid JSON."
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
            "test_strategy": "Unable to parse QA output.",
            "test_scenarios": [],
            "test_cases": [],
            "uat_cases": [],
            "edge_cases": [],
            "test_data_needs": [],
            "regression_areas": []
        }