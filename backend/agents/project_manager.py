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

    plan["total_loe"] = total
    plan["cost_estimate"] = cost

    if not _safe_list(plan.get("phase_plan")):
        # Simple phase breakdown if model omits phases.
        phase_pct = [
            ("Phase 0: Discovery / Workshop", 0.08),
            ("Phase 1: Requirements + Design", 0.15),
            ("Phase 2: Build / Configuration", 0.40),
            ("Phase 3: SIT", 0.13),
            ("Phase 4: UAT", 0.12),
            ("Phase 5: Deployment / Cutover", 0.05),
            ("Phase 6: Hypercare", 0.07),
        ]
        plan["phase_plan"] = [
            {
                "phase": name,
                "objective": "Complete delivery activities for this phase.",
                "duration_weeks": 1 if pct <= 0.08 else 2,
                "activities": [],
                "deliverables": [],
                "loe_hours_by_role": {},
                "estimated_cost": round(likely * pct * weighted_rate),
                "exit_criteria": [],
            }
            for name, pct in phase_pct
        ]

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
