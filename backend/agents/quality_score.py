from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def safe_list(value):
    return value if isinstance(value, list) else []


def count_package_gaps(delivery_lead_review: dict, architecture: dict, developer_output: dict, qa_output: dict):
    open_questions = safe_list(architecture.get("open_questions", []))
    assumptions = safe_list(delivery_lead_review.get("assumptions", []))
    missing_requirements = safe_list(delivery_lead_review.get("missing_requirements", []))
    risks = safe_list(architecture.get("risks", []))

    acl_notes = safe_list(developer_output.get("acl_notes", []))
    service_now_objects = safe_list(developer_output.get("service_now_objects", []))
    flow_notes = safe_list(developer_output.get("flow_designer_notes", []))
    business_rules = safe_list(developer_output.get("business_rules", []))

    test_cases = safe_list(qa_output.get("test_cases", []))
    uat_cases = safe_list(qa_output.get("uat_cases", []))
    edge_cases = safe_list(qa_output.get("edge_cases", []))

    return {
        "open_question_count": len(open_questions),
        "assumption_count": len(assumptions),
        "missing_requirement_count": len(missing_requirements),
        "risk_count": len(risks),
        "acl_note_count": len(acl_notes),
        "service_now_object_count": len(service_now_objects),
        "flow_count": len(flow_notes),
        "business_rule_count": len(business_rules),
        "test_case_count": len(test_cases),
        "uat_case_count": len(uat_cases),
        "edge_case_count": len(edge_cases),
    }


def apply_score_caps(parsed: dict, gap_counts: dict):
    caps_applied = list(parsed.get("score_caps_applied", []))

    overall_cap = 100
    readiness_cap = 100
    risk_cap = 100
    completeness_cap = 100

    if gap_counts["open_question_count"] > 5:
        overall_cap = min(overall_cap, 72)
        caps_applied.append("More than 5 open questions; overall score capped at 72.")

    if gap_counts["assumption_count"] > 8:
        overall_cap = min(overall_cap, 70)
        caps_applied.append("More than 8 assumptions; overall score capped at 70.")

    if gap_counts["missing_requirement_count"] >= 3:
        overall_cap = min(overall_cap, 74)
        completeness_cap = min(completeness_cap, 72)
        caps_applied.append("Three or more missing/weak requirements; completeness and overall score capped.")

    if gap_counts["acl_note_count"] < 3:
        overall_cap = min(overall_cap, 76)
        risk_cap = min(risk_cap, 74)
        caps_applied.append("ACL/security model appears incomplete; risk and overall score capped.")

    if gap_counts["service_now_object_count"] < 5:
        overall_cap = min(overall_cap, 78)
        completeness_cap = min(completeness_cap, 76)
        caps_applied.append("ServiceNow object/data model appears thin; completeness and overall score capped.")

    if gap_counts["flow_count"] < 2:
        readiness_cap = min(readiness_cap, 72)
        caps_applied.append("Flow Designer/build workflow detail appears thin; readiness score capped at 72.")

    if gap_counts["business_rule_count"] < 1:
        readiness_cap = min(readiness_cap, 74)
        caps_applied.append("Business rule/server-side logic detail appears incomplete; readiness score capped at 74.")

    if gap_counts["test_case_count"] < 8:
        readiness_cap = min(readiness_cap, 70)
        overall_cap = min(overall_cap, 76)
        caps_applied.append("Fewer than 8 test cases; readiness and overall score capped.")

    if gap_counts["uat_case_count"] < 3:
        readiness_cap = min(readiness_cap, 72)
        caps_applied.append("Fewer than 3 UAT cases; readiness score capped.")

    if gap_counts["edge_case_count"] < 3:
        risk_cap = min(risk_cap, 72)
        caps_applied.append("Edge case coverage appears limited; risk score capped.")

    parsed["overall_score"] = min(int(parsed.get("overall_score", 0)), overall_cap)
    parsed["completeness_score"] = min(int(parsed.get("completeness_score", 0)), completeness_cap)
    parsed["risk_score"] = min(int(parsed.get("risk_score", 0)), risk_cap)
    parsed["readiness_score"] = min(int(parsed.get("readiness_score", 0)), readiness_cap)

    parsed["score_caps_applied"] = caps_applied

    overall = parsed["overall_score"]

    if overall >= 85:
        parsed["rating"] = "Strong"
        parsed["build_readiness_verdict"] = "Ready"
    elif overall >= 70:
        parsed["rating"] = "Good"
        parsed["build_readiness_verdict"] = "Conditionally Ready"
    elif overall >= 50:
        parsed["rating"] = "Needs Work"
        parsed["build_readiness_verdict"] = "Not Ready"
    else:
        parsed["rating"] = "Weak"
        parsed["build_readiness_verdict"] = "Not Ready"

    return parsed


