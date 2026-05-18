from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import traceback

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
from agents.agent_review import generate_agent_review
from agents.delivery_lead_chat import chat_with_delivery_lead

app = FastAPI()


class CodeRequest(BaseModel):
    card: dict
    full_context: str


class AgentReviewRequest(BaseModel):
    requirement: str
    current_package: dict


class DeliveryLeadChatRequest(BaseModel):
    message: str
    requirement: str
    current_package: dict | None = None
    chat_history: list = []


class RegenerateSectionRequest(BaseModel):
    section: str
    requirement: str
    current_package: dict
    user_instruction: str


class UpgradePackageRequest(BaseModel):
    requirement: str
    current_package: dict


DEVELOPER_FALLBACK = {
    "implementation_summary": "Developer notes could not be generated. Check backend logs.",
    "service_now_objects": [],
    "flow_designer_notes": [],
    "business_rules": [],
    "ui_policies": [],
    "acl_notes": [],
    "notification_notes": [],
    "deployment_notes": [],
    "technical_assumptions": [
        "Developer agent failed during generation. Check backend logs."
    ],
}

DIAGRAM_FALLBACK = {
    "title": "Process Flow Diagram",
    "summary": "Diagram could not be generated. A fallback flow is shown.",
    "mermaid_code": "flowchart TD\nA[Requirement Intake] --> B[Review Requirement]\nB --> C[Process Request]\nC --> D[Complete]",
    "diagram_notes": [
        "Diagram agent failed during generation. Check backend logs."
    ],
}

QA_FALLBACK = {
    "test_strategy": "QA package could not be generated. Check backend logs.",
    "test_scenarios": [],
    "test_cases": [],
    "uat_cases": [],
    "edge_cases": [],
    "test_data_needs": [],
    "regression_areas": [
        "QA agent failed during generation. Check backend logs."
    ],
}

DELIVERY_LEAD_FALLBACK = {
    "understanding": "Delivery Lead review could not be generated. Check backend logs.",
    "mvp_scope": [],
    "phase_2_scope": [],
    "assumptions": [],
    "missing_requirements": [],
    "clarifying_questions": [],
    "recommended_next_steps": [
        "Delivery Lead agent failed during generation. Check backend logs."
    ],
}

QUALITY_SCORE_FALLBACK = {
    "overall_score": None,
    "completeness_score": None,
    "risk_score": None,
    "readiness_score": None,
    "rating": "Score unavailable",
    "summary": "Quality score could not be generated. Check backend logs.",
    "score_rationale": {
        "completeness": "Unable to score.",
        "risk": "Unable to score.",
        "readiness": "Unable to score.",
    },
    "score_caps_applied": [
        "Quality score agent failed during generation. Check backend logs."
    ],
    "strengths": [],
    "weaknesses": [],
    "recommended_fixes": [],
    "build_readiness_verdict": "Not assessed",
}


async def safe_agent_call(agent_name: str, fallback, func, *args):
    try:
        return await asyncio.to_thread(func, *args)
    except Exception as error:
        print(f"\n========== {agent_name} FAILED ==========")
        print(str(error))
        traceback.print_exc()
        print("========================================\n")
        return fallback


async def build_combined_requirement(
    requirement: str = "",
    files: Optional[List[UploadFile]] = None,
):
    uploaded_context = ""

    if files:
        extracted_docs = []

        for file in files:
            text = await extract_text_from_file(file)

            if text and text.strip():
                extracted_docs.append(
                    f"""
Document Name: {file.filename}

Document Content:
{text}
"""
                )

        uploaded_context = "\n\n".join(extracted_docs)

    return f"""
User Requirement:
{requirement}

Uploaded Document Context:
{uploaded_context}
"""


