from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


DEFAULT_DIAGRAM = {
    "title": "Process Flow Diagram",
    "summary": "A simple fallback process flow was generated because the diagram output could not be parsed.",
    "mermaid_code": "flowchart TD\nA[Requirement Intake] --> B[Review Requirement]\nB --> C[Process Request]\nC --> D[Complete]",
    "diagram_notes": [
        "Fallback diagram used because the model returned invalid JSON or invalid Mermaid syntax."
    ],
}


def extract_json(content: str):
    if not content:
        return None

    cleaned = content.strip()

    # Remove accidental markdown fences if the model includes them.
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        return None

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def sanitize_mermaid_label(label: str) -> str:
    if label is None:
        return "Step"

    value = str(label).strip()

    # Mermaid can fail on brackets, pipes, braces, quotes, and parentheses in labels.
    replacements = {
        "[": "",
        "]": "",
        "(": "",
        ")": "",
        "{": "",
        "}": "",
        "|": "-",
        '"': "'",
        ":": " -",
        ";": ",",
        "`": "'",
    }

    for old, new in replacements.items():
        value = value.replace(old, new)

    value = re.sub(r"\s+", " ", value).strip()

    if not value:
        return "Step"

    # Keep labels short so diagrams stay readable.
    return value[:70]


def sanitize_mermaid_code(code: str) -> str:
    if not code:
        return DEFAULT_DIAGRAM["mermaid_code"]

    cleaned = code.strip()
    cleaned = cleaned.replace("```mermaid", "").replace("```", "").strip()

    lines = []
    for raw_line in cleaned.splitlines():
        line = raw_line.strip()

        if not line:
            continue

        # Remove styling and advanced Mermaid constructs that often break rendering.
        blocked_prefixes = (
            "style ",
            "classDef ",
            "class ",
            "linkStyle ",
            "click ",
            "subgraph ",
            "end",
            "%%",
        )

        if line.startswith(blocked_prefixes):
            continue

        lines.append(line)

    if not lines:
        return DEFAULT_DIAGRAM["mermaid_code"]

    # Force flowchart TD as the first line.
    if not lines[0].startswith("flowchart TD"):
        lines = [line for line in lines if not line.startswith("flowchart") and not line.startswith("graph")]
        lines.insert(0, "flowchart TD")

    output = "\n".join(lines)

    # Sanitize text inside node labels like A[Label] and decisions like B{Decision}.
    def square_replacer(match):
        return f"{match.group(1)}[{sanitize_mermaid_label(match.group(2))}]"

    def brace_replacer(match):
        return f"{match.group(1)}{{{sanitize_mermaid_label(match.group(2))}}}"

    output = re.sub(r"([A-Za-z0-9_]+)\[([^\]]*)\]", square_replacer, output)
    output = re.sub(r"([A-Za-z0-9_]+)\{([^\}]*)\}", brace_replacer, output)

    return output


def normalize_diagram(output: dict):
    if not isinstance(output, dict):
        return DEFAULT_DIAGRAM

    title = output.get("title") or "Process Flow Diagram"
    summary = output.get("summary") or "Process/state flow generated from the requirement."
    mermaid_code = sanitize_mermaid_code(output.get("mermaid_code", ""))
    diagram_notes = output.get("diagram_notes", [])

    if not isinstance(diagram_notes, list):
        diagram_notes = [str(diagram_notes)]

    return {
        "title": str(title).strip() or "Process Flow Diagram",
        "summary": str(summary).strip() or "Process/state flow generated from the requirement.",
        "mermaid_code": mermaid_code,
        "diagram_notes": [str(note) for note in diagram_notes if str(note).strip()],
    }


def generate_process_diagram(requirement: str, architecture: dict, story_output: dict):
    prompt = f"""
You are a senior ServiceNow process architect.

Create a simple Mermaid process/state flow diagram from the business requirement and architecture.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Do not wrap Mermaid code in code fences.

Mermaid rules:
- Use only: flowchart TD
- Do not use graph LR.
- Do not use style declarations.
- Do not use classDef, class, linkStyle, click, or custom styling.
- Do not use subgraphs.
- Do not use HTML.
- Do not use parentheses in node labels.
- Do not use brackets inside node labels.
- Do not use pipe characters inside node labels.
- Keep node labels short and plain English.
- Use simple node ids like A, B, C, D, E.
- Use decision nodes only when needed, using syntax like C{{Approval Needed?}}.
- Use edge labels only for simple outcomes like Yes, No, Approved, Rejected.
- Avoid special characters that can break Mermaid rendering.

Diagram content rules:
- Include intake/submission, routing, assignment, review, approval, rejection, notifications, fulfillment/completion if relevant.
- Do not invent integrations or process steps not supported by the requirement.
- If the requirement is vague, create a generic high-level flow and note the assumptions.
- Prefer 8 to 14 nodes maximum.

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

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior ServiceNow process architect. Return only valid JSON with simple valid Mermaid flowchart TD code.",
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
        return normalize_diagram(parsed)

    except Exception as error:
        print(f"Diagram generation failed: {error}")
        return DEFAULT_DIAGRAM
