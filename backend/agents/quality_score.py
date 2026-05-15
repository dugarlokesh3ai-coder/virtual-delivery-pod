from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_quality_score(
    requirement: str,
    architecture: dict,
    story_output: dict,
    developer_output: dict,
    qa_output: dict,
    delivery_lead_review: dict,
):
    prompt = f"""
You are a senior ServiceNow delivery quality reviewer.

Review the generated delivery package and score it for:
- completeness
- delivery risk
- readiness to hand off to a ServiceNow build team

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.

Scoring rules:
- overall_score: 0-100
- completeness_score: 0-100
- risk_score: 0-100 where higher means lower risk / better risk posture
- readiness_score: 0-100
- rating must be one of: Strong, Good, Needs Work, Weak

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
  "overall_score": 82,
  "completeness_score": 80,
  "risk_score": 75,
  "readiness_score": 85,
  "rating": "Good",
  "summary": "Short quality assessment.",
  "strengths": [
    "Strength 1"
  ],
  "weaknesses": [
    "Weakness 1"
  ],
  "recommended_fixes": [
    "Recommended fix 1"
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior ServiceNow delivery quality reviewer. Return only valid JSON."
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
            "overall_score": 0,
            "completeness_score": 0,
            "risk_score": 0,
            "readiness_score": 0,
            "rating": "Weak",
            "summary": "Unable to parse quality score output.",
            "strengths": [],
            "weaknesses": [],
            "recommended_fixes": []
        }