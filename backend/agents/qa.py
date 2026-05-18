import json
from typing import Any, Dict

from agents._common import _chat_json, _safe_dict


FALLBACK_QA_PROMPT = """
You are a senior ServiceNow QA lead.
Create a practical QA and UAT package from requirement, architecture, stories, and developer notes.
Respect exact threshold language and requirement wording.
Return only valid JSON.
"""


def _fallback_qa_package() -> Dict[str, Any]:
    return {
        "test_strategy": "QA package could not be generated.",
        "test_scenarios": [],
        "test_cases": [],
        "uat_cases": [],
        "edge_cases": [
            "QA agent failed or returned invalid JSON."
        ],
        "test_data_needs": [],
        "regression_areas": [
            "Review package manually before release."
        ],
    }


def generate_qa_package(
    requirement: str,
    architecture: dict,
    story_output: dict,
    developer_output: dict,
) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Story Context:
{json.dumps(story_output, indent=2)}

Developer Context:
{json.dumps(developer_output, indent=2)}

Return JSON exactly in this structure:
{{
  "test_strategy": "Overall test strategy.",
  "test_scenarios": [
    "Scenario 1"
  ],
  "test_cases": [
    {{
      "id": "TC-001",
      "title": "Test case title",
      "type": "Functional / Negative / Security / Regression / Boundary / Integration",
      "preconditions": [
        "Precondition 1"
      ],
      "steps": [
        "Step 1"
      ],
      "expected_result": "Expected result",
      "priority": "High / Medium / Low"
    }}
  ],
  "uat_cases": [
    {{
      "id": "UAT-001",
      "title": "UAT case title",
      "persona": "Business persona",
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

    output = _chat_json(
        prompt_name="qa.txt",
        fallback_prompt=FALLBACK_QA_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_qa_package(),
        temperature=0.12,
    )

    output = _safe_dict(output)
    fallback = _fallback_qa_package()

    return {
        "test_strategy": output.get("test_strategy") or fallback["test_strategy"],
        "test_scenarios": output.get("test_scenarios") if isinstance(output.get("test_scenarios"), list) else [],
        "test_cases": output.get("test_cases") if isinstance(output.get("test_cases"), list) else [],
        "uat_cases": output.get("uat_cases") if isinstance(output.get("uat_cases"), list) else [],
        "edge_cases": output.get("edge_cases") if isinstance(output.get("edge_cases"), list) else fallback["edge_cases"],
        "test_data_needs": output.get("test_data_needs") if isinstance(output.get("test_data_needs"), list) else [],
        "regression_areas": output.get("regression_areas") if isinstance(output.get("regression_areas"), list) else fallback["regression_areas"],
    }
