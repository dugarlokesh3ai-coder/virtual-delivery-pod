import json
from typing import Any

from agents._common import _chat_json


FALLBACK_SECTION_REGENERATOR_PROMPT = """
You regenerate one section of a ServiceNow delivery package.
Only regenerate the requested section.
Preserve consistency with the requirement and current package.
Return only valid JSON for the requested section.
"""


def regenerate_section(
    section: str,
    requirement: str,
    current_package: dict,
    user_instruction: str,
) -> Any:
    fallback = {
        "error": f"Unable to regenerate section '{section}'. Check backend logs."
    }

    user_payload = f"""
Requested Section:
{section}

User Instruction:
{user_instruction}

Business Requirement:
{requirement}

Current Package:
{json.dumps(current_package, indent=2)}

Return only the JSON object/array needed to replace this section:
{section}
"""

    return _chat_json(
        prompt_name="section_regenerator.txt",
        fallback_prompt=FALLBACK_SECTION_REGENERATOR_PROMPT,
        user_payload=user_payload,
        fallback=fallback,
        temperature=0.12,
    )
