from fastapi import UploadFile
from pypdf import PdfReader
from docx import Document
import tempfile
import os


async def extract_text_from_file(file: UploadFile) -> str:
    filename = (file.filename or "").lower()
    content = await file.read()

    if filename.endswith(".txt"):
        return content.decode("utf-8", errors="ignore")

    if filename.endswith(".pdf"):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        try:
            reader = PdfReader(temp_path)
            text = []
            for page in reader.pages:
                text.append(page.extract_text() or "")
            return "\n".join(text)
        finally:
            os.remove(temp_path)

    if filename.endswith(".docx"):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        try:
            doc = Document(temp_path)
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        finally:
            os.remove(temp_path)

    return ""