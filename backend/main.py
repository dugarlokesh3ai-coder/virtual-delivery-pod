from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Any
import asyncio
import time
import traceback

from agents.architect import generate_architecture
from agents.story import generate_stories
from agents.developer import generate_developer_notes
from agents.qa import generate_qa_package
from agents.code_generator import generate_code_for_technical_card
from utils.document_reader import extract_text_from_file
from agents.intake_analyzer import analyze_requirement_intake
from agents.diagram import generate_process_diagram
from agents.quality_score import generate_quality_score
from agents.section_regenerator import regenerate_section
from agents.agent_review import generate_agent_review
from agents.project_manager import generate_project_plan

# Delivery Lead review and Delivery Lead chat are separate agents.
# These fallback imports keep Render from failing if a function name changed during refactors.
try:
    from agents.delivery_lead import generate_delivery_lead_review
except ImportError:
    from agents.delivery_lead import generate_delivery_lead_chat as generate_delivery_lead_review

try:
    from agents.delivery_lead_chat import generate_delivery_lead_chat
except ImportError:
    from agents.delivery_lead_chat import chat_with_delivery_lead as generate_delivery_lead_chat

app = FastAPI(title="Virtual ServiceNow Delivery Pod API")


class CodeRequest(BaseModel):
    card: dict
    full_context: str


class AgentReviewRequest(BaseModel):
    requirement: str
    current_package: dict


class ProjectPlanRequest(BaseModel):
    requirement: str
    current_package: dict
    planning_inputs: dict = Field(default_factory=dict)


class DeliveryLeadChatRequest(BaseModel):
    message: str
    requirement: str
    current_package: Optional[dict] = None
    chat_history: list = Field(default_factory=list)


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

INTAKE_FALLBACK = {
    "understanding": "Unable to analyze requirement. Check backend logs.",
    "can_generate_package": False,
    "confidence": "Low",
    "clarifying_questions": [],
    "assumptions": [],
    "missing_requirements": [],
    "recommended_next_step": "Check backend logs and retry.",
}

PLATFORM_FIT_FALLBACK = {
    "recommended_approach": "Needs architect review.",
    "oob_options_considered": [],
    "oob_fit_assessment": "Platform fit decision unavailable. Review OOB/module fit manually before build.",
    "custom_build_needed": False,
    "customization_required": [],
    "technical_debt": [
        {
            "item": "Platform fit decision unavailable",
            "level": "Medium",
            "impact": "Build team may over-customize or select the wrong ServiceNow pattern.",
            "mitigation": "Run architect review and confirm OOB/module fit, licensing, and build readiness.",
        }
    ],
    "maintenance_impact": ["Unknown until OOB vs custom approach is confirmed."],
    "upgrade_impact": ["Unknown until customizations are confirmed."],
    "licensing_assumptions": ["ServiceNow licensing/module availability must be confirmed."],
    "pros": [],
    "cons": ["Architecture output did not include a platform-fit decision."],
    "final_recommendation": "Do not proceed to build handoff until platform-fit decision is completed.",
    "build_readiness_verdict": "Needs Discovery",
}


BUILD_READINESS_GATE_FALLBACK = {
    "verdict": "Needs Discovery",
    "reason": "Build readiness gate was not returned by the architecture agent.",
    "must_resolve_before_build": [
        "Confirm OOB/module fit, licensing, data model, security, routing, and integration boundaries before build handoff."
    ],
    "safe_to_generate_code": False,
}

SENSITIVE_DATA_CONTROLS_FALLBACK = {
    "sensitive_data_present": False,
    "data_types": [],
    "field_level_security": [],
    "attachment_security": [],
    "notification_privacy": [],
    "audit_retention": [],
    "encryption_or_masking": [],
    "open_questions": [],
}

PLATFORM_OBJECT_ACCURACY_FALLBACK = [
    "Validate ServiceNow table/object names in the customer instance before build. Use known OOB patterns such as sc_req_item, sc_task, and sysapproval_approver instead of invented table names."
]

ARCHITECTURE_FALLBACK = {
    "requirement_summary": "Architecture could not be generated. Check backend logs.",
    "solution_design": "",
    "recommended_app_type": "",
    "platform_fit_decision": PLATFORM_FIT_FALLBACK,
    "build_readiness_gate": BUILD_READINESS_GATE_FALLBACK,
    "sensitive_data_controls": SENSITIVE_DATA_CONTROLS_FALLBACK,
    "platform_object_accuracy_notes": PLATFORM_OBJECT_ACCURACY_FALLBACK,
    "tables": [],
    "workflow_steps": [],
    "risks": [],
    "open_questions": ["Architecture agent failed during generation."],
}

