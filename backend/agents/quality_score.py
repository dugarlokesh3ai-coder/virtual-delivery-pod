from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


DEFAULT_SCORE = {
    "overall_score": None,
    "completeness_score": None,
    "risk_score": None,
    "readiness_score": None,
    "rating": "Score unavailable",
    "summary": "The quality score could not be generated or parsed. Review the package manually.",
    "score_rationale": {
        "completeness": "Unable to score.",
        "risk": "Unable to score.",
        "readiness": "Unable to score.",
    },
    "score_caps_applied": [
        "Score unavailable because quality scoring returned invalid output."
    ],
    "strengths": [],
    "weaknesses": [
        "Quality scoring failed or returned invalid JSON."
    ],
    "recommended_fixes": [
        "Regenerate the quality score or review the package manually."
    ],
    "build_readiness_verdict": "Not assessed",
}


def extract_json(content: str):
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


def normalize_score(value):
    try:
        if value is None:
            return None

        score = int(round(float(value)))

        if score < 0:
            return 0

        if score > 100:
            return 100

        return score
    except Exception:
        return None


def apply_score_safety(output: dict):
    if not isinstance(output, dict):
        return DEFAULT_SCORE

    required_keys = [
        "overall_score",
        "completeness_score",
        "risk_score",
        "readiness_score",
        "rating",
        "summary",
        "strengths",
        "weaknesses",
        "recommended_fixes",
    ]

    for key in required_keys:
        if key not in output:
            output[key] = DEFAULT_SCORE.get(key)

    output["overall_score"] = normalize_score(output.get("overall_score"))
    output["completeness_score"] = normalize_score(output.get("completeness_score"))
    output["risk_score"] = normalize_score(output.get("risk_score"))
    output["readiness_score"] = normalize_score(output.get("readiness_score"))

    score_values = [
        output["overall_score"],
        output["completeness_score"],
        output["risk_score"],
        output["readiness_score"],
    ]

    if any(score is None for score in score_values):
        return DEFAULT_SCORE

    if not isinstance(output.get("strengths"), list):
        output["strengths"] = []

    if not isinstance(output.get("weaknesses"), list):
        output["weaknesses"] = []

    if not isinstance(output.get("recommended_fixes"), list):
        output["recommended_fixes"] = []

    if not isinstance(output.get("score_caps_applied"), list):
        output["score_caps_applied"] = []

    if not isinstance(output.get("score_rationale"), dict):
        output["score_rationale"] = {
            "completeness": "",
            "risk": "",
            "readiness": "",
        }

    if not output.get("rating"):
        score = output["overall_score"]

        if score >= 85:
            output["rating"] = "Strong"
        elif score >= 70:
            output["rating"] = "Good Draft"
        elif score >= 50:
            output["rating"] = "Needs Work"
        else:
            output["rating"] = "Not Build Ready"

    if not output.get("build_readiness_verdict"):
        output["build_readiness_verdict"] = "Review required before build handoff."

    return output


def generate_quality_score(
    requirement: str,
    architecture: dict,
    story_output: dict,
    developer_output: dict,
    qa_output: dict,
    delivery_lead_review: dict,
):
    is_quick_package = not developer_output or not qa_output

    prompt = f"""
You are a strict ServiceNow delivery quality reviewer.

Your job is to score the generated delivery package honestly.
Do not be generous.
Do not give the same score repeatedly.
Do not return 85 unless the package is genuinely close to build-ready.
Do not return 0 unless the input/package is empty, unusable, or impossible to score.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.

Package Type:
{"QUICK PACKAGE" if is_quick_package else "FULL PACKAGE"}

Scoring Rules:

For QUICK PACKAGE:
- Score requirement readiness and delivery draft quality.
- Developer notes and QA may be missing. Do NOT penalize heavily just because those sections are missing.
- Score based on requirement clarity, architecture quality, workflow clarity, story usefulness, missing requirements, open questions, assumptions, risks, and next steps.

For FULL PACKAGE:
- Score full build handoff readiness.
- Score requirement clarity, architecture, stories, technical notes, QA coverage, risks, open questions, deployment readiness, and delivery lead review.

Score Bands:
- 90-100: Excellent. Rare. Clear requirement, detailed package, few or no meaningful gaps.
- 80-89: Strong. Mostly build-ready, only minor clarifications needed.
- 70-79: Good Draft. Useful package but has meaningful open questions or minor gaps.
- 50-69: Needs Work. Many gaps, assumptions, or missing implementation details.
- 30-49: Weak. Requirement is vague, incomplete, contradictory, or not ready for delivery.
- 0-29: Not usable. Too little information or major contradictions prevent useful delivery planning.

Mandatory Score Caps:
- If core request type, workflow, roles, or data fields are unclear: overall_score must be <= 60.
- If approval rules are unclear or contradictory: overall_score must be <= 60.
- If there are major contradictions in the requirement: overall_score must be <= 55.
- If the requirement is only a few vague sentences: overall_score must be <= 50.
- If package recommends a custom scoped app when an OOB catalog item is clearly better: overall_score must be <= 65.
- If open questions include items required for build, readiness_score must be <= 70.
- If more than 5 significant missing requirements exist, overall_score must be <= 70.
- If more than 8 significant missing requirements exist, overall_score must be <= 60.
- If notification recipients/templates are unclear but notifications are required, readiness_score must be <= 75.
- If assignment groups or approvers are unknown, readiness_score must be <= 70.

Expected Behavior:
- A strong detailed requirement should usually score 75-85.
- A rough but workable requirement should usually score 55-70.
- A vague requirement should usually score 35-55.
- A contradictory requirement should usually score 35-60 depending on severity.
- A simple catalog item with clear fields and approval should not be over-engineered.

Business Requirement:
{requirement}

Architecture Output:
{json.dumps(architecture, indent=2)}

Story Output:
{json.dumps(story_output, indent=2)}

Developer Output:
{json.dumps(developer_output, indent=2)}

QA Output:
{json.dumps(qa_output, indent=2)}

Delivery Lead Review:
{json.dumps(delivery_lead_review, indent=2)}

Return this JSON structure exactly:

{{
  "overall_score": 0,
  "completeness_score": 0,
  "risk_score": 0,
  "readiness_score": 0,
  "rating": "Strong / Good Draft / Needs Work / Weak / Not Build Ready",
  "summary": "Clear summary of why this score was assigned.",
  "score_rationale": {{
    "completeness": "Why the completeness score was assigned.",
    "risk": "Why the risk score was assigned.",
    "readiness": "Why the readiness score was assigned."
  }},
  "score_caps_applied": [
    "List any score caps or penalties applied. If none, return an empty list."
  ],
  "strengths": [
    "Strength 1"
  ],
  "weaknesses": [
    "Weakness 1"
  ],
  "recommended_fixes": [
    "Fix 1"
  ],
  "build_readiness_verdict": "Clear verdict on whether this is ready for build handoff."
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a strict ServiceNow delivery quality reviewer. Return only valid JSON.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.1,
    )

    content = response.choices[0].message.content
    parsed = extract_json(content)

    return apply_score_safety(parsed)
