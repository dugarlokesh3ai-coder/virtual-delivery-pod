from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


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
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "title": "Process Flow Diagram",
            "summary": "Unable to parse diagram output.",
            "mermaid_code": "flowchart TD\nA[Requirement Intake] --> B[Review Required]",
            "diagram_notes": []
        }