from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import re
from pathlib import Path
from typing import Any, Dict, List

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DEFAULT_PLAN = {
    "project_plan_summary": {
        "recommended_delivery_approach": "Estimate with assumptions",
        "estimated_duration_weeks": None,
        "target_deployment_feasibility": "Needs review",
        "complexity": "Unknown",
        "confidence_level": "Low",
        "summary": "Project plan could not be parsed. Review manually.",
    },
    "total_loe": {"low_hours": None, "likely_hours": None, "high_hours": None},
    "cost_estimate": {
        "implementation_low": None,
        "implementation_likely": None,
        "implementation_high": None,
        "hypercare_cost": None,
        "monthly_maintenance_cost": None,
        "first_year_total": None,
    },
    "phase_plan": [],
    "milestone_schedule": [],
    "role_allocation": [],
    "hypercare_plan": {},
    "maintenance_plan": {},
    "assumptions": [],
    "exclusions": [],
    "timeline_risks": [],
    "cost_risks": [],
    "mvp_scope_adjustments_to_hit_date": [],
    "recommended_next_steps": [],
}


def _extract_json(content: str):
    if not content:
        return None
    content = content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", content)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _read_prompt() -> str:
    path = Path(__file__).resolve().parent.parent / "prompts" / "project_manager.txt"
    if path.exists():
        return path.read_text()
    return """
You are a senior ServiceNow Project Manager and Delivery Lead.
Create an estimate with assumptions for timeline, LOE, cost, SIT, UAT, hypercare, and maintenance.
Return only valid JSON matching the requested schema.
"""


def _safe_list(value: Any) -> List[Any]:
    return value if isinstance(value, list) else []


