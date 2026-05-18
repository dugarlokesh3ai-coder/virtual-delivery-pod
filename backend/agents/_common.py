import json
import os
import re
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from openai import OpenAI

from utils.prompt_loader import load_prompt

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


def _json_from_text(content: str) -> Optional[Any]:
    if not content:
        return None

    text = content.strip()

    # Remove accidental markdown fences.
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fallback: extract the first object/array-looking payload.
    object_match = re.search(r"\{[\s\S]*\}", text)
    array_match = re.search(r"\[[\s\S]*\]", text)

    candidate = None
    if object_match and array_match:
        candidate = object_match.group(0) if object_match.start() < array_match.start() else array_match.group(0)
    elif object_match:
        candidate = object_match.group(0)
    elif array_match:
        candidate = array_match.group(0)

    if not candidate:
        return None

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return None


def _chat_json(
    *,
    prompt_name: str,
    fallback_prompt: str,
    user_payload: str,
    fallback: Any,
    temperature: float = 0.15,
) -> Any:
    prompt = load_prompt(prompt_name, fallback_prompt)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are part of a ServiceNow AI delivery pod. "
                    "Return only valid JSON. Do not include markdown, prose, or code fences."
                ),
            },
            {
                "role": "user",
                "content": f"{prompt}\n\nINPUT CONTEXT:\n{user_payload}",
            },
        ],
        temperature=temperature,
    )

    content = response.choices[0].message.content or ""
    parsed = _json_from_text(content)

    if parsed is None:
        print(f"[{prompt_name}] Invalid JSON returned by model.")
        print(content[:4000])
        return fallback

    return parsed


def _safe_list(value: Any) -> List[Any]:
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return [value]


def _safe_dict(value: Any) -> Dict[str, Any]:
    return value if isinstance(value, dict) else {}
