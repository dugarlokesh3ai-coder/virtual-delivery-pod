from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio

from agents.architect import generate_architecture
from agents.story import generate_stories
from agents.developer import generate_developer_notes
from agents.qa import generate_qa_package
from agents.code_generator import generate_code_for_technical_card
from utils.document_reader import extract_text_from_file
from agents.delivery_lead import generate_delivery_lead_review
from agents.intake_analyzer import analyze_requirement_intake
from agents.diagram import generate_process_diagram
from agents.quality_score import generate_quality_score
from agents.section_regenerator import regenerate_section

app = FastAPI()


class CodeRequest(BaseModel):
    card: dict
    full_context: str


class RegenerateSectionRequest(BaseModel):
    section: str
    requirement: str
    current_package: dict
    user_instruction: str


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://virtual-delivery-pod.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "backend running"}


@app.post("/analyze-requirement")
async def analyze_requirement(
    requirement: str = Form(""),
    files: Optional[List[UploadFile]] = File(None),
):
    uploaded_context = ""

    if files:
        extracted_docs = []

        for file in files:
            text = await extract_text_from_file(file)

            if text.strip():
                extracted_docs.append(
                    f"""
Document Name: {file.filename}

Document Content:
{text}
"""
                )

        uploaded_context = "\n\n".join(extracted_docs)

    combined_requirement = f"""
User Requirement:
{requirement}

Uploaded Document Context:
{uploaded_context}
"""

    intake_analysis = await asyncio.to_thread(
        analyze_requirement_intake,
        combined_requirement,
    )

    return intake_analysis


@app.post("/generate")
async def generate(
    requirement: str = Form(""),
    generation_mode: str = Form("full"),
    files: Optional[List[UploadFile]] = File(None),
):
    uploaded_context = ""

    if files:
        extracted_docs = []

        for file in files:
            text = await extract_text_from_file(file)

            if text.strip():
                extracted_docs.append(
                    f"""
Document Name: {file.filename}

Document Content:
{text}
"""
                )

        uploaded_context = "\n\n".join(extracted_docs)

    combined_requirement = f"""
User Requirement:
{requirement}

Uploaded Document Context:
{uploaded_context}
"""

    architecture = await asyncio.to_thread(
        generate_architecture,
        combined_requirement,
    )

    story_output = await asyncio.to_thread(
        generate_stories,
        combined_requirement,
        architecture,
    )

    if generation_mode == "quick":
        delivery_lead_review = await asyncio.to_thread(
            generate_delivery_lead_review,
            combined_requirement,
            architecture,
            story_output,
            {},
            {},
        )

        return {
            "generation_mode": "quick",
            "delivery_lead_review": delivery_lead_review,
            "process_diagram": None,
            "requirement_summary": architecture.get("requirement_summary", ""),
            "solution_design": architecture.get("solution_design", ""),
            "recommended_app_type": architecture.get("recommended_app_type", ""),
            "tables": architecture.get("tables", []),
            "workflow_steps": architecture.get("workflow_steps", []),
            "risks": architecture.get("risks", []),
            "open_questions": architecture.get("open_questions", []),
            "epic": story_output.get("epic", ""),
            "stories": story_output.get("stories", []),
            "story_assumptions": story_output.get("assumptions", []),
            "story_dependencies": story_output.get("dependencies", []),
            "developer": None,
            "qa": None,
            "quality_score": None,
        }

    developer_task = asyncio.to_thread(
        generate_developer_notes,
        combined_requirement,
        architecture,
        story_output,
    )

    qa_task = asyncio.to_thread(
        generate_qa_package,
        combined_requirement,
        architecture,
        story_output,
    )

    diagram_task = asyncio.to_thread(
        generate_process_diagram,
        combined_requirement,
        architecture,
        story_output,
    )

    developer_output, qa_output, process_diagram = await asyncio.gather(
        developer_task,
        qa_task,
        diagram_task,
    )

    delivery_lead_review = await asyncio.to_thread(
        generate_delivery_lead_review,
        combined_requirement,
        architecture,
        story_output,
        developer_output,
        qa_output,
    )

    quality_score = await asyncio.to_thread(
        generate_quality_score,
        combined_requirement,
        architecture,
        story_output,
        developer_output,
        qa_output,
        delivery_lead_review,
    )

    return {
        "generation_mode": "full",
        "delivery_lead_review": delivery_lead_review,
        "process_diagram": process_diagram,
        "requirement_summary": architecture.get("requirement_summary", ""),
        "solution_design": architecture.get("solution_design", ""),
        "recommended_app_type": architecture.get("recommended_app_type", ""),
        "tables": architecture.get("tables", []),
        "workflow_steps": architecture.get("workflow_steps", []),
        "risks": architecture.get("risks", []),
        "open_questions": architecture.get("open_questions", []),
        "epic": story_output.get("epic", ""),
        "stories": story_output.get("stories", []),
        "story_assumptions": story_output.get("assumptions", []),
        "story_dependencies": story_output.get("dependencies", []),
        "developer": developer_output,
        "qa": qa_output,
        "quality_score": quality_score,
    }


@app.post("/generate-code")
def generate_code(request: CodeRequest):
    code_output = generate_code_for_technical_card(
        request.card,
        request.full_context,
    )

    return {
        "code": code_output,
    }


@app.post("/regenerate-section")
def regenerate_selected_section(request: RegenerateSectionRequest):
    regenerated_output = regenerate_section(
        request.section,
        request.requirement,
        request.current_package,
        request.user_instruction,
    )

    return {
        "section": request.section,
        "output": regenerated_output,
    }