def _num(value: Any, default: float = 0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except Exception:
        return default


def _complexity_factor(current_package: Dict[str, Any]) -> float:
    stories = len(_safe_list(current_package.get("stories")))
    tech_objects = len(_safe_list((current_package.get("developer") or {}).get("service_now_objects")))
    test_cases = len(_safe_list((current_package.get("qa") or {}).get("test_cases")))
    open_questions = len(_safe_list(current_package.get("open_questions")))
    decisions = len(_safe_list((current_package.get("agent_review") or {}).get("consolidated_decisions_needed")))
    build_blockers = len(_safe_list((current_package.get("build_readiness_gate") or {}).get("must_resolve_before_build")))

    factor = 1.0
    if stories >= 8:
        factor += 0.20
    if tech_objects >= 12:
        factor += 0.20
    if test_cases >= 20:
        factor += 0.10
    if open_questions + decisions + build_blockers >= 6:
        factor += 0.25
    if (current_package.get("build_readiness_gate") or {}).get("safe_to_generate_code") is False:
        factor += 0.15
    return min(factor, 1.9)


def _rate_map(planning_inputs: Dict[str, Any]) -> Dict[str, float]:
    rates = {}
    for role in _safe_list(planning_inputs.get("role_rates")):
        name = str(role.get("role") or "Role")
        rates[name] = _num(role.get("hourly_rate"), 0)
    return rates


def _weighted_rate(planning_inputs: Dict[str, Any]) -> float:
    total_weighted = 0.0
    total_people = 0.0
    for role in _safe_list(planning_inputs.get("role_rates")):
        count = max(_num(role.get("count"), 1), 0)
        rate = _num(role.get("hourly_rate"), 0)
        total_weighted += count * rate
        total_people += count
    return total_weighted / total_people if total_people else 100.0



def _package_profile(current_package: Dict[str, Any]) -> Dict[str, Any]:
    app_type = str(current_package.get("recommended_app_type") or "").lower()
    design_text = " ".join([
        str(current_package.get("solution_design") or ""),
        str(current_package.get("requirement_summary") or ""),
        str(((current_package.get("platform_fit_decision") or {}) or {}).get("recommended_approach") or ""),
    ]).lower()
    stories = len(_safe_list(current_package.get("stories")))
    tech_objects = len(_safe_list((current_package.get("developer") or {}).get("service_now_objects")))
    flows = len(_safe_list((current_package.get("developer") or {}).get("flow_designer_notes")))
    has_custom_app = bool(re.search(r"scoped|custom application|custom app", app_type + " " + design_text))
    is_catalog = bool(re.search(r"catalog|service catalog|sc_cat_item|request item", app_type + " " + design_text))
    has_integration = bool(re.search(r"integration|api|external|automatic provisioning", design_text))

    # Simple catalog items often have many notification/QA stories, but remain low complexity
    # when they use OOB Service Catalog + Flow Designer and no integrations/custom app.
    if is_catalog and not has_custom_app and not has_integration and stories <= 14 and tech_objects <= 18 and flows <= 4:
        return {"complexity": "Low", "likely_weeks": 5.0, "likely_hours": 120}
    if has_custom_app or stories >= 14 or tech_objects >= 20:
        return {"complexity": "Medium", "likely_weeks": 8.0, "likely_hours": 360}
    return {"complexity": "Medium", "likely_weeks": 7.0, "likely_hours": 240}


def _role_rate(planning_inputs: Dict[str, Any], role_name: str, fallback: float = 100.0) -> float:
    for role in _safe_list(planning_inputs.get("role_rates")):
        if str(role.get("role") or "").lower() == role_name.lower():
            return _num(role.get("hourly_rate"), fallback)
    return fallback


def _phase_cost(loe_hours_by_role: Dict[str, Any], planning_inputs: Dict[str, Any]) -> int:
    return round(sum(_num(hours, 0) * _role_rate(planning_inputs, role) for role, hours in (loe_hours_by_role or {}).items()))


def _fallback_phases(current_package: Dict[str, Any], planning_inputs: Dict[str, Any], likely_hours: float) -> List[Dict[str, Any]]:
    profile = _package_profile(current_package)
    is_low = profile["complexity"] == "Low"
    phase_specs = [
        ("Phase 0: Discovery / Decisions", 0.5, "Confirm approval owners, support group, notifications, and MVP scope.", ["Confirm approvers and assignment group", "Confirm notification expectations", "Validate OOB approach"]),
        ("Phase 1: Catalog Foundation", 1.0, "Configure the catalog item, variables, and basic request capture.", ["Build catalog item", "Configure access type variable", "Validate request record data"]),
        ("Phase 2: Approvals and Fulfillment", 1.0, "Configure approval routing, rejection handling, and fulfillment task creation.", ["Configure manager approval", "Configure conditional app owner approval", "Configure fulfillment task"]),
        ("Phase 3: Notifications and Security Review", 0.75, "Configure lifecycle notifications and validate standard access behavior.", ["Configure notifications", "Review standard visibility", "Validate audit trail"]),
        ("Phase 4: SIT / UAT / Fixes", 1.0, "Run SIT, support UAT, and fix defects.", ["Execute SIT", "Support UAT", "Resolve defects"]),
        ("Phase 5: Deployment / Hypercare", max(1.0, _num(planning_inputs.get("hypercare_weeks"), 1)), "Deploy and support post-go-live stabilization.", ["Deploy update set", "Smoke test", "Hypercare triage"]),
    ] if is_low else [
        ("Phase 0: Discovery / Workshop", 1.0, "Resolve delivery decisions and confirm MVP scope.", ["Run workshop", "Confirm architecture", "Confirm delivery plan"]),
        ("Phase 1: Foundation Build", 2.0, "Build foundation data model, intake experience, and baseline routing.", ["Build foundation objects", "Configure form/catalog", "Set up roles"]),
        ("Phase 2: Workflow / Approvals", 2.0, "Build workflows, approvals, task routing, and exception paths.", ["Build flows", "Configure approvals", "Configure task routing"]),
        ("Phase 3: Notifications / Reporting / Security", 1.5, "Build communications, reporting, and security controls.", ["Configure notifications", "Build reports", "Validate access controls"]),
        ("Phase 4: SIT / UAT / Deployment", 2.0, "Test, fix, obtain UAT signoff, and deploy.", ["Execute SIT", "Support UAT", "Deploy"]),
        ("Phase 5: Hypercare", max(1.0, _num(planning_inputs.get("hypercare_weeks"), 1)), "Support stabilization and transition to support.", ["Hypercare triage", "Minor fixes", "Transition to support"]),
    ]

    total_duration = sum(spec[1] for spec in phase_specs) or 1
    cursor = 1.0
    phases = []
    for phase, duration, objective, activities in phase_specs:
        phase_hours = max(8, round(likely_hours * (duration / total_duration)))
        loe = {
            "Project Manager": round(phase_hours * 0.12),
            "Delivery Lead": round(phase_hours * 0.08),
            "Product Owner": round(phase_hours * 0.08),
            "ServiceNow Architect": round(phase_hours * 0.15),
            "Business Analyst": round(phase_hours * 0.18),
            "ServiceNow Developer": round(phase_hours * 0.30),
            "QA Tester": round(phase_hours * 0.09),
        }
        start = cursor
        end = round(cursor + duration - 0.5, 1)
        cursor = round(cursor + duration, 1)
        phases.append({
            "phase": phase,
            "objective": objective,
            "duration_weeks": duration,
            "start_week": start,
            "end_week": end,
            "activities": activities,
            "deliverables": [phase.replace("Phase ", "") + " deliverables"],
            "loe_hours_by_role": loe,
            "estimated_cost": _phase_cost(loe, planning_inputs),
            "exit_criteria": ["Phase deliverables reviewed", "No critical blockers remain"],
        })
    return phases


def _plan_weeks(phases: List[Dict[str, Any]]) -> float:
    return max([_num(phase.get("end_week"), 0) for phase in phases] or [0])

def _normalize_plan(plan: Dict[str, Any], planning_inputs: Dict[str, Any], current_package: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(plan, dict):
        plan = dict(DEFAULT_PLAN)

    # Fill required objects.
    for key, value in DEFAULT_PLAN.items():
        if key not in plan or plan[key] is None:
            plan[key] = value.copy() if isinstance(value, dict) else list(value) if isinstance(value, list) else value

    total = plan.get("total_loe") or {}
    cost = plan.get("cost_estimate") or {}
    weighted_rate = _weighted_rate(planning_inputs)
    complexity = _complexity_factor(current_package)

    # Defensive calculated fallback if the model omitted numeric values.
    base_likely = total.get("likely_hours")
    if base_likely in (None, "", 0):
        stories = len(_safe_list(current_package.get("stories"))) or 5
        tech_objects = len(_safe_list((current_package.get("developer") or {}).get("service_now_objects"))) or 6
        base_likely = round((120 + stories * 18 + tech_objects * 10) * complexity)
        total["likely_hours"] = base_likely
        total["low_hours"] = round(base_likely * 0.8)
        total["high_hours"] = round(base_likely * 1.3)

    likely = _num(total.get("likely_hours"), 0)
    low = _num(total.get("low_hours"), likely * 0.8)
    high = _num(total.get("high_hours"), likely * 1.3)

    if cost.get("implementation_likely") in (None, ""):
        cost["implementation_likely"] = round(likely * weighted_rate)
    if cost.get("implementation_low") in (None, ""):
        cost["implementation_low"] = round(low * weighted_rate)
    if cost.get("implementation_high") in (None, ""):
        cost["implementation_high"] = round(high * weighted_rate)

    hypercare_weeks = _num(planning_inputs.get("hypercare_weeks"), 2)
    if cost.get("hypercare_cost") in (None, ""):
        cost["hypercare_cost"] = round(max(likely * 0.12, hypercare_weeks * 35) * weighted_rate)

    maintenance_months = _num(planning_inputs.get("maintenance_months"), 12)
    include_maintenance = bool(planning_inputs.get("include_maintenance", True))
    if cost.get("monthly_maintenance_cost") in (None, ""):
        cost["monthly_maintenance_cost"] = round((likely * 0.035) * weighted_rate) if include_maintenance else 0
    if cost.get("first_year_total") in (None, ""):
        cost["first_year_total"] = round(_num(cost.get("implementation_likely")) + _num(cost.get("hypercare_cost")) + (_num(cost.get("monthly_maintenance_cost")) * maintenance_months))

    phases = _safe_list(plan.get("phase_plan"))
    stated_weeks = _num((plan.get("project_plan_summary") or {}).get("estimated_duration_weeks"), 0)
    phase_duration_sum = sum(_num(phase.get("duration_weeks"), 0) for phase in phases)
    unrealistic_simple_catalog_plan = profile_for_cap["complexity"] == "Low" and (stated_weeks > 8 or phase_duration_sum > 8)
    incomplete_phase_plan = len(phases) < 3 or (stated_weeks > 0 and phase_duration_sum < stated_weeks * 0.55) or unrealistic_simple_catalog_plan

    if incomplete_phase_plan:
        profile = _package_profile(current_package)
        likely = _num(total.get("likely_hours"), profile["likely_hours"])
        # Low-complexity OOB catalog items should not turn into 20-week plans without an explicit reason.
        if profile["complexity"] == "Low" and stated_weeks > 8:
            total["likely_hours"] = min(likely, profile["likely_hours"])
            likely = total["likely_hours"]
            total["low_hours"] = round(likely * 0.8)
            total["high_hours"] = round(likely * 1.2)
        phases = _fallback_phases(current_package, planning_inputs, likely)
        plan["phase_plan"] = phases
        reason = "PM plan was normalized because the model returned an incomplete, inconsistent, or unrealistic phase plan for the detected complexity."
        plan["diagnostics"] = _safe_list(plan.get("diagnostics")) + [reason]

    # Recalculate totals from normalized phases so cost and first-year total are consistent.
    likely = sum(sum(_num(hours, 0) for hours in (phase.get("loe_hours_by_role") or {}).values()) for phase in phases) or likely
    total["likely_hours"] = round(likely)
    total["low_hours"] = round(likely * 0.8)
    total["high_hours"] = round(likely * 1.2)

    implementation_likely = sum(_num(phase.get("estimated_cost"), _phase_cost(phase.get("loe_hours_by_role") or {}, planning_inputs)) for phase in phases)
    cost["implementation_likely"] = round(implementation_likely)
    cost["implementation_low"] = round(implementation_likely * 0.8)
    cost["implementation_high"] = round(implementation_likely * 1.2)

    hypercare_weeks = _num(planning_inputs.get("hypercare_weeks"), 2)
    if cost.get("hypercare_cost") in (None, "") or incomplete_phase_plan:
        cost["hypercare_cost"] = round(max(likely * 0.10, hypercare_weeks * 24) * weighted_rate)
    include_maintenance = bool(planning_inputs.get("include_maintenance", True))
    if cost.get("monthly_maintenance_cost") in (None, "") or incomplete_phase_plan:
        cost["monthly_maintenance_cost"] = round(max(8, likely * 0.04) * weighted_rate) if include_maintenance else 0
    maintenance_months = _num(planning_inputs.get("maintenance_months"), 12)
    cost["first_year_total"] = round(_num(cost.get("implementation_likely")) + _num(cost.get("hypercare_cost")) + (_num(cost.get("monthly_maintenance_cost")) * maintenance_months))

    summary = plan.get("project_plan_summary") or {}
    summary["estimated_duration_weeks"] = _plan_weeks(phases)
    summary["complexity"] = summary.get("complexity") or _package_profile(current_package)["complexity"]
    plan["project_plan_summary"] = summary
    plan["total_loe"] = total
    plan["cost_estimate"] = cost

    if not _safe_list(plan.get("sprint_plan")) or incomplete_phase_plan:
        plan["sprint_plan"] = [
            {
                "sprint": "Sprint 0 / Discovery" if index == 0 else f"Sprint {index}",
                "sprint_number": index,
                "start_week": phase.get("start_week"),
                "end_week": phase.get("end_week"),
                "duration_weeks": phase.get("duration_weeks"),
                "objective": phase.get("objective"),
                "planned_work": _safe_list(phase.get("activities")),
                "deliverables": _safe_list(phase.get("deliverables")),
                "dependency_notes": ["Depends on prior phase exit criteria."],
                "owner_roles": [role for role, hours in (phase.get("loe_hours_by_role") or {}).items() if _num(hours, 0) > 0],
                "estimated_hours": round(sum(_num(hours, 0) for hours in (phase.get("loe_hours_by_role") or {}).values())),
                "estimated_cost": phase.get("estimated_cost"),
            }
            for index, phase in enumerate(phases)
        ]

    role_totals: Dict[str, Dict[str, Any]] = {}
    for phase in phases:
        for role, hours in (phase.get("loe_hours_by_role") or {}).items():
            role_totals.setdefault(role, {"role": role, "total_hours": 0, "estimated_cost": 0, "responsibilities": []})
            parsed_hours = _num(hours, 0)
            role_totals[role]["total_hours"] += parsed_hours
            role_totals[role]["estimated_cost"] += round(parsed_hours * _role_rate(planning_inputs, role))
    if role_totals:
        plan["role_allocation"] = list(role_totals.values())

    return plan


def generate_project_plan(requirement: str, current_package: dict, planning_inputs: dict):
    prompt = _read_prompt()

    user_content = f"""
Requirement:
{requirement}

Current Delivery Package JSON:
{json.dumps(current_package or {}, indent=2)}

Planning Inputs JSON:
{json.dumps(planning_inputs or {}, indent=2)}

Return ONLY valid JSON with this schema:
{{
  "project_plan_summary": {{
    "recommended_delivery_approach": "string",
    "estimated_duration_weeks": number,
    "target_deployment_feasibility": "Feasible / Feasible with scope reduction / At Risk / Not Feasible",
    "complexity": "Small / Medium / Large / Enterprise",
    "confidence_level": "Low / Medium / High",
    "summary": "string"
  }},
  "total_loe": {{"low_hours": number, "likely_hours": number, "high_hours": number}},
  "cost_estimate": {{
    "implementation_low": number,
    "implementation_likely": number,
    "implementation_high": number,
    "hypercare_cost": number,
    "monthly_maintenance_cost": number,
    "first_year_total": number
  }},
  "phase_plan": [
    {{
      "phase": "Phase 0: Discovery / Workshop",
      "objective": "string",
      "duration_weeks": number,
      "start_week": number,
      "end_week": number,
      "activities": ["string"],
      "deliverables": ["string"],
      "loe_hours_by_role": {{"Project Manager": number}},
      "estimated_cost": number,
      "exit_criteria": ["string"]
    }}
  ],
  "milestone_schedule": ["string"],
  "role_allocation": [{{"role": "string", "count": number, "weekly_capacity_hours": number, "total_hours": number, "estimated_cost": number}}],
  "hypercare_plan": {{"duration_weeks": number, "activities": ["string"], "support_model": "string", "cost": number}},
  "maintenance_plan": {{"months": number, "monthly_hours": number, "monthly_cost": number, "activities": ["string"]}},
  "assumptions": ["string"],
  "exclusions": ["string"],
  "timeline_risks": ["string"],
  "cost_risks": ["string"],
  "mvp_scope_adjustments_to_hit_date": ["string"],
  "recommended_next_steps": ["string"]
}}
"""

    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_content},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"
    parsed = _extract_json(content)
    return _normalize_plan(parsed or DEFAULT_PLAN, planning_inputs or {}, current_package or {})
