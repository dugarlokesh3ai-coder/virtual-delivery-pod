import json
from typing import Any, Dict

from agents._common import _chat_json, _safe_dict


FALLBACK_ARCHITECT_PROMPT = """
You are a senior ServiceNow solution architect.
Create a practical architecture/design package from the requirement.
Prefer ServiceNow OOB capabilities, module reuse, Service Catalog, Flow Designer, and configuration before customization.
Before recommending a custom scoped app, evaluate OOB/module fit, licensing assumptions, technical debt, maintenance, and upgrade impact.
For over-scoped or unrealistic requests, mark build readiness as Not Ready or Needs Discovery and recommend phased delivery.
Do not invent integrations unless explicitly mentioned.
Return only valid JSON matching the requested structure.
"""


def _fallback_platform_fit() -> Dict[str, Any]:
    return {
        "recommended_approach": "Needs architect review.",
        "oob_options_considered": [],
        "oob_fit_assessment": "Platform fit decision unavailable. Review OOB/module fit manually before build.",
        "custom_build_needed": False,
        "customization_required": [],
        "technical_debt": [
            {
                "item": "Platform fit decision unavailable",
                "level": "Medium",
                "impact": "Build team may over-customize or select the wrong ServiceNow pattern.",
                "mitigation": "Run architect review and confirm OOB/module fit, licensing, and build readiness."
            }
        ],
        "maintenance_impact": [
            "Unknown until OOB vs custom approach is confirmed."
        ],
        "upgrade_impact": [
            "Unknown until customizations are confirmed."
        ],
        "licensing_assumptions": [
            "ServiceNow licensing/module availability must be confirmed."
        ],
        "pros": [],
        "cons": [
            "Architecture output did not include a platform-fit decision."
        ],
        "final_recommendation": "Do not proceed to build handoff until platform-fit decision is completed.",
        "build_readiness_verdict": "Needs Discovery",
    }


def _fallback_architecture() -> Dict[str, Any]:
    return {
        "requirement_summary": "Architecture could not be generated.",
        "solution_design": "Unable to generate solution design. Check backend logs.",
        "recommended_app_type": "Needs review",
        "platform_fit_decision": _fallback_platform_fit(),
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


def _normalize_platform_fit(value: Any) -> Dict[str, Any]:
    fallback = _fallback_platform_fit()

    if not isinstance(value, dict):
        return fallback

    technical_debt = value.get("technical_debt")
    if not isinstance(technical_debt, list):
        technical_debt = []

    return {
        "recommended_approach": value.get("recommended_approach") or fallback["recommended_approach"],
        "oob_options_considered": value.get("oob_options_considered") if isinstance(value.get("oob_options_considered"), list) else [],
        "oob_fit_assessment": value.get("oob_fit_assessment") or "",
        "custom_build_needed": bool(value.get("custom_build_needed", False)),
        "customization_required": value.get("customization_required") if isinstance(value.get("customization_required"), list) else [],
        "technical_debt": technical_debt,
        "maintenance_impact": value.get("maintenance_impact") if isinstance(value.get("maintenance_impact"), list) else [],
        "upgrade_impact": value.get("upgrade_impact") if isinstance(value.get("upgrade_impact"), list) else [],
        "licensing_assumptions": value.get("licensing_assumptions") if isinstance(value.get("licensing_assumptions"), list) else [],
        "pros": value.get("pros") if isinstance(value.get("pros"), list) else [],
        "cons": value.get("cons") if isinstance(value.get("cons"), list) else [],
        "final_recommendation": value.get("final_recommendation") or "",
        "build_readiness_verdict": value.get("build_readiness_verdict") or "Needs Discovery",
    }


def generate_architecture(requirement: str) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Return JSON exactly in this structure:
{{
  "requirement_summary": "Short summary of the requirement.",
  "recommended_app_type": "Service Catalog Item / Existing OOB Module / Custom Scoped Application / Custom scoped application with Service Catalog intake front door / Needs Discovery",
  "platform_fit_decision": {{
    "recommended_approach": "Recommended ServiceNow approach.",
    "oob_options_considered": [
      {{
        "option": "ServiceNow OOB module/feature or platform pattern considered",
        "fit": "Good Fit / Partial Fit / Poor Fit / Unknown",
        "rationale": "Why this option does or does not fit"
      }}
    ],
    "oob_fit_assessment": "Overall OOB fit assessment.",
    "custom_build_needed": false,
    "customization_required": [
      "Configuration/customization item"
    ],
    "technical_debt": [
      {{
        "item": "Debt or maintenance item",
        "level": "Low / Medium / High",
        "impact": "Maintenance or support impact",
        "mitigation": "Mitigation"
      }}
    ],
    "maintenance_impact": [
      "Maintenance impact"
    ],
    "upgrade_impact": [
      "Upgrade impact"
    ],
    "licensing_assumptions": [
      "License/module assumption"
    ],
    "pros": [
      "Pro"
    ],
    "cons": [
      "Con"
    ],
    "final_recommendation": "Final recommendation and rationale.",
    "build_readiness_verdict": "Ready / Needs Discovery / Not Ready"
  }},
  "solution_design": "Practical ServiceNow solution design.",
  "tables": [
    {{
      "table_name": "Table name",
      "purpose": "Purpose",
      "type": "Core / Configuration / Task / M2M / Extension / Existing OOB / Catalog Item"
    }}
  ],
  "workflow_steps": [
    "Step 1"
  ],
  "risks": [
    {{
      "risk": "Risk",
      "mitigation": "Mitigation"
    }}
  ],
  "open_questions": [
    "Question 1"
  ]
}}
"""

    output = _chat_json(
        prompt_name="architect.txt",
        fallback_prompt=FALLBACK_ARCHITECT_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_architecture(),
        temperature=0.08,
    )

    output = _safe_dict(output)
    fallback = _fallback_architecture()

    platform_fit = (
        output.get("platform_fit_decision")
        or output.get("oob_vs_custom_decision")
        or output.get("service_now_platform_fit")
    )

    return {
        "requirement_summary": output.get("requirement_summary") or fallback["requirement_summary"],
        "solution_design": output.get("solution_design") or fallback["solution_design"],
        "recommended_app_type": output.get("recommended_app_type") or fallback["recommended_app_type"],
        "platform_fit_decision": _normalize_platform_fit(platform_fit),
        "tables": output.get("tables") if isinstance(output.get("tables"), list) else [],
        "workflow_steps": output.get("workflow_steps") if isinstance(output.get("workflow_steps"), list) else [],
        "risks": output.get("risks") if isinstance(output.get("risks"), list) else fallback["risks"],
        "open_questions": output.get("open_questions") if isinstance(output.get("open_questions"), list) else fallback["open_questions"],
    }
