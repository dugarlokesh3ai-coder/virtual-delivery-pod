from typing import Any, Dict, List

from agents._common import _chat_json, _safe_dict


FALLBACK_ARCHITECT_PROMPT = """
You are a senior ServiceNow solution architect.
Create a practical architecture/design package from the requirement.
Prefer ServiceNow configuration and OOB capability before customization.
Do not invent integrations or table names unless explicitly mentioned.
Return only valid JSON matching the requested structure.
"""


ARCHITECT_OUTPUT_SCHEMA = """
Return JSON exactly in this structure:
{
  "requirement_summary": "Short summary of the requirement.",
  "solution_design": "Practical ServiceNow solution design. This field is mandatory; never leave it blank.",
  "recommended_app_type": "Service Catalog Item / Existing OOB Module / Custom Scoped Application / Custom scoped application with a Service Catalog intake front door / Needs Discovery",
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
    "Notes about request/RITM vs task vs approval vs case vs downstream master record modeling."
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
        "solution_design": "Architecture output was unavailable. Re-run the Architect Agent before treating this package as build-ready.",
        "recommended_app_type": "Needs Discovery",
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


def _non_empty_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    bad_values = {
        "unable to generate solution design. check backend logs.",
        "check backend logs.",
        "",
    }
    return "" if text.lower() in bad_values else text


def _list_text(values: List[Any], limit: int = 5) -> str:
    items = []
    for value in values[:limit]:
        if isinstance(value, dict):
            table = value.get("table_name") or value.get("name") or value.get("option") or value.get("risk")
            purpose = value.get("purpose") or value.get("rationale") or value.get("mitigation") or ""
            item = f"{table}: {purpose}" if table else purpose
        else:
            item = str(value)
        item = item.strip()
        if item:
            items.append(item)
    return "; ".join(items)


def _build_solution_design_fallback(output: Dict[str, Any], fallback: Dict[str, Any]) -> str:
    summary = _non_empty_text(output.get("requirement_summary")) or fallback["requirement_summary"]
    app_type = _non_empty_text(output.get("recommended_app_type")) or fallback["recommended_app_type"]
    platform_fit = _ensure_dict(output.get("platform_fit_decision"), fallback["platform_fit_decision"])
    recommended = _non_empty_text(platform_fit.get("recommended_approach")) or "Use the ServiceNow pattern identified in the platform fit decision."
    workflow = _list_text(_ensure_list(output.get("workflow_steps")), 6)
    tables = _list_text(_ensure_list(output.get("tables")), 6)
    gate = _ensure_dict(output.get("build_readiness_gate"), fallback["build_readiness_gate"])
    verdict = _non_empty_text(gate.get("verdict")) or "Needs Discovery"

    parts = [
        f"Recommended design: {recommended}",
        f"App type: {app_type}.",
        f"Requirement summary: {summary}",
    ]
    if tables:
        parts.append(f"Primary ServiceNow objects: {tables}.")
    if workflow:
        parts.append(f"Core workflow: {workflow}.")
    parts.append(f"Build readiness: {verdict}. Do not treat this design as production-ready until unresolved platform, security, routing, licensing, and data-model decisions are confirmed.")
    return " ".join(parts)


def _normalize_platform_notes(notes: List[Any]) -> List[str]:
    normalized = [str(item).strip() for item in notes if str(item).strip()]
    required = [
        "Use sysapproval_approver for approval records generated by Flow Designer approval actions; do not model approvals as custom task tables.",
        "Use platform audit history/sys_audit for audited field changes, sysapproval_approver for approval decisions, and sys_journal_field only for comments/work notes or other journal entries.",
        "Treat before-query Business Rules as a last resort after ACLs, user criteria, report/list filters, and role/group visibility controls.",
    ]
    for item in required:
        if not any(item.lower() in existing.lower() for existing in normalized):
            normalized.append(item)
    return normalized



def _normalize_build_readiness_gate(gate: Dict[str, Any], app_type: str, design: str) -> Dict[str, Any]:
    gate = dict(gate or {})
    verdict = _non_empty_text(gate.get("verdict")) or "Needs Discovery"
    combined = f"{app_type} {design}".lower()
    is_clear_oob_pattern = any(token in combined for token in ["service catalog", "flow designer", "request management", "oob", "out-of-box"])
    is_blocked = any(token in verdict.lower() for token in ["not ready", "needs discovery", "blocked"])

    # For clear OOB/configuration patterns, assumptions should block production deployment,
    # not implementation guidance. Avoid confusing Ready with Assumptions + safe=false.
    if verdict.lower() == "ready with assumptions" and is_clear_oob_pattern and not is_blocked:
        gate["safe_to_generate_code"] = True
        reason = _non_empty_text(gate.get("reason"))
        if reason and "production" not in reason.lower():
            gate["reason"] = reason + " Implementation guidance may be generated, but production build/deployment requires confirming open assumptions."
    elif is_blocked:
        gate["safe_to_generate_code"] = False

    gate["verdict"] = verdict
    return gate

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

    solution_design = (
        _non_empty_text(output.get("solution_design"))
        or _non_empty_text(output.get("architecture_summary"))
        or _non_empty_text(output.get("design_summary"))
        or _build_solution_design_fallback(output, fallback)
    )

    platform_notes = _normalize_platform_notes(
        _ensure_list(output.get("platform_object_accuracy_notes"))
        or fallback["platform_object_accuracy_notes"]
    )

    recommended_app_type = output.get("recommended_app_type") or fallback["recommended_app_type"]
    raw_gate = _ensure_dict(output.get("build_readiness_gate"), fallback["build_readiness_gate"])
    normalized_gate = _normalize_build_readiness_gate(raw_gate, recommended_app_type, solution_design)

    return {
        "requirement_summary": output.get("requirement_summary") or fallback["requirement_summary"],
        "solution_design": solution_design,
        "recommended_app_type": recommended_app_type,
        "platform_fit_decision": _ensure_dict(
            output.get("platform_fit_decision"), fallback["platform_fit_decision"]
        ),
        "build_readiness_gate": normalized_gate,
        "sensitive_data_controls": _ensure_dict(
            output.get("sensitive_data_controls"), fallback["sensitive_data_controls"]
        ),
        "platform_object_accuracy_notes": platform_notes,
        "tables": _ensure_list(output.get("tables")),
        "workflow_steps": _ensure_list(output.get("workflow_steps")),
        "risks": _ensure_list(output.get("risks")) or fallback["risks"],
        "open_questions": _ensure_list(output.get("open_questions")) or fallback["open_questions"],
    }
