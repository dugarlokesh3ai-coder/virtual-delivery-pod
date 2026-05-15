"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

type TableItem = {
  table_name: string;
  purpose: string;
  type: string;
};

type RiskItem = {
  risk: string;
  mitigation: string;
};

type ProcessDiagram = {
  title: string;
  summary: string;
  mermaid_code: string;
  diagram_notes: string[];
};

type StoryItem = {
  title: string;
  persona: string;
  story: string;
  acceptance_criteria: string[];
  priority: string;
  notes: string;
};

type ServiceNowObject = {
  object_type: string;
  name: string;
  purpose: string;
};

type FlowDesignerNote = {
  flow_name: string;
  trigger: string;
  steps: string[];
};

type BusinessRule = {
  name: string;
  when: string;
  condition: string;
  purpose: string;
};

type DeveloperOutput = {
  implementation_summary: string;
  service_now_objects: ServiceNowObject[];
  flow_designer_notes: FlowDesignerNote[];
  business_rules: BusinessRule[];
  ui_policies: any[];
  acl_notes: string[];
  notification_notes: string[];
  deployment_notes: string[];
  technical_assumptions: string[];
};

type TestCase = {
  id: string;
  title: string;
  type: string;
  preconditions: string[];
  steps: string[];
  expected_result: string;
  priority: string;
};

type UATCase = {
  id: string;
  title: string;
  persona: string;
  steps: string[];
  expected_result: string;
};

type QAOutput = {
  test_strategy: string;
  test_scenarios: string[];
  test_cases: TestCase[];
  uat_cases: UATCase[];
  edge_cases: string[];
  test_data_needs: string[];
  regression_areas: string[];
};

type MissingRequirement = {
  gap: string;
  why_it_matters: string;
};

type DeliveryLeadReview = {
  understanding: string;
  mvp_scope: string[];
  phase_2_scope: string[];
  assumptions: string[];
  missing_requirements: MissingRequirement[];
  clarifying_questions: string[];
  recommended_next_steps: string[];
};

type IntakeAnalysis = {
  understanding: string;
  can_generate_package: boolean;
  confidence: string;
  clarifying_questions: string[];
  assumptions: string[];
  missing_requirements: MissingRequirement[];
  recommended_next_step: string;
};

type DeliveryResult = {
  delivery_lead_review: DeliveryLeadReview;
  process_diagram: ProcessDiagram;
  requirement_summary: string;
  solution_design: string;
  recommended_app_type: string;
  tables: TableItem[];
  workflow_steps: string[];
  risks: RiskItem[];
  open_questions: string[];
  epic: string;
  stories: StoryItem[];
  story_assumptions: string[];
  story_dependencies: string[];
  developer: DeveloperOutput;
  qa: QAOutput;
  quality_score: QualityScore;
};

type QualityScore = {
  overall_score: number;
  completeness_score: number;
  risk_score: number;
  readiness_score: number;
  rating: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommended_fixes: string[];
};

type ActiveTab = "stories" | "technical" | "qa";

type SavedProject = {
  id: string;
  project_name: string;
  created_at: string;
  updated_at: string;
  requirement: string;
  clarification_answers: string;
  uploaded_file_names: string[];
  result: DeliveryResult | null;
};

type RequirementTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  requirement: string;
};

const PROJECT_STORAGE_KEY = "virtual_delivery_pod_saved_projects";

const REQUIREMENT_TEMPLATES: RequirementTemplate[] = [
  {
    id: "vendor-onboarding",
    name: "Vendor Onboarding",
    category: "Sourcing / Vendor Management",
    description:
      "Scoped app for vendor onboarding, sourcing group triage, approvals, reminders, and revalidation.",
    requirement: `Build a ServiceNow scoped application for vendor onboarding.

The request is initiated by an internal associate. The request should capture vendor details, submitter details, type of work the vendor performs, business unit working with the vendor, vendor point of contact, states where work is provided, and sourcing group responsible for the request.

The type of work should determine the sourcing group:
- IT work goes to Sourcing - IT Team
- HR work goes to Sourcing - HR Team
- Clinical work goes to Sourcing - Clinical Team
- Other categories should be configurable

The sourcing group should assign a member to work the request. Approvals should run in parallel. No SLA is required, but reminder emails should go out after 10 business days, then every 5 business days until approval is completed.

Approved vendors should become available as existing vendors in a lookup table. Vendor revalidation should happen every 2 years unless the vendor has an active contract; if there is an active contract, revalidation should happen after the contract ends.

Need an admin group. Need a lookup/configuration table for dropdown values and sourcing groups. No direct Jira or ServiceNow external integration is required for MVP.`,
  },
  {
    id: "project-intake",
    name: "Project Intake",
    category: "PMO / Intake",
    description:
      "Internal project request intake with portfolio routing, triage, approvals, notifications, and reporting.",
    requirement: `Build a ServiceNow scoped application for internal project intake.

Any internal employee should be able to submit a project request. The request should capture project title, description, submitter, department, business unit, portfolio, market, requested due date, priority, and estimated business impact.

The system should auto-route the request to the correct triage group based on selected portfolio. Triage users should review the request and move it through Draft, Submitted, Work in Progress, Pending Approval, Approved, Rejected, and Complete.

Approvals should be based on market and line of business. The triage team should be able to maintain approver mappings. Submitters should not be able to change approval mappings.

Notifications are needed when a request is submitted, when approval is required, when approved, when rejected, and when completed.

MVP reporting should include number of requests by portfolio, pending approvals, rejected requests, and average time from submission to completion.`,
  },
  {
    id: "access-request",
    name: "Access Request",
    category: "IT / Security",
    description:
      "Access request workflow with manager approval, app owner approval, provisioning task, and audit trail.",
    requirement: `Build a ServiceNow access request process.

Employees should submit requests for application access. The form should capture requested application, access level, business justification, requested for user, manager, department, and requested duration.

The request should route first to the user's manager for approval. After manager approval, it should route to the application owner. If approved by the application owner, a fulfillment task should be created for the access provisioning team.

If rejected at any approval step, the request should move to Rejected and require rejection comments. Submitter and requested-for user should receive notifications.

The system should capture audit history of approvals, fulfillment, and completion. Access should have an expiration date when temporary access is selected. Reporting should show open requests, pending approvals, completed requests, and rejected requests.`,
  },
  {
    id: "hr-case-intake",
    name: "HR Case Intake",
    category: "HR",
    description:
      "HR case intake with category routing, HR assignment, employee notifications, and confidentiality controls.",
    requirement: `Build an HR case intake workflow in ServiceNow.

Employees should submit HR requests through a form. The request should capture employee name, employee ID, department, HR category, request description, priority, preferred contact method, and attachments.

The HR category should route the case to the correct HR group such as Benefits, Payroll, Employee Relations, or HR Operations. HR team members should be able to assign the case to themselves or another HR specialist.

States should include New, Assigned, Awaiting Employee, Work in Progress, Resolved, and Closed. Employees should receive notifications when the case is created, when HR asks for more information, when resolved, and when closed.

Sensitive HR cases should have restricted visibility. Only assigned HR users, HR admins, and the submitter should be able to view appropriate case details.

Reports should include cases by category, open cases by HR group, average resolution time, and cases awaiting employee response.`,
  },
  {
    id: "grc-issue-management",
    name: "GRC Issue Management",
    category: "Risk / Compliance",
    description:
      "Issue intake and remediation workflow with owner assignment, due dates, evidence, and closure review.",
    requirement: `Build a GRC issue management workflow in ServiceNow.

Users should be able to create compliance or audit issues. The issue should capture issue title, description, source, risk rating, control area, business owner, remediation owner, due date, and required evidence.

The workflow should route new issues to the GRC team for review. The GRC team should validate the issue and assign remediation ownership. Remediation owners should update remediation plan, target dates, status, and upload evidence.

States should include Draft, Submitted, Under Review, Assigned for Remediation, Remediation in Progress, Evidence Submitted, Closure Review, Closed, and Rejected.

Notifications should be sent when issues are assigned, when due dates are approaching, when evidence is submitted, and when closure is approved or rejected.

Reports should include open issues by risk rating, overdue issues, issues by business owner, and issues pending closure review.`,
  },
  {
    id: "contract-review",
    name: "Contract Review",
    category: "Legal / Procurement",
    description:
      "Contract review intake with legal/procurement routing, approvals, comments, and document tracking.",
    requirement: `Build a contract review intake process in ServiceNow.

Internal users should submit contracts for review. The form should capture contract title, vendor, contract type, business owner, estimated value, effective date, expiration date, requested completion date, risk level, and uploaded contract documents.

Requests should route based on contract type and risk level. Legal should review legal terms. Procurement should review commercial terms. Finance approval should be required when estimated value is above a configurable threshold.

Approvals can run in parallel where possible. Reviewers should be able to add comments and request more information. Submitters should receive notifications when more information is needed, when review is complete, and when rejected.

The process should maintain document history and review history. Reports should include pending reviews, average review duration, contracts by risk level, and contracts expiring soon.`,
  },
  {
    id: "policy-exception",
    name: "Policy Exception",
    category: "Risk / Policy",
    description:
      "Policy exception request workflow with risk review, approvals, expiration, and periodic review.",
    requirement: `Build a policy exception request process in ServiceNow.

Employees should submit requests for exceptions to internal policies. The form should capture policy name, exception reason, business justification, affected system/process, requested duration, compensating controls, business owner, and risk impact.

The request should route to the policy owner and risk/compliance team for review. Approvals should be required before the exception is active. Rejections should require comments.

Approved exceptions should have an expiration date. The system should send reminders before expiration and allow extension requests. Expired exceptions should be marked inactive unless extended and approved.

Reports should show active exceptions, expired exceptions, exceptions by policy, high-risk exceptions, and upcoming expirations.`,
  },
  {
    id: "custom-app-request",
    name: "Custom App Request",
    category: "ServiceNow Platform",
    description:
      "Generic scoped app request with intake, states, routing, approvals, tasks, and reporting.",
    requirement: `Build a custom ServiceNow scoped application for a business process.

The app should include a request table, configurable dropdown values, role-based access, assignment group routing, approval workflow, notifications, and reporting.

Users should submit requests through a form. The form should capture submitter, business unit, request category, priority, description, requested due date, and attachments.

The request should route to a responsible group based on category. Assigned users should work the request through states: Draft, Submitted, Work in Progress, Pending Approval, Approved, Rejected, Complete, and Cancelled.

Approvals should be configurable based on request category and business unit. Admin users should maintain lookup values and approval mappings.

Reports should include open requests, requests by category, pending approvals, rejected requests, and average completion time.`,
  },
];

