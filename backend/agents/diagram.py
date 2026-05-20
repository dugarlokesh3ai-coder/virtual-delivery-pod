from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))



def _sanitize_mermaid(code: str) -> str:
    if not code:
        return "flowchart TD\nA[Requirement Intake] --> B[Review Required]"
    cleaned = str(code).strip().replace("```mermaid", "").replace("```", "").strip()
    cleaned = re.sub(r"--\s*Approved\s*-->\s*CAccess\s*Type\s*Admin", "-- Approved --> C{Access Type = Admin?}", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"--\s*Approved\s*-->\s*CAccess\s+type\s+Admin", "-- Approved --> C{Access Type = Admin?}", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bCAccess\s*Type\s*Admin\b", "C{Access Type = Admin?}", cleaned, flags=re.IGNORECASE)
    if not cleaned.lower().startswith("flowchart"):
        cleaned = "flowchart TD\n" + cleaned
    return cleaned

def generate_process_diagram(requirement: str, architecture: dict, story_output: dict):
    prompt = f"""
You are a senior ServiceNow process architect.

Create a Mermaid process/state flow diagram from the business requirement and architecture.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Do not wrap Mermaid code in ``` fences.
Use Mermaid flowchart syntax.
Prefer simple, readable process/state flow.
Include approval, rejection, routing, assignment, notification, and completion steps if relevant.
Do not invent steps not supported by the requirement.
Mermaid quality rules:
- Decision nodes must use braces, for example C{{Access Type = Admin?}}.
- Never concatenate node id and label, such as CAccess Type Admin.
- Every edge must point to a valid node id.
- Use simple node ids such as A, B, C, D.
- Validate that the Mermaid code can render before returning it.

Business Requirement:
{requirement}

Architecture Output:
{json.dumps(architecture, indent=2)}

Story Output:
{json.dumps(story_output, indent=2)}

Return this JSON structure exactly:

{{
  "title": "Short diagram title",
  "summary": "Short explanation of what this diagram shows.",
  "mermaid_code": "flowchart TD\\nA[Start] --> B[Next Step]",
  "diagram_notes": [
    "Note 1"
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a senior ServiceNow process architect. Return only valid JSON."
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
        parsed = json.loads(content)
        parsed["mermaid_code"] = _sanitize_mermaid(parsed.get("mermaid_code", ""))
        return parsed
    except json.JSONDecodeError:
        return {
            "title": "Process Flow Diagram",
            "summary": "Unable to parse diagram output.",
            "mermaid_code": "flowchart TD\nA[Requirement Intake] --> B[Review Required]",
            "diagram_notes": []
        }