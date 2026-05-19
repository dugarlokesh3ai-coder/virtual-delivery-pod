import json
from typing import Any, Dict, List

from agents._common import _chat_json, _safe_dict


FALLBACK_QA_PROMPT = """
You are a senior ServiceNow QA lead.
Create a practical QA and UAT package from requirement, architecture, stories, and developer notes.
Map tests to story IDs and delivery epics when available.
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


def _safe_list(value: Any) -> List[Any]:
    return value if isinstance(value, list) else []


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

Use story_id values from story_groups/stories and related_story_ids from developer output whenever possible.

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
      "type": "Functional / Negative / Security / Regression / Boundary / Integration / Notification / Reporting",
      "preconditions": [
        "Precondition 1"
      ],
      "steps": [
        "Step 1"
      ],
      "expected_result": "Expected result",
      "priority": "High / Medium / Low",
      "related_story_ids": ["WF-001"],
      "epic": "Workflow / Routing / Approvals"
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
      "expected_result": "Expected result",
      "related_story_ids": ["UX-001"],
      "epic": "Forms / UX / Catalog Experience"
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
        "test_scenarios": _safe_list(output.get("test_scenarios")),
        "test_cases": _safe_list(output.get("test_cases")),
        "uat_cases": _safe_list(output.get("uat_cases")),
        "edge_cases": _safe_list(output.get("edge_cases")) or fallback["edge_cases"],
        "test_data_needs": _safe_list(output.get("test_data_needs")),
        "regression_areas": _safe_list(output.get("regression_areas")) or fallback["regression_areas"],
    }