STORY_FALLBACK = {
    "epic": "",
    "stories": [],
    "assumptions": ["Story agent failed during generation. Check backend logs."],
    "dependencies": [],
}

AGENT_REVIEW_FALLBACK = {
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
    "consolidated_decisions_needed": [],
    "priority_fixes": [],
    "final_verdict": "Review unavailable.",
}


PROJECT_MANAGER_FALLBACK = {
    "project_plan_summary": {
        "recommended_delivery_approach": "Unable to generate project plan. Check backend logs.",
        "estimated_duration_weeks": None,
        "target_deployment_feasibility": "Not assessed",
        "complexity": "Unknown",
        "confidence_level": "Low",
        "summary": "Project Manager agent failed during generation.",
    },
    "total_loe": {"low_hours": None, "likely_hours": None, "high_hours": None},
    "cost_estimate": {
        "implementation_low": None,
        "implementation_likely": None,
        "implementation_high": None,
        "hypercare_cost": None,
        "monthly_maintenance_cost": None,
        "first_year_total": None,
    },
    "phase_plan": [],
    "milestone_schedule": [],
    "role_allocation": [],
    "hypercare_plan": {},
    "maintenance_plan": {},
    "assumptions": ["Project Manager agent failed during generation. Check backend logs."],
    "exclusions": [],
    "timeline_risks": [],
    "cost_risks": [],
    "mvp_scope_adjustments_to_hit_date": [],
    "recommended_next_steps": ["Check backend logs and regenerate the project plan."],
}

DELIVERY_LEAD_CHAT_FALLBACK = {
    "answer": "Delivery Lead chat could not respond. Check backend logs.",
    "delivery_lead_recommendation": "",
    "artifact_type": "",
    "artifact_details": {},
    "suggested_requirement_update": "",
    "should_update_requirement": False,
    "impacted_sections": [],
    "follow_up_questions": [],
    "recommended_next_action": "Retry after checking backend logs.",
}


