from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def regenerate_section(section: str, requirement: str, current_package: dict, user_instruction: str):
    schemas = {
        "delivery_lead_review": """
{
  "understanding": "",
  "mvp_scope": [],
  "phase_2_scope": [],
  "assumptions": [],
  "missing_requirements": [
    {
      "gap": "",
      "why_it_matters": ""
    }
  ],
  "clarifying_questions": [],
  "recommended_next_steps": []
}
""",
        "solution_design": """
{
  "requirement_summary": "",
  "solution_design": "",
  "recommended_app_type": "",
  "tables": [
    {
      "table_name": "",
      "purpose": "",
      "type": ""
    }
  ],
  "workflow_steps": [],
  "risks": [
    {
      "risk": "",
      "mitigation": ""
    }
  ],
  "open_questions": []
}
""",
        "stories": """
{
  "epic": "",
  "stories": [
    {
      "title": "",
      "persona": "",
      "story": "",
      "acceptance_criteria": [],
      "priority": "High / Medium / Low",
      "notes": ""
    }
  ],
  "story_assumptions": [],
  "story_dependencies": []
}
""",
        "developer": """
{
  "implementation_summary": "",
  "service_now_objects": [
    {
      "object_type": "",
      "name": "",
      "purpose": ""
    }
  ],
  "flow_designer_notes": [
    {
      "flow_name": "",
      "trigger": "",
      "steps": []
    }
  ],
  "business_rules": [
    {
      "name": "",
      "when": "",
      "condition": "",
      "purpose": ""
    }
  ],
  "ui_policies": [],
  "acl_notes": [],
  "notification_notes": [],
  "deployment_notes": [],
  "technical_assumptions": []
}
""",
        "qa": """
{
  "test_strategy": "",
  "test_scenarios": [],
  "test_cases": [
    {
      "id": "TC001",
      "title": "",
      "type": "Positive / Negative / Regression / Security / UAT",
      "preconditions": [],
      "steps": [],
      "expected_result": "",
      "priority": "High / Medium / Low"
    }
  ],
  "uat_cases": [
    {
      "id": "UAT001",
      "title": "",
      "persona": "",
      "steps": [],
      "expected_result": ""
    }
  ],
  "edge_cases": [],
  "test_data_needs": [],
  "regression_areas": []
}
""",
        "process_diagram": """
{
  "title": "",
  "summary": "",
  "mermaid_code": "flowchart TD\\nA[Start] --> B[Next Step]",
  "diagram_notes": []
}
""",
        "quality_score": """
{
  "overall_score": 0,
  "completeness_score": 0,
  "risk_score": 0,
  "readiness_score": 0,
  "rating": "Strong / Good / Needs Work / Weak",
  "summary": "",
  "score_rationale": {
    "completeness": "",
    "risk": "",
    "readiness": ""
  },
  "score_caps_applied": [],
  "strengths": [],
  "weaknesses": [],
  "recommended_fixes": [],
  "build_readiness_verdict": "Ready / Conditionally Ready / Not Ready"
}
"""
    }

    if section not in schemas:
        return {
            "error": f"Unsupported section: {section}"
        }

    prompt = f"""
You are part of a Virtual ServiceNow Delivery Pod.

Regenerate ONLY this section:
{section}

User instruction:
{user_instruction}

Business requirement:
{requirement}

Current full package:
{json.dumps(current_package, indent=2)}

Rules:
- Return ONLY valid JSON.
- Do not include markdown.
- Do not include explanations outside JSON.
- Keep the output consistent with the rest of the current package.
- Improve the selected section based on the user instruction.
- Do not modify unrelated sections.
- Do not invent integrations unless explicitly mentioned.
- Use practical ServiceNow delivery language.

Return this JSON structure exactly:
{schemas[section]}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior ServiceNow delivery specialist. Return only valid JSON."
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
            "error": "Unable to parse regenerated section output.",
            "raw_output": content
        }