def build_architecture_from_package(current_package: dict):
    return {
        "requirement_summary": current_package.get("requirement_summary", ""),
        "solution_design": current_package.get("solution_design", ""),
        "recommended_app_type": current_package.get("recommended_app_type", ""),
        "tables": current_package.get("tables", []),
        "workflow_steps": current_package.get("workflow_steps", []),
        "risks": current_package.get("risks", []),
        "open_questions": current_package.get("open_questions", []),
    }


def build_story_output_from_package(current_package: dict):
    return {
        "epic": current_package.get("epic", ""),
        "stories": current_package.get("stories", []),
        "assumptions": current_package.get("story_assumptions", []),
        "dependencies": current_package.get("story_dependencies", []),
    }


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
    combined_requirement = await build_combined_requirement(requirement, files)

    intake_analysis = await safe_agent_call(
        "Intake Analyzer Agent",
        {
            "understanding": "Unable to analyze requirement. Check backend logs.",
            "can_generate_package": False,
            "confidence": "Low",
            "clarifying_questions": [],
            "assumptions": [],
            "missing_requirements": [],
            "recommended_next_step": "Check backend logs and retry.",
        },
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
    combined_requirement = await build_combined_requirement(requirement, files)

    architecture = await safe_agent_call(
        "Architect Agent",
        {
            "requirement_summary": "Architecture could not be generated. Check backend logs.",
            "solution_design": "",
            "recommended_app_type": "",
            "tables": [],
            "workflow_steps": [],
            "risks": [],
            "open_questions": ["Architecture agent failed during generation."],
        },
        generate_architecture,
        combined_requirement,
    )

    story_output = await safe_agent_call(
        "Story Agent",
        {
            "epic": "",
            "stories": [],
            "assumptions": ["Story agent failed during generation. Check backend logs."],
            "dependencies": [],
        },
        generate_stories,
        combined_requirement,
        architecture,
    )

    if generation_mode == "quick":
        delivery_lead_review = await safe_agent_call(
            "Delivery Lead Agent",
            DELIVERY_LEAD_FALLBACK,
            generate_delivery_lead_review,
            combined_requirement,
            architecture,
            story_output,
            {},
            {},
        )

        quality_score = await safe_agent_call(
            "Quality Score Agent",
            QUALITY_SCORE_FALLBACK,
            generate_quality_score,
            combined_requirement,
            architecture,
            story_output,
            {},
            {},
            delivery_lead_review,
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
            "quality_score": quality_score,
        }

    developer_task = safe_agent_call(
        "Developer Agent",
        DEVELOPER_FALLBACK,
        generate_developer_notes,
        combined_requirement,
        architecture,
        story_output,
    )

    diagram_task = safe_agent_call(
        "Diagram Agent",
        DIAGRAM_FALLBACK,
        generate_process_diagram,
        combined_requirement,
        architecture,
        story_output,
    )

    developer_output, process_diagram = await asyncio.gather(
        developer_task,
        diagram_task,
    )

    qa_output = await safe_agent_call(
        "QA Agent",
        QA_FALLBACK,
        generate_qa_package,
        combined_requirement,
        architecture,
        story_output,
        developer_output,
    )

    delivery_lead_review = await safe_agent_call(
        "Delivery Lead Agent",
        DELIVERY_LEAD_FALLBACK,
        generate_delivery_lead_review,
        combined_requirement,
        architecture,
        story_output,
        developer_output,
        qa_output,
    )

    quality_score = await safe_agent_call(
        "Quality Score Agent",
        QUALITY_SCORE_FALLBACK,
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


@app.post("/upgrade-package")
async def upgrade_package(request: UpgradePackageRequest):
    requirement = request.requirement
    current_package = request.current_package or {}

    architecture = build_architecture_from_package(current_package)
    story_output = build_story_output_from_package(current_package)

    developer_task = safe_agent_call(
        "Developer Agent",
        DEVELOPER_FALLBACK,
        generate_developer_notes,
        requirement,
        architecture,
        story_output,
    )

    diagram_task = safe_agent_call(
        "Diagram Agent",
        DIAGRAM_FALLBACK,
        generate_process_diagram,
        requirement,
        architecture,
        story_output,
    )

    developer_output, process_diagram = await asyncio.gather(
        developer_task,
        diagram_task,
    )

    qa_output = await safe_agent_call(
        "QA Agent",
        QA_FALLBACK,
        generate_qa_package,
        requirement,
        architecture,
        story_output,
        developer_output,
    )

    delivery_lead_review = await safe_agent_call(
        "Delivery Lead Agent",
        DELIVERY_LEAD_FALLBACK,
        generate_delivery_lead_review,
        requirement,
        architecture,
        story_output,
        developer_output,
        qa_output,
    )

    quality_score = await safe_agent_call(
        "Quality Score Agent",
        QUALITY_SCORE_FALLBACK,
        generate_quality_score,
        requirement,
        architecture,
        story_output,
        developer_output,
        qa_output,
        delivery_lead_review,
    )

    return {
        **current_package,
        "generation_mode": "full",
        "delivery_lead_review": delivery_lead_review,
        "process_diagram": process_diagram,
        "developer": developer_output,
        "qa": qa_output,
        "quality_score": quality_score,
    }


@app.post("/agent-review")
async def agent_review(request: AgentReviewRequest):
    review = await safe_agent_call(
        "Agent Review Board",
        {
            "overall_review_summary": "Agent review could not be generated. Check backend logs.",
            "architect_review": {
                "what_looks_good": [],
                "concerns": [],
                "recommended_improvements": [],
                "questions_for_business": [],
            },
            "developer_review": {
                "what_looks_good": [],
                "concerns": [],
                "recommended_improvements": [],
                "questions_for_business": [],
            },
            "qa_review": {
                "what_looks_good": [],
                "concerns": [],
                "recommended_improvements": [],
                "questions_for_business": [],
            },
            "delivery_lead_review": {
                "what_looks_good": [],
                "concerns": [],
                "recommended_improvements": [],
                "questions_for_business": [],
            },
            "priority_fixes": [],
            "final_verdict": "Review unavailable.",
        },
        generate_agent_review,
        request.requirement,
        request.current_package,
    )

    return review


@app.post("/delivery_lead_chat")
async def delivery_lead_chat(request: DeliveryLeadChatRequest):
    response = await safe_agent_call(
        "Delivery Lead Chat",
        {
            "answer": "Delivery Lead chat could not respond. Check backend logs.",
            "delivery_lead_recommendation": "",
            "artifact_type": "",
            "artifact_details": {},
            "suggested_requirement_update": "",
            "should_update_requirement": False,
            "impacted_sections": [],
            "follow_up_questions": [],
            "recommended_next_action": "Retry after checking backend logs.",
        },
        chat_with_delivery_lead,
        request.message,
        request.requirement,
        request.current_package,
        request.chat_history,
    )

    return response


@app.post("/generate-code")
def generate_code(request: CodeRequest):
    try:
        code_output = generate_code_for_technical_card(
            request.card,
            request.full_context,
        )
    except Exception as error:
        print("\n========== Code Generator FAILED ==========")
        print(str(error))
        traceback.print_exc()
        print("===========================================\n")
        code_output = "Unable to generate code. Check backend logs."

    return {
        "code": code_output,
    }


@app.post("/regenerate-section")
def regenerate_selected_section(request: RegenerateSectionRequest):
    try:
        regenerated_output = regenerate_section(
            request.section,
            request.requirement,
            request.current_package,
            request.user_instruction,
        )
    except Exception as error:
        print("\n========== Section Regenerator FAILED ==========")
        print(str(error))
        traceback.print_exc()
        print("================================================\n")
        regenerated_output = {
            "error": "Section regeneration failed. Check backend logs."
        }

    return {
        "section": request.section,
        "output": regenerated_output,
    }