def generate_quality_score(
    requirement: str,
    architecture: dict,
    story_output: dict,
    developer_output: dict,
    qa_output: dict,
    delivery_lead_review: dict,
):
    gap_counts = count_package_gaps(
        delivery_lead_review,
        architecture,
        developer_output,
        qa_output,
    )

    prompt = f"""
You are a strict ServiceNow delivery quality gate reviewer.

Score whether this package is ready to hand to a real ServiceNow build team.

Be strict. Most AI-generated draft packages should score between 45 and 75.
Scores above 85 should be rare and require highly specific, build-ready detail.

Evaluate:
- business clarity
- personas
- states
- routing
- assignment
- approvals
- rejection paths
- notification rules
- ACL/security model
- data model/tables/fields
- reporting
- admin/configuration needs
- stories
- acceptance criteria
- technical implementation notes
- QA depth
- UAT depth
- open questions
- assumptions
- unresolved risks

Current measured package signals:
{json.dumps(gap_counts, indent=2)}

Scoring calibration:
90-100 = production-quality package, rare
80-89 = strong but still needs minor clarification
70-79 = good draft, needs stakeholder refinement
60-69 = needs work before build
45-59 = weak draft with major gaps
0-44 = not build-ready

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Do not inflate the score.

Business Requirement:
{requirement}

Architecture:
{json.dumps(architecture, indent=2)}

Stories:
{json.dumps(story_output, indent=2)}

Developer Notes:
{json.dumps(developer_output, indent=2)}

QA Package:
{json.dumps(qa_output, indent=2)}

Delivery Lead Review:
{json.dumps(delivery_lead_review, indent=2)}

Return this JSON structure exactly:

{{
  "overall_score": 0,
  "completeness_score": 0,
  "risk_score": 0,
  "readiness_score": 0,
  "rating": "Strong / Good / Needs Work / Weak",
  "summary": "Strict quality assessment. Mention why the score is not higher.",
  "score_rationale": {{
    "completeness": "Why this score was given.",
    "risk": "Why this score was given.",
    "readiness": "Why this score was given."
  }},
  "score_caps_applied": [],
  "strengths": [],
  "weaknesses": [],
  "recommended_fixes": [],
  "build_readiness_verdict": "Ready / Conditionally Ready / Not Ready"
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a strict ServiceNow delivery quality gate reviewer. Return only valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            },
        ],
        temperature=0.0,
    )

    content = response.choices[0].message.content

    try:
        parsed = json.loads(content)
        return apply_score_caps(parsed, gap_counts)

    except Exception:
        return {
            "overall_score": 45,
            "completeness_score": 45,
            "risk_score": 45,
            "readiness_score": 45,
            "rating": "Weak",
            "summary": "Unable to parse quality score output. Manual review required.",
            "score_rationale": {
                "completeness": "Parse failure.",
                "risk": "Parse failure.",
                "readiness": "Parse failure.",
            },
            "score_caps_applied": [
                "Parsing failed; conservative score applied."
            ],
            "strengths": [],
            "weaknesses": [
                "Quality score output could not be parsed."
            ],
            "recommended_fixes": [
                "Regenerate quality score."
            ],
            "build_readiness_verdict": "Not Ready",
        }