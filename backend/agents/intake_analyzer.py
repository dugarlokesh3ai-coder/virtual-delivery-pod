from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def analyze_requirement_intake(requirement: str):
    prompt = f"""
You are the Delivery Lead Agent for a Virtual ServiceNow Delivery Pod.

Your job is to analyze a raw business requirement before the full delivery package is generated.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Do not say "certainly".
Do not say "if you want".

Analyze:
- what the business appears to need
- whether enough information exists to generate a delivery package
- what is missing
- what assumptions would be needed
- what questions should be asked before solutioning

Business Requirement:
{requirement}

Return this JSON structure exactly:

{{
  "understanding": "Clear summary of what the user is asking for.",
  "can_generate_package": true,
  "confidence": "High / Medium / Low",
  "clarifying_questions": [
    "Question 1"
  ],
  "assumptions": [
    "Assumption 1"
  ],
  "missing_requirements": [
    {{
      "gap": "Missing requirement",
      "why_it_matters": "Why this matters for delivery"
    }}
  ],
  "recommended_next_step": "Generate with assumptions / Answer questions first"
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior ServiceNow Delivery Lead. Return only valid JSON."
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
            "understanding": "Unable to parse intake analysis.",
            "can_generate_package": False,
            "confidence": "Low",
            "clarifying_questions": [],
            "assumptions": [],
            "missing_requirements": [],
            "recommended_next_step": "Review requirement manually"
        }