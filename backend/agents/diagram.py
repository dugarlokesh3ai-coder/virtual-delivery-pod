import json
import re
from typing import Any, Dict

from agents._common import _chat_json, _safe_dict


FALLBACK_DIAGRAM_PROMPT = """
You create simple Mermaid flowcharts for ServiceNow workflows.
Use only flowchart TD.
Avoid style declarations, subgraphs, classDef, linkStyle, click, HTML, quotes, parentheses, and special characters in labels.
Return only valid JSON.
"""


def _fallback_diagram() -> Dict[str, Any]:
    return {
        "title": "Process Flow",
        "summary": "Fallback process flow because the diagram agent failed.",
        "mermaid_code": "flowchart TD\nA[Requirement Intake] --> B[Review]\nB --> C[Decision]\nC --> D[Complete]",
        "diagram_notes": [
            "Diagram agent failed or returned invalid Mermaid. Review process manually."
        ],
    }


def _sanitize_mermaid(code: str) -> str:
    if not code:
        return _fallback_diagram()["mermaid_code"]

    text = code.strip()
    text = re.sub(r"^```(?:mermaid)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    lines = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        lower = line.lower()
        if lower.startswith(("style ", "classdef ", "class ", "linkstyle ", "click ", "subgraph ", "end")):
            continue

        # Replace labels that often break Mermaid parsing.
        line = line.replace("(", "").replace(")", "")
        line = line.replace("{", "").replace("}", "")
        line = line.replace("|", "-")
        line = line.replace('"', "").replace("'", "")
        line = re.sub(r"<[^>]+>", "", line)
        lines.append(line)

    if not lines or not lines[0].lower().startswith("flowchart"):
        lines.insert(0, "flowchart TD")

    return "\n".join(lines)


def generate_process_diagram(
    requirement: str,
    architecture: dict,
    story_output: dict,
) -> Dict[str, Any]:
    user_payload = f"""
Business Requirement:
{requirement}

Architecture Context:
{json.dumps(architecture, indent=2)}

Story Context:
{json.dumps(story_output, indent=2)}

Return JSON exactly in this structure:
{{
  "title": "Diagram title",
  "summary": "Short summary",
  "mermaid_code": "flowchart TD\\nA[Start] --> B[Next]",
  "diagram_notes": [
    "Note 1"
  ]
}}
"""

    output = _chat_json(
        prompt_name="diagram.txt",
        fallback_prompt=FALLBACK_DIAGRAM_PROMPT,
        user_payload=user_payload,
        fallback=_fallback_diagram(),
        temperature=0.05,
    )

    output = _safe_dict(output)
    fallback = _fallback_diagram()
    mermaid_code = _sanitize_mermaid(output.get("mermaid_code") or fallback["mermaid_code"])

    return {
        "title": output.get("title") or fallback["title"],
        "summary": output.get("summary") or fallback["summary"],
        "mermaid_code": mermaid_code,
        "diagram_notes": output.get("diagram_notes") if isinstance(output.get("diagram_notes"), list) else fallback["diagram_notes"],
    }
