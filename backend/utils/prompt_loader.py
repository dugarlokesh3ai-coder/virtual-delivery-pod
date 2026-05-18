from pathlib import Path


def load_prompt(prompt_file_name: str, fallback_prompt: str = "") -> str:
    """
    Loads prompts from backend/prompts/<prompt_file_name>.

    Works from:
    - backend/
    - project root/
    - Render deployment working directory

    If the prompt file is missing, returns fallback_prompt so the app does not crash.
    """
    possible_paths = [
        Path("prompts") / prompt_file_name,
        Path("backend") / "prompts" / prompt_file_name,
        Path(__file__).resolve().parent.parent / "prompts" / prompt_file_name,
    ]

    for path in possible_paths:
        try:
            if path.exists():
                return path.read_text(encoding="utf-8")
        except Exception as error:
            print(f"Unable to read prompt file {path}: {error}")

    print(f"Prompt file not found: {prompt_file_name}. Using fallback prompt.")
    return fallback_prompt