def make_diagnostic(agent_name: str, status: str, started_at: float, error: Optional[Exception] = None):
    diagnostic = {
        "agent": agent_name,
        "status": status,
        "duration_ms": int((time.time() - started_at) * 1000),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    if error is not None:
        diagnostic["error"] = str(error)

    return diagnostic


async def safe_agent_call(
    agent_name: str,
    fallback: Any,
    func,
    *args,
    diagnostics: Optional[list] = None,
):
    started_at = time.time()

    try:
        output = await asyncio.to_thread(func, *args)
        if diagnostics is not None:
            diagnostics.append(make_diagnostic(agent_name, "success", started_at))
        return output
    except Exception as error:
        print(f"\n========== {agent_name} FAILED ==========")
        print(str(error))
        traceback.print_exc()
        print("========================================\n")

        if diagnostics is not None:
            diagnostics.append(make_diagnostic(agent_name, "fallback", started_at, error))

        return fallback


def safe_sync_call(agent_name: str, fallback: Any, func, *args):
    started_at = time.time()

    try:
        output = func(*args)
        return output, make_diagnostic(agent_name, "success", started_at)
    except Exception as error:
        print(f"\n========== {agent_name} FAILED ==========")
        print(str(error))
        traceback.print_exc()
        print("========================================\n")
        return fallback, make_diagnostic(agent_name, "fallback", started_at, error)


async def build_combined_requirement(
    requirement: str = "",
    files: Optional[List[UploadFile]] = None,
):
    uploaded_context = ""

    if files:
        extracted_docs = []

        for file in files:
            try:
                text = await extract_text_from_file(file)
            except Exception as error:
                print(f"Document extraction failed for {file.filename}: {error}")
                text = ""

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
    current_package = current_package or {}

    return {
        "requirement_summary": current_package.get("requirement_summary", ""),
        "solution_design": current_package.get("solution_design", ""),
        "recommended_app_type": current_package.get("recommended_app_type", ""),
        "platform_fit_decision": (
            current_package.get("platform_fit_decision")
            or current_package.get("oob_vs_custom_decision")
            or current_package.get("service_now_platform_fit")
            or PLATFORM_FIT_FALLBACK
        ),
        "build_readiness_gate": current_package.get("build_readiness_gate") or BUILD_READINESS_GATE_FALLBACK,
        "sensitive_data_controls": current_package.get("sensitive_data_controls") or SENSITIVE_DATA_CONTROLS_FALLBACK,
        "platform_object_accuracy_notes": current_package.get("platform_object_accuracy_notes", PLATFORM_OBJECT_ACCURACY_FALLBACK),
        "tables": current_package.get("tables", []),
        "workflow_steps": current_package.get("workflow_steps", []),
        "risks": current_package.get("risks", []),
        "open_questions": current_package.get("open_questions", []),
    }


def build_story_output_from_package(current_package: dict):
    current_package = current_package or {}

    return {
        "epic": current_package.get("epic", ""),
        "stories": current_package.get("stories", []),
        "assumptions": current_package.get("story_assumptions", []),
        "dependencies": current_package.get("story_dependencies", []),
    }


def build_package_response(
    generation_mode: str,
    architecture: dict,
    story_output: dict,
    delivery_lead_review: dict,
    process_diagram: Optional[dict],
    developer_output: Optional[dict],
    qa_output: Optional[dict],
    quality_score: Optional[dict],
    diagnostics: list,
):
    return {
        "generation_mode": generation_mode,
        "delivery_lead_review": delivery_lead_review,
        "process_diagram": process_diagram,
        "requirement_summary": architecture.get("requirement_summary", ""),
        "solution_design": architecture.get("solution_design", ""),
        "recommended_app_type": architecture.get("recommended_app_type", ""),
        "platform_fit_decision": architecture.get("platform_fit_decision") or PLATFORM_FIT_FALLBACK,
        "oob_vs_custom_decision": architecture.get("platform_fit_decision") or PLATFORM_FIT_FALLBACK,
        "service_now_platform_fit": architecture.get("platform_fit_decision") or PLATFORM_FIT_FALLBACK,
        "build_readiness_gate": architecture.get("build_readiness_gate") or BUILD_READINESS_GATE_FALLBACK,
        "sensitive_data_controls": architecture.get("sensitive_data_controls") or SENSITIVE_DATA_CONTROLS_FALLBACK,
        "platform_object_accuracy_notes": architecture.get("platform_object_accuracy_notes", PLATFORM_OBJECT_ACCURACY_FALLBACK),
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
        "diagnostics": diagnostics,
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://virtual-delivery-pod.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "backend running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze-requirement")
async def analyze_requirement(
    requirement: str = Form(""),
    files: Optional[List[UploadFile]] = File(None),
):
    diagnostics = []
    combined_requirement = await build_combined_requirement(requirement, files)

    intake_analysis = await safe_agent_call(
        "Intake Analyzer Agent",
        INTAKE_FALLBACK,
        analyze_requirement_intake,
        combined_requirement,
        diagnostics=diagnostics,
    )

    if isinstance(intake_analysis, dict):
        intake_analysis["diagnostics"] = diagnostics

    return intake_analysis


@app.post("/generate")
async def generate(
    requirement: str = Form(""),
    generation_mode: str = Form("full"),
    files: Optional[List[UploadFile]] = File(None),
):
    diagnostics = []
    combined_requirement = await build_combined_requirement(requirement, files)
    mode = "quick" if generation_mode == "quick" else "full"

    architecture = await safe_agent_call(
        "Architect Agent",
        ARCHITECTURE_FALLBACK,
        generate_architecture,
        combined_requirement,
        diagnostics=diagnostics,
    )

    story_output = await safe_agent_call(
        "Story Agent",
        STORY_FALLBACK,
        generate_stories,
        combined_requirement,
        architecture,
        diagnostics=diagnostics,
    )

    if mode == "quick":
        delivery_lead_review = await safe_agent_call(
            "Delivery Lead Agent",
            DELIVERY_LEAD_FALLBACK,
            generate_delivery_lead_review,
            combined_requirement,
            architecture,
            story_output,
            {},
            {},
            diagnostics=diagnostics,
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
            diagnostics=diagnostics,
        )

        return build_package_response(
            "quick",
            architecture,
            story_output,
            delivery_lead_review,
            None,
            None,
            None,
            quality_score,
            diagnostics,
        )

    developer_task = safe_agent_call(
        "Developer Agent",
        DEVELOPER_FALLBACK,
        generate_developer_notes,
        combined_requirement,
        architecture,
        story_output,
        diagnostics=diagnostics,
    )

    diagram_task = safe_agent_call(
        "Diagram Agent",
        DIAGRAM_FALLBACK,
        generate_process_diagram,
        combined_requirement,
        architecture,
        story_output,
        diagnostics=diagnostics,
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
        diagnostics=diagnostics,
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
        diagnostics=diagnostics,
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
        diagnostics=diagnostics,
    )

    return build_package_response(
        "full",
        architecture,
        story_output,
        delivery_lead_review,
        process_diagram,
        developer_output,
        qa_output,
        quality_score,
        diagnostics,
    )


@app.post("/upgrade-package")
async def upgrade_package(request: UpgradePackageRequest):
    diagnostics = []
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
        diagnostics=diagnostics,
    )

    diagram_task = safe_agent_call(
        "Diagram Agent",
        DIAGRAM_FALLBACK,
        generate_process_diagram,
        requirement,
        architecture,
        story_output,
        diagnostics=diagnostics,
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
        diagnostics=diagnostics,
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
        diagnostics=diagnostics,
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
        diagnostics=diagnostics,
    )

    return {
        **current_package,
        "generation_mode": "full",
        "platform_fit_decision": architecture.get("platform_fit_decision") or PLATFORM_FIT_FALLBACK,
        "oob_vs_custom_decision": architecture.get("platform_fit_decision") or PLATFORM_FIT_FALLBACK,
        "service_now_platform_fit": architecture.get("platform_fit_decision") or PLATFORM_FIT_FALLBACK,
        "build_readiness_gate": architecture.get("build_readiness_gate") or BUILD_READINESS_GATE_FALLBACK,
        "sensitive_data_controls": architecture.get("sensitive_data_controls") or SENSITIVE_DATA_CONTROLS_FALLBACK,
        "platform_object_accuracy_notes": architecture.get("platform_object_accuracy_notes", PLATFORM_OBJECT_ACCURACY_FALLBACK),
        "delivery_lead_review": delivery_lead_review,
        "process_diagram": process_diagram,
        "developer": developer_output,
        "qa": qa_output,
        "quality_score": quality_score,
        "diagnostics": diagnostics,
    }


@app.post("/agent-review")
async def agent_review(request: AgentReviewRequest):
    diagnostics = []

    review = await safe_agent_call(
        "Agent Review Board",
        AGENT_REVIEW_FALLBACK,
        generate_agent_review,
        request.requirement,
        request.current_package,
        diagnostics=diagnostics,
    )

    if isinstance(review, dict):
        review["diagnostics"] = diagnostics

    return review



@app.post("/project-plan")
async def project_plan(request: ProjectPlanRequest):
    diagnostics = []

    plan = await safe_agent_call(
        "Project Manager Agent",
        PROJECT_MANAGER_FALLBACK,
        generate_project_plan,
        request.requirement,
        request.current_package or {},
        request.planning_inputs or {},
        diagnostics=diagnostics,
    )

    if isinstance(plan, dict):
        plan["diagnostics"] = diagnostics

    return plan


@app.post("/delivery_lead_chat")
async def delivery_lead_chat(request: DeliveryLeadChatRequest):
    diagnostics = []

    response = await safe_agent_call(
        "Delivery Lead Chat",
        DELIVERY_LEAD_CHAT_FALLBACK,
        generate_delivery_lead_chat,
        request.message,
        request.requirement,
        request.current_package or {},
        request.chat_history or [],
        diagnostics=diagnostics,
    )

    if isinstance(response, dict):
        response["diagnostics"] = diagnostics

    return response


@app.post("/generate-code")
def generate_code(request: CodeRequest):
    code_output, diagnostic = safe_sync_call(
        "Code Generator",
        "Unable to generate code. Check backend logs.",
        generate_code_for_technical_card,
        request.card,
        request.full_context,
    )

    return {
        "code": code_output,
        "diagnostics": [diagnostic],
    }


@app.post("/regenerate-section")
def regenerate_selected_section(request: RegenerateSectionRequest):
    regenerated_output, diagnostic = safe_sync_call(
        "Section Regenerator",
        {"error": "Section regeneration failed. Check backend logs."},
        regenerate_section,
        request.section,
        request.requirement,
        request.current_package,
        request.user_instruction,
    )

    return {
        "section": request.section,
        "output": regenerated_output,
        "diagnostics": [diagnostic],
    }
