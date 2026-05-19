from typing import Any, Dict

from agents._common import _chat_json, _safe_dict


FALLBACK_ARCHITECT_PROMPT = """
You are a senior ServiceNow solution architect.
Create a practical architecture/design package from the requirement.
Prefer ServiceNow configuration and OOB capability before customization.
Do not invent integrations unless explicitly mentioned.
Return only valid JSON matching the requested structure.
"""


ARCHITECT_OUTPUT_SCHEMA = """
Return JSON exactly in this structure:
{
  "requirement_summary": "Short summary of the requirement.",
  "solution_design": "Practical ServiceNow solution design.",
  "recommended_app_type": "Service Catalog Item / Existing OOB Module / Custom Scoped Application / Custom scoped application with a Service Catalog intake front door",
  "platform_fit_decision": {
    "recommended_approach": "Recommended OOB/configuration/custom approach.",
    "oob_options_considered": [
      {
        "option": "ServiceNow option/module/pattern considered",
        "fit": "Good Fit / Partial Fit / Poor Fit / Unknown",
        "rationale": "Why this option fits or does not fit"
      }
    ],
    "oob_fit_assessment": "Overall OOB fit assessment.",
    "custom_build_needed": false,
    "customization_required": [],
    "technical_debt": [
      {
        "item": "Debt item",
        "level": "Low / Medium / High",
        "impact": "Maintenance or upgrade impact",
        "mitigation": "Mitigation"
      }
    ],
    "maintenance_impact": [],
    "upgrade_impact": [],
    "licensing_assumptions": [],
    "pros": [],
    "cons": [],
    "final_recommendation": "Final recommendation.",
    "build_readiness_verdict": "Ready / Ready with Assumptions / Needs Discovery / Not Ready"
  },
  "build_readiness_gate": {
    "verdict": "Ready / Ready with Assumptions / Needs Discovery / Not Ready",
    "reason": "Why this verdict was selected.",
    "must_resolve_before_build": [
      "Decision or gap that must be resolved before production build"
    ],
    "safe_to_generate_code": false
  },
  "sensitive_data_controls": {
    "sensitive_data_present": false,
    "data_types": [],
    "field_level_security": [],
    "attachment_security": [],
    "notification_privacy": [],
    "audit_retention": [],
    "encryption_or_masking": [],
    "open_questions": []
  },
  "platform_object_accuracy_notes": [
    "Notes about request/RITM vs task vs approval vs case vs vendor/supplier record modeling."
  ],
  "tables": [
    {
      "table_name": "Table name",
      "purpose": "Purpose",
      "type": "Primary / Related / Configuration / Existing OOB / Catalog Item / Approval / Task / Case / To Validate"
    }
  ],
  "workflow_steps": [
    "Step 1"
  ],
  "risks": [
    {
      "risk": "Risk",
      "mitigation": "Mitigation"
    }
  ],
  "open_questions": [
    "Question 1"
  ]
}
"""


def _fallback_architecture() -> Dict[str, Any]:
    return {
        "requirement_summary": "Architecture could not be generated.",
        "solution_design": "Unable to generate solution design. Check backend logs.",
        "recommended_app_type": "Needs review",
        "platform_fit_decision": {
            "recommended_approach": "Needs architect review.",
            "oob_options_considered": [],
            "oob_fit_assessment": "Platform fit could not be generated.",
            "custom_build_needed": False,
            "customization_required": [],
            "technical_debt": [],
            "maintenance_impact": [],
            "upgrade_impact": [],
            "licensing_assumptions": [],
            "pros": [],
            "cons": [],
            "final_recommendation": "Do not proceed to build until platform fit is reviewed.",
            "build_readiness_verdict": "Needs Discovery",
        },
        "build_readiness_gate": {
            "verdict": "Needs Discovery",
            "reason": "Architecture output was unavailable.",
            "must_resolve_before_build": [
                "Retry architecture generation and confirm platform fit."
            ],
            "safe_to_generate_code": False,
        },
        "sensitive_data_controls": {
            "sensitive_data_present": False,
            "data_types": [],
            "field_level_security": [],
            "attachment_security": [],
            "notification_privacy": [],
            "audit_retention": [],
            "encryption_or_masking": [],
            "open_questions": [],
        },
        "platform_object_accuracy_notes": [
            "Architecture output unavailable. Validate ServiceNow objects manually."
        ],
        "tables": [],
        "workflow_steps": [],
        "risks": [
            {
                "risk": "Architecture agent failed or returned invalid JSON.",
                "mitigation": "Retry generation and review backend logs.",
            }
        ],
        "open_questions": [
            "Architecture output was unavailable. Confirm requirement details manually."
        ],
    }


def _ensure_list(value: Any) -> list:
    return value if isinstance(value, list) else []


def _ensure_dict(value: Any, fallback: Dict[str, Any]) -> Dict[str, Any]:
    return value if isinstance(value, dict) else fallback


def generate_architecture(requirement: str) -> Dict[str, Any]:
    # IMPORTANT: do not use an f-string for the schema block. The JSON braces in
    # the schema cause runtime formatting errors in f-strings and make the
    # Architect Agent fall back even though Python syntax checks pass.
    user_payload = (
        "Business Requirement:\n"
        + str(requirement or "")
        + "\n\n"
        + ARCHITECT_OUTPUT_SCHEMA
    )

    fallback = _fallback_architecture()

    output = _chat_json(
        prompt_name="architect.txt",
        fallback_prompt=FALLBACK_ARCHITECT_PROMPT,
        user_payload=user_payload,
        fallback=fallback,
        temperature=0.12,
    )

    output = _safe_dict(output)

    return {
        "requirement_summary": output.get("requirement_summary") or fallback["requirement_summary"],
        "solution_design": output.get("solution_design") or fallback["solution_design"],
        "recommended_app_type": output.get("recommended_app_type") or fallback["recommended_app_type"],
        "platform_fit_decision": _ensure_dict(
            output.get("platform_fit_decision"), fallback["platform_fit_decision"]
        ),
        "build_readiness_gate": _ensure_dict(
            output.get("build_readiness_gate"), fallback["build_readiness_gate"]
        ),
        "sensitive_data_controls": _ensure_dict(
            output.get("sensitive_data_controls"), fallback["sensitive_data_controls"]
        ),
        "platform_object_accuracy_notes": _ensure_list(
            output.get("platform_object_accuracy_notes")
        ) or fallback["platform_object_accuracy_notes"],
        "tables": _ensure_list(output.get("tables")),
        "workflow_steps": _ensure_list(output.get("workflow_steps")),
        "risks": _ensure_list(output.get("risks")) or fallback["risks"],
        "open_questions": _ensure_list(output.get("open_questions")) or fallback["open_questions"],
    }