export default function Home() {
  const [requirement, setRequirement] = useState("");
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("stories");
  const [files, setFiles] = useState<File[]>([]);
  const [loadingStage, setLoadingStage] = useState("");

  const [intakeAnalysis, setIntakeAnalysis] =
    useState<IntakeAnalysis | null>(null);
  const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [analyzing, setAnalyzing] = useState(false);
  const [clarificationAnswers, setClarificationAnswers] = useState("");

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [selectedCodeTitle, setSelectedCodeTitle] = useState("");
  const [selectedCode, setSelectedCode] = useState("");

  const [regenerateInstruction, setRegenerateInstruction] = useState("");
  const [regeneratingSection, setRegeneratingSection] = useState("");

  const [projectName, setProjectName] = useState("");
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as SavedProject[];
      setSavedProjects(parsed);
    } catch (error) {
      console.error("Unable to load saved projects", error);
    }
  }, []);

  function persistProjects(projects: SavedProject[]) {
    setSavedProjects(projects);
    window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
  }

  function buildRequirementWithClarifications() {
  return `
  Original Requirement:
  ${requirement}

  Clarification Answers:
  ${clarificationAnswers}
  `;
  }

  async function analyzeRequirement() {
    if (!requirement.trim() && files.length === 0) {
      alert("Paste a business process or upload a document first.");
      return;
    }

    setAnalyzing(true);
    setLoadingStage("Delivery Lead is reviewing requirement intake...");

    try {
      const formData = new FormData();
      formData.append("requirement", buildRequirementWithClarifications());

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${API_BASE_URL}/analyze-requirement`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analyze requirement failed");
      }

      const data = await response.json();
      setIntakeAnalysis(data);
      setResult(null);
    } catch (error) {
      console.error(error);
      alert("Analyze failed. Check your backend terminal.");
    } finally {
      setAnalyzing(false);
      setLoadingStage("");
    }
  }

  function getScoreColor(score: number) {
      if (score >= 85) return "#15803D";
      if (score >= 70) return "#2563EB";
      if (score >= 50) return "#B45309";
      return "#B91C1C";
    }

    function getScoreBackground(score: number) {
      if (score >= 85) return "#DCFCE7";
      if (score >= 70) return "#DBEAFE";
      if (score >= 50) return "#FEF3C7";
      return "#FEE2E2";
    }

  function createProjectId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return `project-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function saveProject() {
    if (!projectName.trim()) {
      alert("Enter a project name first.");
      return;
    }

    const now = new Date().toISOString();
    const existingProject = activeProjectId
      ? savedProjects.find((project) => project.id === activeProjectId)
      : null;

    const projectToSave: SavedProject = {
      id: existingProject?.id || createProjectId(),
      project_name: projectName.trim(),
      created_at: existingProject?.created_at || now,
      updated_at: now,
      requirement,
      clarification_answers: clarificationAnswers,
      uploaded_file_names: files.map((file) => file.name),
      result,
    };

    const nextProjects = existingProject
      ? savedProjects.map((project) =>
          project.id === existingProject.id ? projectToSave : project
        )
      : [projectToSave, ...savedProjects];

    persistProjects(nextProjects);
    setActiveProjectId(projectToSave.id);
    alert("Project saved.");
  }

  function loadProject(project: SavedProject) {
    setProjectName(project.project_name);
    setRequirement(project.requirement || "");
    setClarificationAnswers(project.clarification_answers || "");
    setResult(project.result);
    setFiles([]);
    setIntakeAnalysis(null);
    setActiveProjectId(project.id);
    setActiveTab("stories");
    setRegenerateInstruction("");
  }

  function clearWorkspace() {
    setActiveProjectId(null);
    setProjectName("");

    setRequirement("");
    setClarificationAnswers("");
    setFiles([]);

    setIntakeAnalysis(null);
    setResult(null);

    setActiveTab("stories");
    setLoadingStage("");

    setCodeModalOpen(false);
    setCodeLoading(false);
    setSelectedCodeTitle("");
    setSelectedCode("");

    setRegenerateInstruction("");
    setRegeneratingSection("");
  }

  function newProject() {
    const hasWorkspaceContent =
      !!projectName.trim() ||
      !!requirement.trim() ||
      !!clarificationAnswers.trim() ||
      files.length > 0 ||
      !!intakeAnalysis ||
      !!result;

    if (hasWorkspaceContent) {
      const confirmNew = window.confirm(
        "Start a new project? Unsaved changes in the current workspace will be cleared."
      );

      if (!confirmNew) return;
    }

    clearWorkspace();
  }

  function deleteProject(projectId: string) {
    const confirmed = window.confirm("Delete this saved project?");
    if (!confirmed) return;

    const nextProjects = savedProjects.filter((project) => project.id !== projectId);
    persistProjects(nextProjects);

    if (activeProjectId === projectId) {
      clearWorkspace();
    }
  }


  function applyTemplate(template: RequirementTemplate) {
    const hasExistingWork =
      !!requirement.trim() ||
      !!clarificationAnswers.trim() ||
      files.length > 0 ||
      !!intakeAnalysis ||
      !!result;

    if (hasExistingWork) {
      const confirmed = window.confirm(
        "Apply this template? It will replace the current requirement text and clear current analysis/output."
      );

      if (!confirmed) return;
    }

    setProjectName(template.name);
    setRequirement(template.requirement);
    setClarificationAnswers("");
    setFiles([]);
    setIntakeAnalysis(null);
    setResult(null);
    setActiveProjectId(null);
    setActiveTab("stories");
    setLoadingStage("");
    setRegenerateInstruction("");
    setRegeneratingSection("");
    setShowTemplates(false);
  }

  async function generatePackage() {
    if (!requirement.trim() && files.length === 0) {
      alert("Paste a business process or upload a document first.");
      return;
    }

    setLoading(true);
    setLoadingStage("Reading requirement and uploaded documents...");

    const stageTimers = [
      setTimeout(
        () => setLoadingStage("Architect is creating solution design..."),
        900
      ),
      setTimeout(
        () =>
          setLoadingStage("BSA is writing stories and acceptance criteria..."),
        2600
      ),
      setTimeout(
        () => setLoadingStage("Developer is preparing technical notes..."),
        5200
      ),
      setTimeout(
        () => setLoadingStage("QA is building test cases and UAT scenarios..."),
        7800
      ),
      setTimeout(
        () => setLoadingStage("Delivery Lead is assembling final package..."),
        10400
      ),
    ];

    try {
      const formData = new FormData();

      formData.append("requirement", buildRequirementWithClarifications());

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const data = await response.json();
      setResult(data);
      setActiveTab("stories");
    } catch (error) {
      console.error(error);
      alert("Something failed. Check your backend terminal.");
    } finally {
      stageTimers.forEach((timer) => clearTimeout(timer));
      setLoading(false);
      setLoadingStage("");
    }
  }

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value);
    alert("Copied.");
  }

  function buildMarkdown(data: DeliveryResult) {
    return `# Virtual ServiceNow Delivery Package

## Delivery Lead Review

### Understanding
${data.delivery_lead_review?.understanding || ""}

### MVP Scope
${data.delivery_lead_review?.mvp_scope?.map((item) => `- ${item}`).join("\n")}

### Phase 2 Scope
${data.delivery_lead_review?.phase_2_scope
  ?.map((item) => `- ${item}`)
  .join("\n")}

### Clarifying Questions
${data.delivery_lead_review?.clarifying_questions
  ?.map((item) => `- ${item}`)
  .join("\n")}

### Missing / Weak Requirements
${data.delivery_lead_review?.missing_requirements
  ?.map(
    (item) =>
      `- **Gap:** ${item.gap}\n  - **Why it matters:** ${item.why_it_matters}`
  )
  .join("\n")}

### Assumptions
${data.delivery_lead_review?.assumptions
  ?.map((item) => `- ${item}`)
  .join("\n")}

### Recommended Next Steps
${data.delivery_lead_review?.recommended_next_steps
  ?.map((item) => `- ${item}`)
  .join("\n")}

## Process / State Flow Diagram

### ${data.process_diagram?.title || "Process Flow"}
${data.process_diagram?.summary || ""}

\`\`\`mermaid
${data.process_diagram?.mermaid_code || ""}
\`\`\`

### Diagram Notes
${data.process_diagram?.diagram_notes?.map((note) => `- ${note}`).join("\n")}

## Delivery Quality Score

Overall Score: ${data.quality_score?.overall_score || 0}/100  
Completeness Score: ${data.quality_score?.completeness_score || 0}/100  
Risk Score: ${data.quality_score?.risk_score || 0}/100  
Readiness Score: ${data.quality_score?.readiness_score || 0}/100  
Rating: ${data.quality_score?.rating || ""}

### Quality Summary
${data.quality_score?.summary || ""}

### Strengths
${data.quality_score?.strengths?.map((item) => `- ${item}`).join("\n")}

### Weaknesses
${data.quality_score?.weaknesses?.map((item) => `- ${item}`).join("\n")}

### Recommended Fixes
${data.quality_score?.recommended_fixes?.map((item) => `- ${item}`).join("\n")}

---

## Requirement Summary
${data.requirement_summary}

## Recommended App Type
${data.recommended_app_type}

## Solution Design
${data.solution_design}

## Proposed Tables
${data.tables
  ?.map((t) => `- **${t.table_name}** (${t.type}): ${t.purpose}`)
  .join("\n")}

## Workflow Steps
${data.workflow_steps?.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Risks
${data.risks
  ?.map((r) => `- **Risk:** ${r.risk}\n  - **Mitigation:** ${r.mitigation}`)
  .join("\n")}

## Open Questions
${data.open_questions?.map((q) => `- ${q}`).join("\n")}

## Epic
${data.epic}

## Stories
${data.stories
  ?.map(
    (s) => `### ${s.title}

${s.story}

**Priority:** ${s.priority}

**Acceptance Criteria:**
${s.acceptance_criteria?.map((a) => `- ${a}`).join("\n")}
`
  )
  .join("\n")}

## Technical Notes

### Implementation Summary
${data.developer?.implementation_summary || ""}

### ServiceNow Objects
${data.developer?.service_now_objects
  ?.map((o) => `- **${o.name}** (${o.object_type}): ${o.purpose}`)
  .join("\n")}

### Flow Designer Notes
${data.developer?.flow_designer_notes
  ?.map(
    (f) => `#### ${f.flow_name}
Trigger: ${f.trigger}

${f.steps?.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`
  )
  .join("\n")}

### Business Rules
${data.developer?.business_rules
  ?.map(
    (b) => `- **${b.name}** (${b.when})
  - Condition: ${b.condition}
  - Purpose: ${b.purpose}`
  )
  .join("\n")}

## QA

### Test Strategy
${data.qa?.test_strategy || ""}

### Test Cases
${data.qa?.test_cases
  ?.map(
    (tc) => `#### ${tc.id}: ${tc.title}
Type: ${tc.type}
Priority: ${tc.priority}

Steps:
${tc.steps?.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Expected Result:
${tc.expected_result}
`
  )
  .join("\n")}

### UAT Cases
${data.qa?.uat_cases
  ?.map(
    (uat) => `#### ${uat.id}: ${uat.title}
Persona: ${uat.persona}

Steps:
${uat.steps?.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Expected Result:
${uat.expected_result}
`
  )
  .join("\n")}
`;
  }

  function exportMarkdown() {
    if (!result) return;

    const markdown = buildMarkdown(result);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "servicenow-delivery-package.md";
    a.click();

    URL.revokeObjectURL(url);
  }

  async function generateCodeForCard(card: any, title: string) {
    setCodeModalOpen(true);
    setCodeLoading(true);
    setSelectedCodeTitle(title);
    setSelectedCode("");

    try {
      const response = await fetch(`${API_BASE_URL}/generate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          card,
          full_context: buildTechnicalContext(),
        }),
      });

      if (!response.ok) {
        throw new Error("Code generation failed");
      }

      const data = await response.json();
      setSelectedCode(data.code || "");
    } catch (error) {
      console.error(error);
      setSelectedCode(
        "Unable to generate code. Check that the backend /generate-code endpoint is running."
      );
    } finally {
      setCodeLoading(false);
    }
  }

  function buildTechnicalContext() {
    return JSON.stringify(
      {
        requirement,
        clarificationAnswers,
        files: files.map((file) => file.name),
        result,
      },
      null,
      2
    );
  }

  async function regenerateSection(section: string) {
    if (!result) {
      alert("Generate a package first.");
      return;
    }

    if (!regenerateInstruction.trim()) {
      alert("Enter an instruction for what to improve.");
      return;
    }

    setRegeneratingSection(section);
    setLoadingStage(`Regenerating ${section.replaceAll("_", " ")}...`);

    try {
      const response = await fetch(`${API_BASE_URL}/regenerate-section`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section,
          requirement: buildRequirementWithClarifications(),
          current_package: result,
          user_instruction: regenerateInstruction,
        }),
      });

      if (!response.ok) {
        throw new Error("Regenerate section failed");
      }

      const data = await response.json();
      const output = data.output;

      if (output?.error) {
        alert(output.error);
        return;
      }

      if (section === "delivery_lead_review") {
        setResult({ ...result, delivery_lead_review: output });
      }

      if (section === "solution_design") {
        setResult({
          ...result,
          requirement_summary: output.requirement_summary || result.requirement_summary,
          solution_design: output.solution_design || result.solution_design,
          recommended_app_type: output.recommended_app_type || result.recommended_app_type,
          tables: output.tables || result.tables,
          workflow_steps: output.workflow_steps || result.workflow_steps,
          risks: output.risks || result.risks,
          open_questions: output.open_questions || result.open_questions,
        });
      }

      if (section === "stories") {
        setResult({
          ...result,
          epic: output.epic || result.epic,
          stories: output.stories || result.stories,
          story_assumptions: output.story_assumptions || [],
          story_dependencies: output.story_dependencies || [],
        });
      }

      if (section === "developer") {
        setResult({ ...result, developer: output });
      }

      if (section === "qa") {
        setResult({ ...result, qa: output });
      }

      if (section === "process_diagram") {
        setResult({ ...result, process_diagram: output });
      }

      if (section === "quality_score") {
        setResult({ ...result, quality_score: output });
      }

      setRegenerateInstruction("");
    } catch (error) {
      console.error(error);
      alert("Regeneration failed. Check your backend terminal.");
    } finally {
      setRegeneratingSection("");
      setLoadingStage("");
    }
  }


  function docHeading(text: string, level: any = HeadingLevel.HEADING_1) {
    return new Paragraph({
      text,
      heading: level,
      spacing: { before: 300, after: 160 },
    });
  }

  function docParagraph(text?: string) {
    return new Paragraph({
      children: [
        new TextRun({
          text: text || "",
          size: 22,
        }),
      ],
      spacing: { after: 120 },
    });
  }

  function docBullet(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, size: 22 })],
      bullet: { level: 0 },
      spacing: { after: 80 },
    });
  }

  function docTable(headers: string[], rows: string[][]) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: headers.map(
            (header) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: header,
                        bold: true,
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: "CBD5E1",
                  },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: "CBD5E1",
                  },
                },
              })
          ),
        }),
        ...rows.map(
          (row) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [docParagraph(cell)],
                    borders: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "E2E8F0",
                      },
                      bottom: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "E2E8F0",
                      },
                      left: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "E2E8F0",
                      },
                      right: {
                        style: BorderStyle.SINGLE,
                        size: 1,
                        color: "E2E8F0",
                      },
                    },
                  })
              ),
            })
        ),
      ],
    });
  }

  async function exportDocx() {
    if (!result) return;

    const children: any[] = [];

    children.push(
      new Paragraph({
        text: "Virtual ServiceNow Delivery Package",
        heading: HeadingLevel.TITLE,
        spacing: { after: 300 },
      })
    );

    children.push(docHeading("Delivery Lead Review"));
    children.push(docHeading("Understanding", HeadingLevel.HEADING_2));
    children.push(docParagraph(result.delivery_lead_review?.understanding));

    children.push(docHeading("MVP Scope", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.mvp_scope?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("Phase 2 Scope", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.phase_2_scope?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("Clarifying Questions", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.clarifying_questions?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("Missing / Weak Requirements", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.missing_requirements?.forEach((item) => {
      children.push(docBullet(`Gap: ${item.gap}`));
      children.push(docParagraph(`Why it matters: ${item.why_it_matters}`));
    });

    children.push(docHeading("Assumptions", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.assumptions?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("Recommended Next Steps", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.recommended_next_steps?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("Delivery Quality Score"));
    children.push(
      docParagraph(`Overall Score: ${result.quality_score?.overall_score || 0}/100`)
    );
    children.push(
      docParagraph(
        `Completeness Score: ${result.quality_score?.completeness_score || 0}/100`
      )
    );
    children.push(
      docParagraph(`Risk Score: ${result.quality_score?.risk_score || 0}/100`)
    );
    children.push(
      docParagraph(
        `Readiness Score: ${result.quality_score?.readiness_score || 0}/100`
      )
    );
    children.push(docParagraph(`Rating: ${result.quality_score?.rating || ""}`));
    children.push(docParagraph(result.quality_score?.summary));

    children.push(docHeading("Strengths", HeadingLevel.HEADING_2));
    result.quality_score?.strengths?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("Weaknesses", HeadingLevel.HEADING_2));
    result.quality_score?.weaknesses?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("Recommended Fixes", HeadingLevel.HEADING_2));
    result.quality_score?.recommended_fixes?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("Process / State Flow Diagram"));
    children.push(docParagraph(result.process_diagram?.title));
    children.push(docParagraph(result.process_diagram?.summary));
    children.push(docHeading("Mermaid Code", HeadingLevel.HEADING_2));
    children.push(docParagraph(result.process_diagram?.mermaid_code));
    children.push(docHeading("Diagram Notes", HeadingLevel.HEADING_2));
    result.process_diagram?.diagram_notes?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("Requirement Summary"));
    children.push(docParagraph(result.requirement_summary));

    children.push(docHeading("Recommended App Type"));
    children.push(docParagraph(result.recommended_app_type));

    children.push(docHeading("Solution Design"));
    children.push(docParagraph(result.solution_design));

    children.push(docHeading("Proposed Tables"));
    children.push(
      docTable(
        ["Table", "Type", "Purpose"],
        result.tables?.map((table) => [
          table.table_name,
          table.type,
          table.purpose,
        ]) || []
      )
    );

    children.push(docHeading("Workflow Steps"));
    result.workflow_steps?.forEach((step) => children.push(docBullet(step)));

    children.push(docHeading("Risks"));
    result.risks?.forEach((risk) => {
      children.push(docBullet(`Risk: ${risk.risk}`));
      children.push(docParagraph(`Mitigation: ${risk.mitigation}`));
    });

    children.push(docHeading("Open Questions"));
    result.open_questions?.forEach((question) => children.push(docBullet(question)));

    children.push(docHeading("Stories"));
    if (result.epic) {
      children.push(docHeading("Epic", HeadingLevel.HEADING_2));
      children.push(docParagraph(result.epic));
    }

    result.stories?.forEach((story) => {
      children.push(docHeading(story.title, HeadingLevel.HEADING_2));
      children.push(docParagraph(story.story));
      children.push(docParagraph(`Priority: ${story.priority}`));
      children.push(docHeading("Acceptance Criteria", HeadingLevel.HEADING_3));
      story.acceptance_criteria?.forEach((criteria) =>
        children.push(docBullet(criteria))
      );
      if (story.notes) {
        children.push(docParagraph(`Notes: ${story.notes}`));
      }
    });

    children.push(docHeading("Technical Notes"));
    children.push(docParagraph(result.developer?.implementation_summary));

    children.push(docHeading("ServiceNow Objects", HeadingLevel.HEADING_2));
    result.developer?.service_now_objects?.forEach((object) => {
      children.push(docBullet(`${object.name} (${object.object_type})`));
      children.push(docParagraph(object.purpose));
    });

    children.push(docHeading("Flow Designer Notes", HeadingLevel.HEADING_2));
    result.developer?.flow_designer_notes?.forEach((flow) => {
      children.push(docHeading(flow.flow_name, HeadingLevel.HEADING_3));
      children.push(docParagraph(`Trigger: ${flow.trigger}`));
      flow.steps?.forEach((step) => children.push(docBullet(step)));
    });

    children.push(docHeading("Business Rules", HeadingLevel.HEADING_2));
    result.developer?.business_rules?.forEach((rule) => {
      children.push(docHeading(rule.name, HeadingLevel.HEADING_3));
      children.push(docParagraph(`When: ${rule.when}`));
      children.push(docParagraph(`Condition: ${rule.condition}`));
      children.push(docParagraph(`Purpose: ${rule.purpose}`));
    });

    children.push(docHeading("ACL Notes", HeadingLevel.HEADING_2));
    result.developer?.acl_notes?.forEach((item) => children.push(docBullet(item)));

    children.push(docHeading("Notification Notes", HeadingLevel.HEADING_2));
    result.developer?.notification_notes?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("Deployment Notes", HeadingLevel.HEADING_2));
    result.developer?.deployment_notes?.forEach((item) =>
      children.push(docBullet(item))
    );

    children.push(docHeading("QA"));
    children.push(docParagraph(result.qa?.test_strategy));

    children.push(docHeading("Test Scenarios", HeadingLevel.HEADING_2));
    result.qa?.test_scenarios?.forEach((scenario) =>
      children.push(docBullet(scenario))
    );

    children.push(docHeading("Test Cases", HeadingLevel.HEADING_2));
    result.qa?.test_cases?.forEach((test) => {
      children.push(docHeading(`${test.id}: ${test.title}`, HeadingLevel.HEADING_3));
      children.push(docParagraph(`Type: ${test.type}`));
      children.push(docParagraph(`Priority: ${test.priority}`));
      children.push(docHeading("Preconditions", HeadingLevel.HEADING_4));
      test.preconditions?.forEach((step) => children.push(docBullet(step)));
      children.push(docHeading("Steps", HeadingLevel.HEADING_4));
      test.steps?.forEach((step) => children.push(docBullet(step)));
      children.push(docParagraph(`Expected Result: ${test.expected_result}`));
    });

    children.push(docHeading("UAT Cases", HeadingLevel.HEADING_2));
    result.qa?.uat_cases?.forEach((uat) => {
      children.push(docHeading(`${uat.id}: ${uat.title}`, HeadingLevel.HEADING_3));
      children.push(docParagraph(`Persona: ${uat.persona}`));
      uat.steps?.forEach((step) => children.push(docBullet(step)));
      children.push(docParagraph(`Expected Result: ${uat.expected_result}`));
    });

    children.push(docHeading("Edge Cases", HeadingLevel.HEADING_2));
    result.qa?.edge_cases?.forEach((edgeCase) =>
      children.push(docBullet(edgeCase))
    );

    children.push(docHeading("Test Data Needs", HeadingLevel.HEADING_2));
    result.qa?.test_data_needs?.forEach((item) => children.push(docBullet(item)));

    children.push(docHeading("Regression Areas", HeadingLevel.HEADING_2));
    result.qa?.regression_areas?.forEach((item) => children.push(docBullet(item)));

    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "servicenow-delivery-package.docx");
  }


  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.kicker}>AI Delivery Workspace</div>
            <h1 style={styles.title}>Virtual ServiceNow Delivery Pod</h1>
            <p style={styles.subtitle}>
              Paste requirements or upload documents. The Delivery Lead converts
              them into solution design, stories, technical notes, and QA
              artifacts.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              onClick={analyzeRequirement}
              disabled={analyzing || loading}
              style={{
                ...styles.secondaryButton,
                opacity: analyzing || loading ? 0.65 : 1,
                cursor: analyzing || loading ? "not-allowed" : "pointer",
              }}
            >
              {analyzing ? "Analyzing..." : "Analyze Requirement"}
            </button>

            {result && (
              <>
                <button onClick={exportMarkdown} style={styles.secondaryButton}>
                  Export Markdown
                </button>

                <button onClick={exportDocx} style={styles.secondaryButton}>
                  Export DOCX
                </button>
              </>
            )}

            <button
              onClick={generatePackage}
              disabled={loading || analyzing}
              style={{
                ...styles.button,
                opacity: loading || analyzing ? 0.65 : 1,
                cursor: loading || analyzing ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Generating..." : "Generate Package"}
            </button>
          </div>
        </header>

        <section style={styles.projectBar}>
          <div style={styles.projectBarTop}>
            <div>
              <p style={styles.label}>Project Workspace</p>
              <h2 style={styles.projectBarTitle}>Save and reload delivery packages</h2>
            </div>

            <div style={styles.projectActions}>
              <button onClick={newProject} style={styles.secondaryButton}>
                New / Clear
              </button>

              <button onClick={saveProject} style={styles.button}>
                {activeProjectId ? "Update Project" : "Save Project"}
              </button>
            </div>
          </div>

          <div style={styles.projectControls}>
            <div style={styles.projectField}>
              <label style={styles.projectLabel}>Current Project</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Name this delivery package..."
                style={styles.projectInput}
              />
            </div>

            <div style={styles.projectField}>
              <label style={styles.projectLabel}>Saved Projects</label>
              <select
                value={activeProjectId || ""}
                onChange={(e) => {
                  const selected = savedProjects.find(
                    (project) => project.id === e.target.value
                  );
                  if (selected) loadProject(selected);
                }}
                style={styles.projectSelect}
              >
                <option value="">Select a saved project...</option>
                {savedProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name} · {new Date(project.updated_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (activeProjectId) deleteProject(activeProjectId);
              }}
              disabled={!activeProjectId}
              style={{
                ...styles.deleteButton,
                opacity: activeProjectId ? 1 : 0.45,
                cursor: activeProjectId ? "pointer" : "not-allowed",
              }}
            >
              Delete
            </button>
          </div>

          {activeProjectId && (
            <p style={styles.projectMeta}>
              Active saved project · {files.length} file{files.length === 1 ? "" : "s"} attached by name
            </p>
          )}
        </section>


        <section style={styles.templateCard}>
          <div style={styles.templateHeader}>
            <div>
              <p style={styles.label}>Template Library</p>
              <h2 style={styles.templateTitle}>Start from a common ServiceNow workflow</h2>
              <p style={styles.muted}>
                Pick a template to preload a strong sample requirement. You can edit it before analysis.
              </p>
            </div>

            <button
              onClick={() => setShowTemplates(!showTemplates)}
              style={styles.secondaryButton}
            >
              {showTemplates ? "Hide Templates" : "Browse Templates"}
            </button>
          </div>

          {showTemplates && (
            <div style={styles.templateGrid}>
              {REQUIREMENT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  style={styles.templateTile}
                >
                  <div style={styles.templateTileTop}>
                    <p style={styles.templateName}>{template.name}</p>
                    <span style={styles.templateCategory}>{template.category}</span>
                  </div>

                  <p style={styles.templateDescription}>{template.description}</p>

                  <p style={styles.templateUse}>Use template →</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {loadingStage && <div style={styles.loadingStage}>{loadingStage}</div>}

        <section style={styles.intakeCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.sectionTitle}>Requirement Intake</h2>
            <span style={styles.muted}>
              Text or docs → delivery-ready package
            </span>
          </div>

          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Paste rough requirement notes here..."
            style={styles.textarea}
          />

          <div style={styles.uploadArea}>
            <div>
              <p style={styles.uploadTitle}>Upload supporting documents</p>
              <p style={styles.muted}>
                Supported for MVP: .txt, .pdf, .docx. Avoid scanned/image-only
                PDFs for now.
              </p>
            </div>

            <input
              type="file"
              multiple
              accept=".txt,.pdf,.docx"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              style={styles.fileInput}
            />
          </div>

          {files.length > 0 && (
            <div style={styles.fileList}>
              {files.map((file, index) => (
                <div key={index} style={styles.fileChip}>
                  {file.name}
                </div>
              ))}
            </div>
          )}

          <div style={styles.textareaFooter}>
            <span>
              Paste rough notes. It does not need to be perfectly formatted.
            </span>
            <span>
              {requirement.length} characters · {files.length} file
              {files.length === 1 ? "" : "s"}
            </span>
          </div>
        </section>

        {intakeAnalysis && (
          <section style={styles.intakeAnalysisCard}>
            <div style={styles.cardTitleRow}>
              <div>
                <p style={styles.label}>Delivery Lead Intake Review</p>
                <h2 style={styles.cardTitle}>Requirement Readiness</h2>
              </div>

              <Badge>{intakeAnalysis.confidence} Confidence</Badge>
            </div>

            <div style={styles.stack}>
              <div style={styles.innerCard}>
                <p style={styles.label}>Understanding</p>
                <p style={styles.bodyText}>{intakeAnalysis.understanding}</p>
              </div>

              <div style={styles.twoGrid}>
                <div style={styles.innerCard}>
                  <p style={styles.label}>Clarifying Questions</p>
                  {intakeAnalysis.clarifying_questions?.length ? (
                    <ul style={styles.list}>
                      {intakeAnalysis.clarifying_questions.map(
                        (question, index) => (
                          <li key={index}>{question}</li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p style={styles.muted}>No major questions identified.</p>
                  )}
                </div>

                <div style={styles.innerCard}>
                  <p style={styles.label}>Assumptions</p>
                  {intakeAnalysis.assumptions?.length ? (
                    <ul style={styles.list}>
                      {intakeAnalysis.assumptions.map((assumption, index) => (
                        <li key={index}>{assumption}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={styles.muted}>No assumptions identified.</p>
                  )}
                </div>
              </div>

              {intakeAnalysis.missing_requirements?.length > 0 && (
                <div style={styles.innerCard}>
                  <p style={styles.label}>Missing / Weak Requirements</p>
                  <div style={styles.stack}>
                    {intakeAnalysis.missing_requirements.map((item, index) => (
                      <div key={index} style={styles.riskBox}>
                        <p style={styles.riskTitle}>{item.gap}</p>
                        <p style={styles.bodyText}>
                          <strong>Why it matters:</strong>{" "}
                          {item.why_it_matters}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.innerCard}>
                <p style={styles.label}>Answer Questions / Add Clarifications</p>
                <textarea
                  value={clarificationAnswers}
                  onChange={(e) => setClarificationAnswers(e.target.value)}
                  placeholder="Answer the clarifying questions here. Then click Reanalyze with Answers or Generate Package with Answers..."
                  style={{
                    width: "100%",
                    minHeight: "240px",
                    resize: "vertical",
                    border: "1px solid #94A3B8",
                    borderRadius: "16px",
                    background: "#FFFFFF",
                    padding: "16px",
                    color: "#0F172A",
                    fontSize: "15px",
                    lineHeight: "1.7",
                    outline: "none",
                    boxShadow: "inset 0 1px 4px rgba(15, 23, 42, 0.08)",
                    boxSizing: "border-box",
                  }}
                />

                <div style={styles.analysisActions}>
                  <button
                    onClick={analyzeRequirement}
                    disabled={analyzing || loading}
                    style={{
                      ...styles.secondaryButton,
                      opacity: analyzing || loading ? 0.65 : 1,
                      cursor: analyzing || loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {analyzing ? "Reanalyzing..." : "Reanalyze with Answers"}
                  </button>

                  <button
                    onClick={generatePackage}
                    disabled={loading || analyzing}
                    style={{
                      ...styles.button,
                      opacity: loading || analyzing ? 0.65 : 1,
                      cursor: loading || analyzing ? "not-allowed" : "pointer",
                    }}
                  >
                    Generate Package with Answers
                  </button>

                  <button
                    onClick={() => {
                      setIntakeAnalysis(null);
                      setClarificationAnswers("");
                    }}
                    style={styles.secondaryButton}
                  >
                    Edit Requirement
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {!result && (
          <section style={styles.emptyCard}>
            <h2 style={styles.sectionTitle}>No package generated yet</h2>
            <p style={styles.bodyText}>
              Add a requirement or upload documents, then click Analyze
              Requirement or Generate Package.
            </p>
          </section>
        )}

        {result && (
          <section style={styles.results}>
            <Card
              title="Delivery Lead Review"
              copyValue={JSON.stringify(result.delivery_lead_review, null, 2)}
              onCopy={copyToClipboard}
            >
              {result.delivery_lead_review ? (
                <div style={styles.stack}>
                  <div style={styles.innerCard}>
                    <p style={styles.label}>Understanding</p>
                    <p style={styles.bodyText}>
                      {result.delivery_lead_review.understanding}
                    </p>
                  </div>
                  <div style={styles.twoGrid}>
                    <div style={styles.innerCard}>
                      <p style={styles.label}>MVP Scope</p>
                      <ul style={styles.list}>
                        {result.delivery_lead_review.mvp_scope?.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    </div>

                    <div style={styles.innerCard}>
                      <p style={styles.label}>Phase 2 Scope</p>
                      <ul style={styles.list}>
                        {result.delivery_lead_review.phase_2_scope?.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  <div style={styles.twoGrid}>
                    <div style={styles.innerCard}>
                      <p style={styles.label}>Clarifying Questions</p>
                      <ul style={styles.list}>
                        {result.delivery_lead_review.clarifying_questions?.map(
                          (question, index) => (
                            <li key={index}>{question}</li>
                          )
                        )}
                      </ul>
                    </div>

                    <div style={styles.innerCard}>
                      <p style={styles.label}>Recommended Next Steps</p>
                      <ul style={styles.list}>
                        {result.delivery_lead_review.recommended_next_steps?.map(
                          (step, index) => (
                            <li key={index}>{step}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  {result.delivery_lead_review.missing_requirements?.length >
                    0 && (
                    <div style={styles.innerCard}>
                      <p style={styles.label}>Missing / Weak Requirements</p>
                      <div style={styles.stack}>
                        {result.delivery_lead_review.missing_requirements.map(
                          (item, index) => (
                            <div key={index} style={styles.riskBox}>
                              <p style={styles.riskTitle}>{item.gap}</p>
                              <p style={styles.bodyText}>
                                <strong>Why it matters:</strong>{" "}
                                {item.why_it_matters}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {result.delivery_lead_review.assumptions?.length > 0 && (
                    <div style={styles.innerCard}>
                      <p style={styles.label}>Assumptions</p>
                      <ul style={styles.list}>
                        {result.delivery_lead_review.assumptions.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  <RegeneratePanel
                    section="delivery_lead_review"
                    instruction={regenerateInstruction}
                    setInstruction={setRegenerateInstruction}
                    regeneratingSection={regeneratingSection}
                    onRegenerate={regenerateSection}
                  />
                </div>
              ) : (
                <p style={styles.muted}>No Delivery Lead review generated.</p>
              )}
            </Card>

              <Card
  title="Delivery Quality Score"
  copyValue={JSON.stringify(result.quality_score, null, 2)}
  onCopy={copyToClipboard}
>
  {result.quality_score ? (
    <div style={styles.stack}>
      <div style={styles.scoreGrid}>
        <ScoreBox
          label="Overall"
          score={result.quality_score.overall_score}
          color={getScoreColor(result.quality_score.overall_score)}
          background={getScoreBackground(result.quality_score.overall_score)}
        />

        <ScoreBox
          label="Completeness"
          score={result.quality_score.completeness_score}
          color={getScoreColor(result.quality_score.completeness_score)}
          background={getScoreBackground(result.quality_score.completeness_score)}
        />

        <ScoreBox
          label="Risk"
          score={result.quality_score.risk_score}
          color={getScoreColor(result.quality_score.risk_score)}
          background={getScoreBackground(result.quality_score.risk_score)}
        />

        <ScoreBox
          label="Readiness"
          score={result.quality_score.readiness_score}
          color={getScoreColor(result.quality_score.readiness_score)}
          background={getScoreBackground(result.quality_score.readiness_score)}
        />
      </div>

      <div style={styles.innerCard}>
        <p style={styles.label}>Rating</p>
        <p style={styles.accentText}>{result.quality_score.rating}</p>
        <p style={styles.bodyText}>{result.quality_score.summary}</p>
      </div>

      <div style={styles.twoGrid}>
        <div style={styles.innerCard}>
          <p style={styles.label}>Strengths</p>
          <ul style={styles.list}>
            {result.quality_score.strengths?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={styles.innerCard}>
          <p style={styles.label}>Weaknesses</p>
          <ul style={styles.list}>
            {result.quality_score.weaknesses?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={styles.innerCard}>
        <p style={styles.label}>Recommended Fixes</p>
        <ul style={styles.list}>
          {result.quality_score.recommended_fixes?.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <RegeneratePanel
        section="quality_score"
        instruction={regenerateInstruction}
        setInstruction={setRegenerateInstruction}
        regeneratingSection={regeneratingSection}
        onRegenerate={regenerateSection}
      />
    </div>
  ) : (
    <p style={styles.muted}>No quality score generated.</p>
  )}
</Card>

            <Card
                    title="Process / State Flow Diagram"
                    copyValue={result.process_diagram?.mermaid_code || ""}
                    onCopy={copyToClipboard}
                  >
                    {result.process_diagram ? (
                      <div style={styles.stack}>
                        <div style={styles.innerCard}>
                          <p style={styles.label}>{result.process_diagram.title}</p>
                          <p style={styles.bodyText}>{result.process_diagram.summary}</p>
                        </div>

                        <div style={styles.diagramShell}>
                          <MermaidDiagram chart={result.process_diagram.mermaid_code} />
                        </div>

                        <details style={styles.detailsBox}>
                          <summary style={styles.detailsSummary}>View Mermaid Code</summary>
                          <pre style={styles.mermaidCodeBlock}>
                            {result.process_diagram.mermaid_code}
                          </pre>
                        </details>

                        {result.process_diagram.diagram_notes?.length > 0 && (
                          <div style={styles.innerCard}>
                            <p style={styles.label}>Diagram Notes</p>
                            <ul style={styles.list}>
                              {result.process_diagram.diagram_notes.map((note, index) => (
                                <li key={index}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <RegeneratePanel
                          section="process_diagram"
                          instruction={regenerateInstruction}
                          setInstruction={setRegenerateInstruction}
                          regeneratingSection={regeneratingSection}
                          onRegenerate={regenerateSection}
                        />
                      </div>
                    ) : (
                      <p style={styles.muted}>No diagram generated.</p>
                    )}
                  </Card>  

            <div style={styles.topGrid}>
              <Card
                title="Requirement Summary"
                span={2}
                copyValue={result.requirement_summary}
                onCopy={copyToClipboard}
              >
                <p style={styles.bodyText}>{result.requirement_summary}</p>
              </Card>

              <Card
                title="Recommended App Type"
                copyValue={result.recommended_app_type}
                onCopy={copyToClipboard}
              >
                <p style={styles.accentText}>{result.recommended_app_type}</p>
              </Card>

              <Card
                title="Open Questions"
                copyValue={result.open_questions?.join("\n")}
                onCopy={copyToClipboard}
              >
                {result.open_questions?.length ? (
                  <ul style={styles.list}>
                    {result.open_questions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={styles.muted}>No open questions identified.</p>
                )}
              </Card>
            </div>

            <Card
              title="Solution Design"
              copyValue={result.solution_design}
              onCopy={copyToClipboard}
            >
              <p style={styles.bodyText}>{result.solution_design}</p>
              <div style={{ marginTop: "18px" }}>
                <RegeneratePanel
                  section="solution_design"
                  instruction={regenerateInstruction}
                  setInstruction={setRegenerateInstruction}
                  regeneratingSection={regeneratingSection}
                  onRegenerate={regenerateSection}
                />
              </div>
            </Card>

            <Card
              title="Proposed Tables"
              copyValue={JSON.stringify(result.tables, null, 2)}
              onCopy={copyToClipboard}
            >
              {result.tables?.length ? (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Table</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tables.map((table, index) => (
                      <tr key={index}>
                        <td style={styles.tableName}>{table.table_name}</td>
                        <td style={styles.td}>{table.type}</td>
                        <td style={styles.td}>{table.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={styles.muted}>No tables returned.</p>
              )}
            </Card>

            <div style={styles.twoGrid}>
              <Card
                title="Workflow Steps"
                copyValue={result.workflow_steps?.join("\n")}
                onCopy={copyToClipboard}
              >
                {result.workflow_steps?.length ? (
                  <ol style={styles.list}>
                    {result.workflow_steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p style={styles.muted}>No workflow steps returned.</p>
                )}
              </Card>

              <Card
                title="Risks"
                copyValue={JSON.stringify(result.risks, null, 2)}
                onCopy={copyToClipboard}
              >
                {result.risks?.length ? (
                  <div style={styles.stack}>
                    {result.risks.map((risk, index) => (
                      <div key={index} style={styles.riskBox}>
                        <p style={styles.riskTitle}>{risk.risk}</p>
                        <p style={styles.bodyText}>
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={styles.muted}>No risks returned.</p>
                )}
              </Card>
            </div>

            <Card
              title="Delivery Artifacts"
              copyValue={
                activeTab === "stories"
                  ? JSON.stringify(result.stories, null, 2)
                  : activeTab === "technical"
                  ? JSON.stringify(result.developer, null, 2)
                  : JSON.stringify(result.qa, null, 2)
              }
              onCopy={copyToClipboard}
            >
              <div style={styles.tabs}>
                <TabButton
                  active={activeTab === "stories"}
                  onClick={() => setActiveTab("stories")}
                >
                  Stories
                </TabButton>

                <TabButton
                  active={activeTab === "technical"}
                  onClick={() => setActiveTab("technical")}
                >
                  Technical Notes
                </TabButton>

                <TabButton
                  active={activeTab === "qa"}
                  onClick={() => setActiveTab("qa")}
                >
                  QA
                </TabButton>
              </div>

              {activeTab === "stories" && (
                <div style={styles.stack}>
                  {result.epic && (
                    <div style={styles.innerCard}>
                      <p style={styles.label}>Epic</p>
                      <p style={styles.accentText}>{result.epic}</p>
                    </div>
                  )}

                  {result.stories?.length ? (
                    <div style={styles.twoGrid}>
                      {result.stories.map((story, index) => (
                        <div key={index} style={styles.innerCard}>
                          <div style={styles.rowBetween}>
                            <h3 style={styles.itemTitle}>{story.title}</h3>
                            <Badge>{story.priority}</Badge>
                          </div>

                          <p style={styles.bodyText}>{story.story}</p>

                          {story.acceptance_criteria?.length > 0 && (
                            <>
                              <p style={styles.label}>Acceptance Criteria</p>
                              <ul style={styles.list}>
                                {story.acceptance_criteria.map(
                                  (criteria, i) => (
                                    <li key={i}>{criteria}</li>
                                  )
                                )}
                              </ul>
                            </>
                          )}

                          <button
                            style={styles.smallCopyButton}
                            onClick={() =>
                              copyToClipboard(JSON.stringify(story, null, 2))
                            }
                          >
                            Copy Story
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.muted}>No stories generated.</p>
                  )}
                </div>
              )}

              {activeTab === "technical" && (
                <div style={styles.stack}>
                  {result.developer ? (
                    <>
                      <div style={styles.innerCard}>
                        <div style={styles.rowBetween}>
                          <div>
                            <p style={styles.label}>Implementation Summary</p>
                            <p style={styles.bodyText}>
                              {result.developer.implementation_summary}
                            </p>
                          </div>
                        </div>
                      </div>

                      {result.developer.service_now_objects?.length > 0 && (
                        <>
                          <p style={styles.label}>ServiceNow Objects</p>
                          <div style={styles.twoGrid}>
                            {result.developer.service_now_objects.map(
                              (object, index) => (
                                <button
                                  key={index}
                                  style={styles.clickableInnerCard}
                                  onClick={() =>
                                    generateCodeForCard(
                                      {
                                        category: "ServiceNow Object",
                                        ...object,
                                      },
                                      object.name
                                    )
                                  }
                                >
                                  <p style={styles.accentText}>{object.name}</p>
                                  <p style={styles.muted}>
                                    {object.object_type}
                                  </p>
                                  <p style={styles.bodyText}>
                                    {object.purpose}
                                  </p>
                                  <p style={styles.clickHint}>
                                    Click to generate implementation/code
                                  </p>
                                </button>
                              )
                            )}
                          </div>
                        </>
                      )}

                      {result.developer.flow_designer_notes?.length > 0 && (
                        <>
                          <p style={styles.label}>Flow Designer</p>
                          <div style={styles.twoGrid}>
                            {result.developer.flow_designer_notes.map(
                              (flow, index) => (
                                <button
                                  key={index}
                                  style={styles.clickableInnerCard}
                                  onClick={() =>
                                    generateCodeForCard(
                                      {
                                        category: "Flow Designer",
                                        ...flow,
                                      },
                                      flow.flow_name
                                    )
                                  }
                                >
                                  <h3 style={styles.itemTitle}>
                                    {flow.flow_name}
                                  </h3>
                                  <p style={styles.muted}>
                                    Trigger: {flow.trigger}
                                  </p>
                                  <ol style={styles.list}>
                                    {flow.steps.map((step, i) => (
                                      <li key={i}>{step}</li>
                                    ))}
                                  </ol>
                                  <p style={styles.clickHint}>
                                    Click to generate implementation/code
                                  </p>
                                </button>
                              )
                            )}
                          </div>
                        </>
                      )}

                      {result.developer.business_rules?.length > 0 && (
                        <>
                          <p style={styles.label}>Business Rules</p>
                          <div style={styles.twoGrid}>
                            {result.developer.business_rules.map(
                              (rule, index) => (
                                <button
                                  key={index}
                                  style={styles.clickableInnerCard}
                                  onClick={() =>
                                    generateCodeForCard(
                                      {
                                        category: "Business Rule",
                                        ...rule,
                                      },
                                      rule.name
                                    )
                                  }
                                >
                                  <h3 style={styles.itemTitle}>{rule.name}</h3>
                                  <p style={styles.muted}>
                                    {rule.when} · {rule.condition}
                                  </p>
                                  <p style={styles.bodyText}>{rule.purpose}</p>
                                  <p style={styles.clickHint}>
                                    Click to generate implementation/code
                                  </p>
                                </button>
                              )
                            )}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <p style={styles.muted}>No technical notes generated.</p>
                  )}
                </div>
              )}

              {activeTab === "qa" && (
                <div style={styles.stack}>
                  {result.qa ? (
                    <>
                      <div style={styles.innerCard}>
                        <p style={styles.label}>Test Strategy</p>
                        <p style={styles.bodyText}>
                          {result.qa.test_strategy}
                        </p>
                      </div>

                      {result.qa.test_cases?.length > 0 && (
                        <>
                          <p style={styles.label}>Test Cases</p>
                          <div style={styles.twoGrid}>
                            {result.qa.test_cases.map((test, index) => (
                              <div key={index} style={styles.innerCard}>
                                <div style={styles.rowBetween}>
                                  <h3 style={styles.itemTitle}>
                                    {test.id}: {test.title}
                                  </h3>
                                  <Badge>{test.priority}</Badge>
                                </div>

                                <p style={styles.accentText}>{test.type}</p>

                                <ol style={styles.list}>
                                  {test.steps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ol>

                                <p style={styles.bodyText}>
                                  <strong>Expected:</strong>{" "}
                                  {test.expected_result}
                                </p>

                                <button
                                  style={styles.smallCopyButton}
                                  onClick={() =>
                                    copyToClipboard(
                                      JSON.stringify(test, null, 2)
                                    )
                                  }
                                >
                                  Copy Test Case
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {result.qa.uat_cases?.length > 0 && (
                        <>
                          <p style={styles.label}>UAT Cases</p>
                          <div style={styles.twoGrid}>
                            {result.qa.uat_cases.map((uat, index) => (
                              <div key={index} style={styles.innerCard}>
                                <h3 style={styles.itemTitle}>
                                  {uat.id}: {uat.title}
                                </h3>
                                <p style={styles.muted}>{uat.persona}</p>

                                <ol style={styles.list}>
                                  {uat.steps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ol>

                                <p style={styles.bodyText}>
                                  <strong>Expected:</strong>{" "}
                                  {uat.expected_result}
                                </p>

                                <button
                                  style={styles.smallCopyButton}
                                  onClick={() =>
                                    copyToClipboard(JSON.stringify(uat, null, 2))
                                  }
                                >
                                  Copy UAT Case
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <p style={styles.muted}>No QA generated.</p>
                  )}
                </div>
              )}

              <RegeneratePanel
                section={
                  activeTab === "stories"
                    ? "stories"
                    : activeTab === "technical"
                    ? "developer"
                    : "qa"
                }
                instruction={regenerateInstruction}
                setInstruction={setRegenerateInstruction}
                regeneratingSection={regeneratingSection}
                onRegenerate={regenerateSection}
              />
            </Card>
          </section>
        )}

        {codeModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <div>
                  <p style={styles.label}>Generated Implementation</p>
                  <h2 style={styles.modalTitle}>{selectedCodeTitle}</h2>
                </div>

                <button
                  style={styles.closeButton}
                  onClick={() => setCodeModalOpen(false)}
                >
                  Close
                </button>
              </div>

              {codeLoading ? (
                <div style={styles.loadingPanel}>
                  Generating ServiceNow implementation guidance...
                </div>
              ) : (
                <>
                  <pre style={styles.codeBlock}>{selectedCode}</pre>
                  <button
                    style={styles.button}
                    onClick={() => copyToClipboard(selectedCode)}
                  >
                    Copy Generated Code
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Card({
  title,
  children,
  span = 1,
  copyValue,
  onCopy,
}: {
  title: string;
  children: React.ReactNode;
  span?: number;
  copyValue?: string;
  onCopy?: (value: string) => void;
}) {
  return (
    <section
      style={{
        ...styles.card,
        gridColumn: span === 2 ? "span 2" : "span 1",
      }}
    >
      <div style={styles.cardTitleRow}>
        <h2 style={styles.cardTitle}>{title}</h2>
        {copyValue && onCopy && (
          <button style={styles.copyButton} onClick={() => onCopy(copyValue)}>
            Copy
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span style={styles.badge}>{children}</span>;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={active ? styles.activeTab : styles.inactiveTab}
    >
      {children}
    </button>
  );
}


function ScoreBox({
  label,
  score,
  color,
  background,
}: {
  label: string;
  score: number;
  color: string;
  background: string;
}) {
  return (
    <div style={{ ...styles.scoreBox, background }}>
      <p style={styles.label}>{label}</p>
      <p style={{ ...styles.scoreNumber, color }}>{score}</p>
      <p style={styles.scoreOutOf}>/ 100</p>
    </div>
  );
}

function RegeneratePanel({
  section,
  instruction,
  setInstruction,
  regeneratingSection,
  onRegenerate,
}: {
  section: string;
  instruction: string;
  setInstruction: (value: string) => void;
  regeneratingSection: string;
  onRegenerate: (section: string) => void;
}) {
  const label = section.replaceAll("_", " ");

  return (
    <div style={styles.regeneratePanel}>
      <div>
        <p style={styles.label}>Refine this section</p>
        <p style={styles.muted}>
          Example: make this more detailed, make it executive-friendly, add edge
          cases, simplify language, or align closer to ServiceNow delivery.
        </p>
      </div>

      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder={`Tell the pod what to change in ${label}...`}
        style={styles.regenerateTextarea}
      />

      <button
        onClick={() => onRegenerate(section)}
        disabled={!!regeneratingSection}
        style={{
          ...styles.secondaryButton,
          opacity: regeneratingSection ? 0.65 : 1,
          cursor: regeneratingSection ? "not-allowed" : "pointer",
        }}
      >
        {regeneratingSection === section
          ? "Regenerating..."
          : `Regenerate ${label}`}
      </button>
    </div>
  );
}

function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chart || !ref.current) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        primaryColor: "#DBEAFE",
        primaryTextColor: "#0F172A",
        primaryBorderColor: "#2563EB",
        lineColor: "#64748B",
        secondaryColor: "#F8FAFC",
        tertiaryColor: "#FFF7ED",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      },
    });

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

        const { svg } = await mermaid.render(id, chart);
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (error) {
        if (ref.current) {
          ref.current.innerHTML =
            "<p style='color:#92400E;font-weight:700;'>Unable to render Mermaid diagram. View Mermaid code below.</p>";
        }
      }
    };

    renderDiagram();
  }, [chart]);

  return <div ref={ref} />;
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #FFF7ED 0%, #F8FAFC 42%, #E0F2FE 100%)",
    color: "#111827",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  container: {
    maxWidth: "1440px",
    margin: "0 auto",
    padding: "36px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "28px",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  kicker: {
    display: "inline-block",
    marginBottom: "12px",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: "13px",
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: "42px",
    lineHeight: "1.1",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    color: "#0F172A",
  },
  subtitle: {
    maxWidth: "780px",
    marginTop: "14px",
    fontSize: "17px",
    lineHeight: "1.7",
    color: "#475569",
  },
  button: {
    border: "0",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
    color: "white",
    padding: "14px 22px",
    fontSize: "15px",
    fontWeight: 800,
    boxShadow: "0 18px 40px rgba(37, 99, 235, 0.28)",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #CBD5E1",
    borderRadius: "14px",
    background: "#FFFFFF",
    color: "#1D4ED8",
    padding: "14px 22px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #FCA5A5",
    borderRadius: "10px",
    background: "#FEF2F2",
    color: "#B91C1C",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },
  projectBar: {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid #CBD5E1",
  borderRadius: "22px",
  padding: "20px",
  boxShadow: "0 16px 42px rgba(15, 23, 42, 0.08)",
  marginBottom: "22px",
},

projectBarTop: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  marginBottom: "16px",
},

projectBarTitle: {
  margin: 0,
  fontSize: "22px",
  fontWeight: 850,
  letterSpacing: "-0.02em",
  color: "#0F172A",
},

projectActions: {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
},

projectControls: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr auto",
  gap: "14px",
  alignItems: "end",
},

projectField: {
  display: "flex",
  flexDirection: "column",
  gap: "7px",
},

projectLabel: {
  color: "#64748B",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 850,
},

projectInput: {
  width: "100%",
  border: "1px solid #CBD5E1",
  borderRadius: "14px",
  background: "#FFFFFF",
  color: "#0F172A",
  padding: "13px 14px",
  fontSize: "15px",
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box",
},

projectSelect: {
  width: "100%",
  border: "1px solid #CBD5E1",
  borderRadius: "14px",
  background: "#FFFFFF",
  color: "#0F172A",
  padding: "13px 14px",
  fontSize: "15px",
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box",
},

deleteButton: {
  border: "1px solid #FCA5A5",
  borderRadius: "14px",
  background: "#FEF2F2",
  color: "#B91C1C",
  padding: "13px 18px",
  fontSize: "14px",
  fontWeight: 850,
},

projectMeta: {
  margin: "12px 0 0",
  color: "#64748B",
  fontSize: "13px",
  fontWeight: 700,
},

  templateCard: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #CBD5E1",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 16px 42px rgba(15, 23, 42, 0.08)",
    marginBottom: "22px",
  },

  templateHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
  },

  templateTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 850,
    letterSpacing: "-0.02em",
    color: "#0F172A",
  },

  templateGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
  marginTop: "18px",
},

templateTile: {
  border: "1px solid #CBD5E1",
  borderRadius: "18px",
  background: "#FFFFFF",
  padding: "18px",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
  minHeight: "170px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
},

templateTileTop: {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "8px",
  marginBottom: "12px",
},

templateName: {
  margin: 0,
  color: "#0F172A",
  fontSize: "17px",
  fontWeight: 850,
  lineHeight: "1.35",
  letterSpacing: "-0.01em",
  whiteSpace: "normal",
},

templateCategory: {
  display: "inline-flex",
  borderRadius: "999px",
  background: "#DBEAFE",
  color: "#1D4ED8",
  padding: "5px 9px",
  fontSize: "11px",
  fontWeight: 800,
  whiteSpace: "normal",
  lineHeight: "1.2",
  maxWidth: "100%",
},

templateDescription: {
  margin: 0,
  color: "#475569",
  fontSize: "14px",
  lineHeight: "1.6",
},

templateUse: {
  margin: "14px 0 0",
  color: "#7C3AED",
  fontSize: "13px",
  fontWeight: 850,
},

  loadingStage: {
    marginBottom: "20px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    color: "#1D4ED8",
    fontSize: "15px",
    fontWeight: 800,
  },
  intakeCard: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #CBD5E1",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.10)",
    marginBottom: "24px",
  },
  intakeAnalysisCard: {
    background: "rgba(255,255,255,0.96)",
    border: "1px solid #93C5FD",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 20px 60px rgba(37, 99, 235, 0.12)",
    marginBottom: "24px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "14px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 800,
    color: "#0F172A",
  },
  textarea: {
    width: "100%",
    minHeight: "260px",
    resize: "vertical",
    border: "1px solid #94A3B8",
    borderRadius: "18px",
    background: "#FFFFFF",
    padding: "18px",
    color: "#0F172A",
    fontSize: "15px",
    lineHeight: "1.7",
    outline: "none",
    boxShadow: "inset 0 1px 4px rgba(15, 23, 42, 0.08)",
  },
  clarificationTextarea: {
  width: "100%",
  minHeight: "240px",
  resize: "vertical",
  border: "1px solid #94A3B8",
  borderRadius: "16px",
  background: "#FFFFFF",
  padding: "16px",
  color: "#0F172A",
  fontSize: "15px",
  lineHeight: "1.7",
  outline: "none",
  boxShadow: "inset 0 1px 4px rgba(15, 23, 42, 0.08)",
},
  analysisActions: {
    display: "flex",
    gap: "12px",
    marginTop: "18px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  regeneratePanel: {
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  regenerateTextarea: {
    width: "100%",
    minHeight: "110px",
    resize: "vertical",
    border: "1px solid #94A3B8",
    borderRadius: "16px",
    background: "#FFFFFF",
    padding: "14px",
    color: "#0F172A",
    fontSize: "15px",
    lineHeight: "1.7",
    outline: "none",
    boxSizing: "border-box",
  },
  uploadArea: {
    marginTop: "18px",
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: "16px",
    alignItems: "center",
    padding: "16px",
    border: "1px dashed #94A3B8",
    borderRadius: "18px",
    background: "#F8FAFC",
  },
  uploadTitle: {
    margin: "0 0 4px",
    color: "#0F172A",
    fontWeight: 850,
    fontSize: "16px",
  },
  fileInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#0F172A",
    fontSize: "14px",
  },
  fileList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "12px",
  },
  fileChip: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: "13px",
    fontWeight: 700,
  },
  textareaFooter: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "12px",
    color: "#64748B",
    fontSize: "14px",
  },
  emptyCard: {
    background: "rgba(255,255,255,0.78)",
    border: "1px dashed #94A3B8",
    borderRadius: "24px",
    padding: "32px",
    marginBottom: "24px",
  },
  results: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: "24px",
  },
  twoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },
  scoreGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
  },
  scoreBox: {
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    padding: "18px",
    textAlign: "center",
  },
  scoreNumber: {
    margin: "8px 0 0",
    fontSize: "42px",
    lineHeight: "1",
    fontWeight: 900,
  },
  scoreOutOf: {
    margin: "6px 0 0",
    color: "#64748B",
    fontSize: "13px",
    fontWeight: 800,
  },
  card: {
    background: "rgba(255,255,255,0.94)",
    border: "1px solid #CBD5E1",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.10)",
  },
  cardTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },
  diagramShell: {
  background: "#FFFFFF",
  border: "1px solid #CBD5E1",
  borderRadius: "18px",
  padding: "24px",
  overflowX: "auto",
},

detailsBox: {
  background: "#F8FAFC",
  border: "1px solid #CBD5E1",
  borderRadius: "18px",
  padding: "16px",
},

detailsSummary: {
  cursor: "pointer",
  color: "#2563EB",
  fontWeight: 850,
  fontSize: "15px",
},

mermaidCodeBlock: {
  marginTop: "14px",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  background: "#0F172A",
  color: "#E2E8F0",
  padding: "18px",
  borderRadius: "14px",
  fontSize: "14px",
  lineHeight: "1.7",
},
  cardTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 850,
    letterSpacing: "-0.02em",
    color: "#0F172A",
  },
  copyButton: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#2563EB",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },
  smallCopyButton: {
    marginTop: "14px",
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#2563EB",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },
  bodyText: {
    margin: 0,
    color: "#334155",
    fontSize: "15px",
    lineHeight: "1.8",
  },
  muted: {
    color: "#64748B",
    fontSize: "14px",
    lineHeight: "1.7",
  },
  accentText: {
    margin: 0,
    color: "#2563EB",
    fontWeight: 800,
    fontSize: "16px",
    lineHeight: "1.7",
  },
  list: {
    margin: 0,
    paddingLeft: "22px",
    color: "#334155",
    fontSize: "15px",
    lineHeight: "1.8",
    textAlign: "left",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "15px",
  },
  th: {
    textAlign: "left",
    padding: "14px 12px",
    color: "#475569",
    borderBottom: "1px solid #CBD5E1",
    fontWeight: 800,
  },
  td: {
    padding: "14px 12px",
    color: "#334155",
    borderBottom: "1px solid #E2E8F0",
  },
  tableName: {
    padding: "14px 12px",
    color: "#2563EB",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    borderBottom: "1px solid #E2E8F0",
    fontWeight: 700,
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  innerCard: {
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    padding: "18px",
  },
  clickableInnerCard: {
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    padding: "18px",
    textAlign: "left",
    cursor: "pointer",
    width: "100%",
  },
  clickHint: {
    marginTop: "12px",
    color: "#7C3AED",
    fontWeight: 800,
    fontSize: "13px",
  },
  riskBox: {
    background: "#FFFBEB",
    border: "1px solid #FACC15",
    borderRadius: "18px",
    padding: "18px",
  },
  riskTitle: {
    margin: "0 0 8px",
    color: "#92400E",
    fontWeight: 850,
    fontSize: "15px",
  },
  label: {
    margin: "0 0 8px",
    color: "#64748B",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 800,
  },
  itemTitle: {
    margin: 0,
    color: "#0F172A",
    fontSize: "17px",
    lineHeight: "1.5",
    fontWeight: 850,
  },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "10px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    background: "#E0F2FE",
    color: "#0369A1",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  tabs: {
    display: "flex",
    gap: "12px",
    borderBottom: "1px solid #CBD5E1",
    paddingBottom: "16px",
    marginBottom: "22px",
  },
  activeTab: {
    border: "1px solid #2563EB",
    background: "#2563EB",
    color: "white",
    borderRadius: "14px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(37, 99, 235, 0.22)",
  },
  inactiveTab: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#334155",
    borderRadius: "14px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "32px",
    zIndex: 1000,
  },
  modal: {
    width: "min(1000px, 100%)",
    maxHeight: "86vh",
    overflow: "auto",
    background: "#FFFFFF",
    borderRadius: "24px",
    border: "1px solid #CBD5E1",
    padding: "24px",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.30)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },
  modalTitle: {
    margin: 0,
    color: "#0F172A",
    fontSize: "24px",
    fontWeight: 850,
  },
  closeButton: {
    border: "1px solid #CBD5E1",
    borderRadius: "12px",
    background: "#FFFFFF",
    color: "#334155",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 800,
  },
  loadingPanel: {
    padding: "24px",
    borderRadius: "18px",
    background: "#EFF6FF",
    color: "#1D4ED8",
    fontWeight: 800,
  },
  codeBlock: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    background: "#0F172A",
    color: "#E2E8F0",
    padding: "20px",
    borderRadius: "18px",
    fontSize: "14px",
    lineHeight: "1.7",
    marginBottom: "16px",
  },
};