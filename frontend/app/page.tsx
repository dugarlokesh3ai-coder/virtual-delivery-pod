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
import { supabase } from "@/lib/supabaseClient";

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
  generation_mode?: "quick" | "full";
  agent_review?: AgentReview | null;
  delivery_lead_review: DeliveryLeadReview;
  process_diagram: ProcessDiagram | null;
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
  developer: DeveloperOutput | null;
  qa: QAOutput | null;
  quality_score: QualityScore | null;
};

type QualityScore = {
  overall_score: number | null;
  completeness_score: number | null;
  risk_score: number | null;
  readiness_score: number | null;
  rating: string;
  summary: string;
  score_rationale?: {
    completeness: string;
    risk: string;
    readiness: string;
  };
  score_caps_applied?: string[];
  strengths: string[];
  weaknesses: string[];
  recommended_fixes: string[];
  build_readiness_verdict?: string;
};

type AgentReviewerFeedback = {
  what_looks_good: string[];
  concerns: string[];
  recommended_improvements: string[];
  questions_for_business: string[];
};

type PriorityFix = {
  priority: string;
  fix: string;
  reason: string;
};

type AgentReview = {
  overall_review_summary: string;
  architect_review: AgentReviewerFeedback;
  developer_review: AgentReviewerFeedback;
  qa_review: AgentReviewerFeedback;
  delivery_lead_review: AgentReviewerFeedback;
  priority_fixes: PriorityFix[];
  final_verdict: string;
};

type DeliveryLeadArtifactDetails = {
  name: any;
  table: any;
  trigger: any;
  condition: any;
  recipients: any[];
  subject: any;
  body: any;
  steps: any[];
  roles: any[];
  fields: any[];
  expected_result: any;
  notes: any[];
};

type DeliveryLeadChatResponse = {
  answer: any;
  delivery_lead_recommendation: any;
  artifact_type: any;
  artifact_details: Partial<DeliveryLeadArtifactDetails> | any;
  suggested_requirement_update: any;
  should_update_requirement: boolean;
  impacted_sections: any[];
  follow_up_questions: any[];
  recommended_next_action: any;
};

type DeliveryLeadChatMessage = {
  role: "user" | "delivery_lead";
  content: string;
  response?: DeliveryLeadChatResponse;
};

type SiteAssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type ReviewAgentKey = "architect" | "developer" | "qa" | "delivery_lead";

type ReviewAgentChatMessage = {
  role: "user" | "agent";
  content: string;
};

const REVIEW_AGENT_TABS: { id: ReviewAgentKey; label: string; title: string }[] = [
  { id: "architect", label: "Architect", title: "Architect Review" },
  { id: "developer", label: "Developer", title: "Developer Review" },
  { id: "qa", label: "QA", title: "QA Review" },
  { id: "delivery_lead", label: "Delivery Lead", title: "Delivery Lead Review" },
];

type ActiveTab = "stories" | "technical" | "qa";
type PackageTab =
  | "overview"
  | "design"
  | "stories"
  | "technical"
  | "qa"
  | "review"
  | "delivery_lead"
  | "export";

const PACKAGE_TABS: { id: PackageTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "design", label: "Design" },
  { id: "stories", label: "Stories" },
  { id: "technical", label: "Technical" },
  { id: "qa", label: "QA" },
  { id: "review", label: "Review" },
  { id: "delivery_lead", label: "Delivery Lead" },
  { id: "export", label: "Export" },
];

type SavedProject = {
  id: string;
  project_name: string;
  created_at: string;
  updated_at: string;
  requirement: string;
  clarification_answers: string;
  uploaded_file_names: string[];
  result: DeliveryResult | null;
  delivery_lead_chat?: DeliveryLeadChatMessage[];
};

type RequirementTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  requirement: string;
};

function safeText(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function safeList(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function isValidScore(value: any): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function displayScore(value: any) {
  return isValidScore(value) ? String(value) : "—";
}

function scoreText(value: any) {
  return isValidScore(value) ? `${value}/100` : "Score unavailable";
}

function hasUsableQualityScore(score: QualityScore | null | undefined) {
  return !!score && isValidScore(score.overall_score);
}


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
  const [packageTab, setPackageTab] = useState<PackageTab>("overview");
  const [files, setFiles] = useState<File[]>([]);
  const [loadingStage, setLoadingStage] = useState("");

  const [intakeAnalysis, setIntakeAnalysis] =
    useState<IntakeAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [clarificationAnswers, setClarificationAnswers] = useState("");

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [selectedCodeTitle, setSelectedCodeTitle] = useState("");
  const [selectedCode, setSelectedCode] = useState("");

  const [regenerateInstruction, setRegenerateInstruction] = useState("");
  const [regeneratingSection, setRegeneratingSection] = useState("");

  const [deliveryLeadMessage, setDeliveryLeadMessage] = useState("");
  const [deliveryLeadChat, setDeliveryLeadChat] = useState<DeliveryLeadChatMessage[]>([]);
  const [deliveryLeadThinking, setDeliveryLeadThinking] = useState(false);
  const [deliveryLeadPendingRequirementUpdate, setDeliveryLeadPendingRequirementUpdate] =
    useState("");
  const [activeGenerationMode, setActiveGenerationMode] =
    useState<"quick" | "full" | null>(null);
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);
  const [siteAssistantMessage, setSiteAssistantMessage] = useState("");
  const [siteAssistantChat, setSiteAssistantChat] = useState<SiteAssistantMessage[]>([]);
  const [siteAssistantThinking, setSiteAssistantThinking] = useState(false);
  const [activeReviewAgent, setActiveReviewAgent] =
    useState<ReviewAgentKey>("architect");
  const [reviewAgentMessage, setReviewAgentMessage] = useState("");
  const [reviewAgentThinking, setReviewAgentThinking] = useState(false);
  const [reviewAgentChats, setReviewAgentChats] = useState<
    Record<ReviewAgentKey, ReviewAgentChatMessage[]>
  >({
    architect: [],
    developer: [],
    qa: [],
    delivery_lead: [],
  });
  const [reviewAgentPendingRequirementUpdate, setReviewAgentPendingRequirementUpdate] =
    useState("");

  const [projectName, setProjectName] = useState("");
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [showTemplates, setShowTemplates] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);

  useEffect(() => {
    const updateLayout = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);

    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  async function signUp() {
    const email = authEmail.trim();
    const password = authPassword;

    if (!email || !password.trim()) {
      alert("Enter email and password.");
      return;
    }

    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setAuthEmail("");
      setAuthPassword("");
      alert("Signup complete. Check your email if confirmation is enabled.");
    } catch (error) {
      console.error("Signup failed", error);
      alert("Signup failed. Check Supabase configuration.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function signIn() {
    const email = authEmail.trim();
    const password = authPassword;

    if (!email || !password.trim()) {
      alert("Enter email and password.");
      return;
    }

    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      const nextUser = data.user || null;
      setUser(nextUser);

      if (nextUser?.id) {
        await loadSavedProjectsFromDb(nextUser.id);
      }

      setAuthEmail("");
      setAuthPassword("");
    } catch (error) {
      console.error("Sign in failed", error);
      alert("Sign in failed. Check Supabase configuration.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out failed", error);
    }

    setUser(null);
    setAuthEmail("");
    setAuthPassword("");
    setSavedProjects([]);
    clearWorkspace();
  }

  async function loadSavedProjectsFromDb(currentUserId?: string) {
    const userId = currentUserId || user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from("delivery_projects")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Unable to load saved projects.");
      return;
    }

    const mappedProjects: SavedProject[] = (data || []).map((project: any) => ({
      id: project.id,
      project_name: project.project_name,
      created_at: project.created_at,
      updated_at: project.updated_at,
      requirement: project.requirement || "",
      clarification_answers: project.clarification_answers || "",
      uploaded_file_names: project.uploaded_file_names || [],
      result: project.result || null,
      delivery_lead_chat: project.delivery_lead_chat || [],
    }));

    setSavedProjects(mappedProjects);
  }

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);

      if (data.user?.id) {
        await loadSavedProjectsFromDb(data.user.id);
      }
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUser = session?.user || null;
        setUser(nextUser);

        if (nextUser?.id) {
          await loadSavedProjectsFromDb(nextUser.id);
        } else {
          setSavedProjects([]);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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

  function getScoreColor(score: number | null | undefined) {
      if (!isValidScore(score)) return "#64748B";
      if (score >= 85) return "#15803D";
      if (score >= 70) return "#2563EB";
      if (score >= 50) return "#B45309";
      return "#B91C1C";
    }

    function getScoreBackground(score: number | null | undefined) {
      if (!isValidScore(score)) return "#F1F5F9";
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

  function buildDefaultProjectName() {
    const summary = result?.requirement_summary?.trim();
    const firstRequirementLine = requirement
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    const baseName =
      summary ||
      firstRequirementLine ||
      (result?.generation_mode === "quick"
        ? "Quick Delivery Package"
        : "ServiceNow Delivery Package");

    const cleanName = baseName
      .replace(/[`*_#>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 72);

    return cleanName || "ServiceNow Delivery Package";
  }

  async function saveProject() {
    if (!user) {
      alert("Sign in before saving projects.");
      return;
    }

    if (projectSaving) return;

    const resolvedProjectName = projectName.trim() || buildDefaultProjectName();
    setProjectSaving(true);

    const now = new Date().toISOString();

    const basePayload = {
      project_name: resolvedProjectName,
      requirement,
      clarification_answers: clarificationAnswers,
      uploaded_file_names: files.map((file) => file.name),
      result: result || null,
      delivery_lead_chat: deliveryLeadChat || [],
      updated_at: now,
    };

    try {
      let savedRecord: any = null;
      const wasUpdating = !!activeProjectId;

      if (activeProjectId) {
        const { data, error } = await supabase
          .from("delivery_projects")
          .update(basePayload)
          .eq("id", activeProjectId)
          .eq("user_id", user.id)
          .select("*")
          .maybeSingle();

        if (error) {
          console.error("Unable to update project", error);
          alert(`Unable to update project: ${error.message}`);
          return;
        }

        if (!data) {
          const createNewCopy = window.confirm(
            "This saved project could not be found for your account. Create a new saved copy instead?"
          );

          setActiveProjectId(null);

          if (!createNewCopy) {
            await loadSavedProjectsFromDb(user.id);
            return;
          }

          const { data: insertedData, error: insertError } = await supabase
            .from("delivery_projects")
            .insert({
              ...basePayload,
              user_id: user.id,
            })
            .select("*")
            .single();

          if (insertError) {
            console.error("Unable to save new project copy", insertError);
            alert(`Unable to save new project copy: ${insertError.message}`);
            return;
          }

          savedRecord = insertedData;
        } else {
          savedRecord = data;
        }
      } else {
        const { data, error } = await supabase
          .from("delivery_projects")
          .insert({
            ...basePayload,
            user_id: user.id,
          })
          .select("*")
          .single();

        if (error) {
          console.error("Unable to save project", error);
          alert(`Unable to save project: ${error.message}`);
          return;
        }

        savedRecord = data;
      }

      if (!savedRecord) {
        alert("Project was not saved. No database record was returned.");
        return;
      }

      const savedProject: SavedProject = {
        id: savedRecord.id,
        project_name: savedRecord.project_name,
        created_at: savedRecord.created_at,
        updated_at: savedRecord.updated_at,
        requirement: savedRecord.requirement || "",
        clarification_answers: savedRecord.clarification_answers || "",
        uploaded_file_names: savedRecord.uploaded_file_names || [],
        result: savedRecord.result || null,
        delivery_lead_chat: savedRecord.delivery_lead_chat || [],
      };

      setActiveProjectId(savedProject.id);
      setProjectName(savedProject.project_name);

      setSavedProjects((previousProjects) => {
        const existingIndex = previousProjects.findIndex(
          (project) => project.id === savedProject.id
        );

        if (existingIndex >= 0) {
          return previousProjects.map((project) =>
            project.id === savedProject.id ? savedProject : project
          );
        }

        return [savedProject, ...previousProjects];
      });

      await loadSavedProjectsFromDb(user.id);
      alert(wasUpdating ? "Project updated." : "Project saved.");
    } catch (error) {
      console.error("Project save/update failed", error);
      alert("Project save/update failed. Check browser console and Supabase logs.");
    } finally {
      setProjectSaving(false);
    }
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
    setPackageTab("overview");
    setRegenerateInstruction("");
    setDeliveryLeadChat(project.delivery_lead_chat || []);
    setDeliveryLeadPendingRequirementUpdate("");
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
    setPackageTab("overview");
    setLoadingStage("");

    setCodeModalOpen(false);
    setCodeLoading(false);
    setSelectedCodeTitle("");
    setSelectedCode("");

    setRegenerateInstruction("");
    setRegeneratingSection("");

    setDeliveryLeadMessage("");
    setDeliveryLeadChat([]);
    setDeliveryLeadThinking(false);
    setDeliveryLeadPendingRequirementUpdate("");
    setActiveGenerationMode(null);
    setFloatingChatOpen(false);
    setSiteAssistantMessage("");
    setSiteAssistantChat([]);
    setSiteAssistantThinking(false);
    setActiveReviewAgent("architect");
    setReviewAgentMessage("");
    setReviewAgentThinking(false);
    setReviewAgentChats({
      architect: [],
      developer: [],
      qa: [],
      delivery_lead: [],
    });
    setReviewAgentPendingRequirementUpdate("");
    setProjectSaving(false);
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

  async function deleteProject(projectId: string) {
    if (!user) {
      alert("Sign in before deleting projects.");
      return;
    }

    const confirmed = window.confirm("Delete this saved project?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("delivery_projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      alert("Unable to delete project.");
      return;
    }

    if (activeProjectId === projectId) {
      clearWorkspace();
    }

    await loadSavedProjectsFromDb(user.id);
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
    setPackageTab("overview");
    setLoadingStage("");
    setRegenerateInstruction("");
    setRegeneratingSection("");
    setDeliveryLeadMessage("");
    setDeliveryLeadChat([]);
    setDeliveryLeadThinking(false);
    setDeliveryLeadPendingRequirementUpdate("");
    setActiveReviewAgent("architect");
    setReviewAgentMessage("");
    setReviewAgentThinking(false);
    setReviewAgentChats({
      architect: [],
      developer: [],
      qa: [],
      delivery_lead: [],
    });
    setReviewAgentPendingRequirementUpdate("");
    setShowTemplates(false);
  }

  async function generatePackage(mode: "quick" | "full" = "full") {
    if (!requirement.trim() && files.length === 0) {
      alert("Paste a business process or upload a document first.");
      return;
    }

    setLoading(true);
    setActiveGenerationMode(mode);
    setLoadingStage(
      mode === "quick"
        ? "Generating quick delivery package..."
        : "Reading requirement and uploaded documents..."
    );

    const stageTimers =
      mode === "quick"
        ? [
            setTimeout(
              () => setLoadingStage("Architect is creating quick solution design..."),
              900
            ),
            setTimeout(
              () => setLoadingStage("BSA is creating core stories..."),
              2400
            ),
            setTimeout(
              () => setLoadingStage("Delivery Lead is assembling quick package..."),
              4200
            ),
          ]
        : [
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
      formData.append("generation_mode", mode);

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
      setPackageTab(mode === "quick" ? "design" : "overview");
    } catch (error) {
      console.error(error);
      alert("Something failed. Check your backend terminal.");
    } finally {
      stageTimers.forEach((timer) => clearTimeout(timer));
      setLoading(false);
      setActiveGenerationMode(null);
      setLoadingStage("");
    }
  }

  async function upgradeQuickPackageToFull() {
    if (!result) {
      alert("Generate a quick package first.");
      return;
    }

    if (result.developer && result.qa && result.quality_score) {
      alert("This package is already a full package.");
      return;
    }

    setLoading(true);
    setLoadingStage("Upgrading quick package to full detailed package...");

    const stageTimers = [
      setTimeout(
        () => setLoadingStage("Developer is preparing technical notes..."),
        900
      ),
      setTimeout(
        () => setLoadingStage("Creating process/state flow diagram..."),
        2200
      ),
      setTimeout(
        () => setLoadingStage("QA is building test cases and UAT scenarios..."),
        4200
      ),
      setTimeout(
        () => setLoadingStage("Quality gate is scoring the full package..."),
        6800
      ),
    ];

    try {
      const response = await fetch(`${API_BASE_URL}/upgrade-package`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirement: buildRequirementWithClarifications(),
          current_package: result,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upgrade failed response:", response.status, errorText);
        throw new Error(`Upgrade package failed: ${response.status}`);
      }

      const data = await response.json();

      setResult(data);
      setPackageTab("overview");
    } catch (error) {
      console.error(error);
      alert("Upgrade failed. Check your backend logs.");
    } finally {
      stageTimers.forEach((timer) => clearTimeout(timer));
      setLoading(false);
      setLoadingStage("");
    }
  }

  async function runAgentReview() {
    if (!result) {
      alert("Generate a package first.");
      return;
    }

    setLoading(true);
    setLoadingStage("Agent review board is reviewing the package...");

    const stageTimers = [
      setTimeout(
        () => setLoadingStage("Architect is reviewing solution design..."),
        900
      ),
      setTimeout(
        () => setLoadingStage("Developer is reviewing implementation detail..."),
        2400
      ),
      setTimeout(
        () => setLoadingStage("QA is reviewing test coverage..."),
        4200
      ),
      setTimeout(
        () => setLoadingStage("Delivery Lead is reviewing delivery readiness..."),
        6200
      ),
    ];

    try {
      const response = await fetch(`${API_BASE_URL}/agent-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirement: buildRequirementWithClarifications(),
          current_package: result,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Agent review failed response:", response.status, errorText);
        throw new Error(`Agent review failed: ${response.status}`);
      }

      const review = await response.json();

      setResult({
        ...result,
        agent_review: review,
      });

      setPackageTab("review");
    } catch (error) {
      console.error(error);
      alert("Agent review failed. Check backend logs.");
    } finally {
      stageTimers.forEach((timer) => clearTimeout(timer));
      setLoading(false);
      setLoadingStage("");
    }
  }

  function getSiteAssistantAnswer(question: string) {
    const normalizedQuestion = question.toLowerCase();

    const workflowAnswer = `Use the site in this order:\n\n1. Start with a template or paste your rough requirement in Requirement Intake.\n2. Click Analyze Requirement if you want gaps and clarifying questions first.\n3. Use Quick Package for a fast draft, or Full Detailed Package when you need developer notes, QA, score, and review-ready output.\n4. Review the package tabs: Overview, Design, Stories, Technical, QA, Review, Delivery Lead, and Export.\n5. Save the project so you can reload it later.\n6. Export Markdown or DOCX when you want to share the package.`;

    const quickFullAnswer = `Quick Package is for a fast first draft. It focuses on requirement summary, solution design, workflow, open questions, and core stories.\n\nFull Detailed Package is for delivery handoff. It adds developer notes, technical objects, QA test cases, UAT cases, quality scoring, process diagrams, and deeper delivery lead review.\n\nUse Quick early. Use Full when the requirement is stable enough for review or handoff.`;

    const templateAnswer = `Templates help you start faster. Browse Template Library, choose a common workflow such as Vendor Onboarding, Project Intake, Access Request, HR Case Intake, GRC Issue Management, Contract Review, Policy Exception, or Custom App Request. After selecting a template, edit the requirement text before generating a package.`;

    const saveAnswer = `To save work, enter a Current Project name and click Save Project. Saved projects are stored under your signed-in account. Use the Saved Projects dropdown to reload prior packages. Use Update Project when you are editing an already saved package.`;

    const exportAnswer = `Use the Export tab or the top export buttons after generating a package. Markdown is useful for copying into Jira, Confluence, or notes. DOCX is better for stakeholder review, delivery handoff, or sending as a formal package.`;

    const technicalAnswer = `Use the Technical tab after generating a Full Detailed Package. It organizes ServiceNow objects, Flow Designer notes, Business Rules, ACL/security notes, notifications, and deployment notes. Click technical cards to generate implementation guidance or code-style notes for a specific object or rule.`;

    const deliveryLeadAnswer = `Use the Delivery Lead tab when you want package-specific guidance. Ask about missing requirements, scope, risks, MVP vs phase 2, ServiceNow approach, business rules, notification content, ACLs, or requirement updates. If the Delivery Lead suggests a requirement update, use Apply Requirement Update to push it into the main requirement box.`;

    const reviewAnswer = `Use Run Agent Review after generating a package. It acts like an internal review board across architecture, development, QA, and delivery lead perspectives. It is useful before you export or share the package.`;

    const uploadAnswer = `You can paste rough notes directly or upload supporting documents. The current MVP supports .txt, .pdf, and .docx files. Avoid scanned or image-only PDFs because text extraction may not work well.`;

    if (normalizedQuestion.includes("quick") || normalizedQuestion.includes("full") || normalizedQuestion.includes("generation")) {
      return quickFullAnswer;
    }

    if (normalizedQuestion.includes("template") || normalizedQuestion.includes("example")) {
      return templateAnswer;
    }

    if (normalizedQuestion.includes("save") || normalizedQuestion.includes("reload") || normalizedQuestion.includes("project") || normalizedQuestion.includes("database")) {
      return saveAnswer;
    }

    if (normalizedQuestion.includes("export") || normalizedQuestion.includes("docx") || normalizedQuestion.includes("markdown") || normalizedQuestion.includes("download")) {
      return exportAnswer;
    }

    if (normalizedQuestion.includes("technical") || normalizedQuestion.includes("code") || normalizedQuestion.includes("business rule") || normalizedQuestion.includes("flow") || normalizedQuestion.includes("acl")) {
      return technicalAnswer;
    }

    if (normalizedQuestion.includes("delivery lead") || normalizedQuestion.includes("requirement update") || normalizedQuestion.includes("missing") || normalizedQuestion.includes("scope") || normalizedQuestion.includes("risk")) {
      return deliveryLeadAnswer;
    }

    if (normalizedQuestion.includes("review") || normalizedQuestion.includes("score") || normalizedQuestion.includes("quality")) {
      return reviewAnswer;
    }

    if (normalizedQuestion.includes("upload") || normalizedQuestion.includes("document") || normalizedQuestion.includes("pdf") || normalizedQuestion.includes("docx") || normalizedQuestion.includes("file")) {
      return uploadAnswer;
    }

    if (normalizedQuestion.includes("how") || normalizedQuestion.includes("use") || normalizedQuestion.includes("start") || normalizedQuestion.includes("help")) {
      return workflowAnswer;
    }

    return `I can help you use this site. Common things you can ask me:\n\n- How do I generate a package?\n- What is Quick vs Full Package?\n- How do I save and reload projects?\n- How do templates work?\n- Where do I review technical notes or QA?\n- How do I export the package?\n\nFor questions about the actual generated requirement or package content, use the Delivery Lead tab.`;
  }

  async function askSiteAssistant() {
    if (!siteAssistantMessage.trim()) {
      alert("Ask a site question first.");
      return;
    }

    const userQuestion = siteAssistantMessage.trim();
    const nextChat: SiteAssistantMessage[] = [
      ...siteAssistantChat,
      {
        role: "user",
        content: userQuestion,
      },
    ];

    setSiteAssistantChat(nextChat);
    setSiteAssistantMessage("");
    setSiteAssistantThinking(true);

    window.setTimeout(() => {
      setSiteAssistantChat([
        ...nextChat,
        {
          role: "assistant",
          content: getSiteAssistantAnswer(userQuestion),
        },
      ]);
      setSiteAssistantThinking(false);
    }, 250);
  }


  function getReviewFeedback(agent: ReviewAgentKey): AgentReviewerFeedback | null {
    if (!result?.agent_review) return null;

    if (agent === "architect") return result.agent_review.architect_review;
    if (agent === "developer") return result.agent_review.developer_review;
    if (agent === "qa") return result.agent_review.qa_review;

    return result.agent_review.delivery_lead_review;
  }

  function getReviewAgentLabel(agent: ReviewAgentKey) {
    if (agent === "architect") return "Architect";
    if (agent === "developer") return "Developer";
    if (agent === "qa") return "QA Lead";

    return "Delivery Lead";
  }

  function getReviewAgentFocus(agent: ReviewAgentKey) {
    if (agent === "architect") {
      return "Act as the Architect reviewer. Focus on ServiceNow application architecture, scoped app approach, data model, workflow structure, integrations, extensibility, and platform best practices.";
    }

    if (agent === "developer") {
      return "Act as the Developer reviewer. Focus on ServiceNow implementation details, tables, fields, business rules, flow designer, ACLs, notifications, scripts, technical risks, and build sequencing.";
    }

    if (agent === "qa") {
      return "Act as the QA reviewer. Focus on test coverage, UAT scenarios, edge cases, regression areas, data needs, acceptance criteria, and release readiness.";
    }

    return "Act as the Delivery Lead reviewer. Focus on delivery readiness, MVP vs phase 2, missing requirements, stakeholder decisions, risk management, and recommended next actions.";
  }

  async function askReviewAgent() {
    if (!reviewAgentMessage.trim()) {
      alert(`Ask the ${getReviewAgentLabel(activeReviewAgent)} a question first.`);
      return;
    }

    if (!result?.agent_review) {
      alert("Run Agent Review first.");
      return;
    }

    const userQuestion = reviewAgentMessage.trim();
    const agentLabel = getReviewAgentLabel(activeReviewAgent);
    const agentFocus = getReviewAgentFocus(activeReviewAgent);
    const activeFeedback = getReviewFeedback(activeReviewAgent);

    const nextAgentChat: ReviewAgentChatMessage[] = [
      ...reviewAgentChats[activeReviewAgent],
      {
        role: "user",
        content: userQuestion,
      },
    ];

    setReviewAgentChats({
      ...reviewAgentChats,
      [activeReviewAgent]: nextAgentChat,
    });
    setReviewAgentMessage("");
    setReviewAgentThinking(true);
    setLoadingStage(`${agentLabel} is reviewing your question...`);

    try {
      const response = await fetch(`${API_BASE_URL}/delivery_lead_chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `${agentFocus}

User question:
${userQuestion}

Use the current package and this review feedback to answer as the ${agentLabel}. If the user asks to change the requirement, return a clear suggested_requirement_update.

${agentLabel} feedback:
${JSON.stringify(activeFeedback, null, 2)}`,
          requirement: buildRequirementWithClarifications(),
          current_package: result,
          chat_history: nextAgentChat,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Review agent chat failed:", response.status, errorText);
        throw new Error(`Review agent chat failed: ${response.status}`);
      }

      const rawData: DeliveryLeadChatResponse = await response.json();
      const answer = safeText(rawData.answer || rawData.delivery_lead_recommendation);

      const normalizedSuggestedUpdate = safeText(rawData.suggested_requirement_update);
      if (normalizedSuggestedUpdate.trim()) {
        setReviewAgentPendingRequirementUpdate(normalizedSuggestedUpdate);
      }

      setReviewAgentChats({
        ...reviewAgentChats,
        [activeReviewAgent]: [
          ...nextAgentChat,
          {
            role: "agent",
            content:
              answer ||
              `${agentLabel} reviewed this, but no detailed answer was returned. Try asking for a specific requirement change, risk, or implementation recommendation.`,
          },
        ],
      });
    } catch (error) {
      console.error(error);
      alert(`${agentLabel} chat failed. Check backend logs.`);
    } finally {
      setReviewAgentThinking(false);
      setLoadingStage("");
    }
  }

  function applyReviewAgentRequirementUpdate(updateText: string) {
    if (!updateText.trim()) return;

    const confirmed = window.confirm(
      `Apply this ${getReviewAgentLabel(activeReviewAgent)} update to the main requirement box?`
    );

    if (!confirmed) return;

    setRequirement(updateText);
    setClarificationAnswers("");
    setIntakeAnalysis(null);
    setReviewAgentPendingRequirementUpdate("");
    setPackageTab("design");
  }

  async function askDeliveryLead() {
    if (!deliveryLeadMessage.trim()) {
      alert("Ask the Delivery Lead a question first.");
      return;
    }

    const userMessage = deliveryLeadMessage.trim();

    const nextChat: DeliveryLeadChatMessage[] = [
      ...deliveryLeadChat,
      {
        role: "user",
        content: userMessage,
      },
    ];

    setDeliveryLeadChat(nextChat);
    setDeliveryLeadMessage("");
    setDeliveryLeadThinking(true);
    setLoadingStage("Delivery Lead is thinking...");

    try {
      const response = await fetch(`${API_BASE_URL}/delivery_lead_chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          requirement: buildRequirementWithClarifications(),
          current_package: result,
          chat_history: nextChat,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delivery Lead chat failed:", response.status, errorText);
        throw new Error(`Delivery Lead chat failed: ${response.status}`);
      }

      const rawData: DeliveryLeadChatResponse = await response.json();

const normalizedData: DeliveryLeadChatResponse = {
  ...rawData,
  answer: safeText(rawData.answer),
  delivery_lead_recommendation: safeText(
    rawData.delivery_lead_recommendation
  ),
  artifact_type: safeText(rawData.artifact_type),
  suggested_requirement_update: safeText(
    rawData.suggested_requirement_update
  ),
  recommended_next_action: safeText(rawData.recommended_next_action),
  impacted_sections: safeList(rawData.impacted_sections),
  follow_up_questions: safeList(rawData.follow_up_questions),
  artifact_details: {
    name: safeText(rawData.artifact_details?.name),
    table: safeText(rawData.artifact_details?.table),
    trigger: safeText(rawData.artifact_details?.trigger),
    condition: safeText(rawData.artifact_details?.condition),
    recipients: safeList(rawData.artifact_details?.recipients),
    subject: safeText(rawData.artifact_details?.subject),
    body: safeText(rawData.artifact_details?.body),
    steps: safeList(rawData.artifact_details?.steps),
    roles: safeList(rawData.artifact_details?.roles),
    fields: safeList(rawData.artifact_details?.fields),
    expected_result: safeText(rawData.artifact_details?.expected_result),
    notes: safeList(rawData.artifact_details?.notes),
  },
};

if (normalizedData.suggested_requirement_update.trim()) {
  setDeliveryLeadPendingRequirementUpdate(
    normalizedData.suggested_requirement_update
  );
}

setDeliveryLeadChat([
  ...nextChat,
  {
    role: "delivery_lead",
    content: normalizedData.answer,
    response: normalizedData,
  },
]);
    } catch (error) {
      console.error(error);
      alert("Delivery Lead chat failed. Check backend logs.");
    } finally {
      setDeliveryLeadThinking(false);
      setLoadingStage("");
    }
  }

  function applyDeliveryLeadRequirementUpdate(updateText: string) {
    if (!updateText.trim()) return;

    const confirmed = window.confirm(
      "Apply this Delivery Lead update to the main requirement box?"
    );

    if (!confirmed) return;

    setRequirement(updateText);
    setClarificationAnswers("");
    setIntakeAnalysis(null);
    setDeliveryLeadPendingRequirementUpdate("");
    setPackageTab("design");
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

## ${data.generation_mode === "quick" ? "Quick Readiness Score" : "Delivery Quality Score"}

Overall Score: ${scoreText(data.quality_score?.overall_score)}  
Completeness Score: ${scoreText(data.quality_score?.completeness_score)}  
Risk Score: ${scoreText(data.quality_score?.risk_score)}  
Readiness Score: ${scoreText(data.quality_score?.readiness_score)}  
Rating: ${data.quality_score?.rating || "Score unavailable"}

### Quality Summary
${data.quality_score?.summary || "Quality score was not generated for this package."}

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

    children.push(docHeading(result.generation_mode === "quick" ? "Quick Readiness Score" : "Delivery Quality Score"));
    children.push(
      docParagraph(`Overall Score: ${scoreText(result.quality_score?.overall_score)}`)
    );
    children.push(
      docParagraph(
        `Completeness Score: ${scoreText(result.quality_score?.completeness_score)}`
      )
    );
    children.push(
      docParagraph(`Risk Score: ${scoreText(result.quality_score?.risk_score)}`)
    );
    children.push(
      docParagraph(
        `Readiness Score: ${scoreText(result.quality_score?.readiness_score)}`
      )
    );
    children.push(docParagraph(`Rating: ${result.quality_score?.rating || "Score unavailable"}`));
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


  const responsiveContainer = isMobile
    ? { ...styles.container, ...styles.mobileContainer }
    : styles.container;

  const responsiveHeader = isMobile
    ? { ...styles.header, ...styles.mobileHeader }
    : styles.header;

  const responsiveHeaderActions = isMobile
    ? { ...styles.headerActions, ...styles.mobileHeaderActions }
    : styles.headerActions;

  const responsiveTitle = isMobile
    ? { ...styles.title, ...styles.mobileTitle }
    : styles.title;

  const responsiveProjectBarTop = isMobile
    ? { ...styles.projectBarTop, ...styles.mobileStackRow }
    : styles.projectBarTop;

  const responsiveProjectActions = isMobile
    ? { ...styles.projectActions, ...styles.mobileActionRow }
    : styles.projectActions;

  const responsiveProjectControls = isMobile
    ? { ...styles.projectControls, ...styles.mobileOneColumnGrid }
    : styles.projectControls;

  const responsiveTemplateHeader = isMobile
    ? { ...styles.templateHeader, ...styles.mobileStackRow }
    : styles.templateHeader;

  const responsiveTemplateGrid = isMobile
    ? { ...styles.templateGrid, ...styles.mobileTemplateGrid }
    : styles.templateGrid;

  const responsiveCardHeader = isMobile
    ? { ...styles.cardHeader, ...styles.mobileStackRow }
    : styles.cardHeader;

  const responsiveUploadArea = isMobile
    ? { ...styles.uploadArea, ...styles.mobileOneColumnGrid }
    : styles.uploadArea;

  const responsiveTextareaFooter = isMobile
    ? { ...styles.textareaFooter, ...styles.mobileStackRow }
    : styles.textareaFooter;

  const responsiveTwoGrid = isMobile
    ? { ...styles.twoGrid, ...styles.mobileOneColumnGrid }
    : styles.twoGrid;

  const responsiveTopGrid = isMobile
    ? { ...styles.topGrid, ...styles.mobileOneColumnGrid }
    : styles.topGrid;

  const responsiveScoreGrid = isMobile
    ? { ...styles.scoreGrid, ...styles.mobileScoreGrid }
    : styles.scoreGrid;

  const hasScore = hasUsableQualityScore(result?.quality_score);
  const packageScoreLabel = result?.generation_mode === "quick" ? "Readiness" : "Quality";
  const packageScoreTitle =
    result?.generation_mode === "quick"
      ? "Quick Readiness Score"
      : "Delivery Quality Score";

  return (
    <main style={styles.page}>
      <div style={responsiveContainer}>
        <header style={responsiveHeader}>
          <div>
            <div style={styles.kicker}>AI Delivery Workspace</div>
            <h1 style={responsiveTitle}>Virtual ServiceNow Delivery Pod</h1>
            <p style={styles.subtitle}>
              Paste requirements or upload documents. The Delivery Lead converts
              them into solution design, stories, technical notes, and QA
              artifacts.
            </p>
          </div>

          <div style={responsiveHeaderActions}>
            {result && user && (
              <>
                <button onClick={exportMarkdown} style={styles.secondaryButton}>
                  Export Markdown
                </button>

                <button onClick={exportDocx} style={styles.secondaryButton}>
                  Export DOCX
                </button>
              </>
            )}

            {user ? (
              <div style={isMobile ? styles.mobileActionRow : styles.accountTopRight}>
                <div style={styles.signedInPill}>
                  <span style={styles.signedInDot}></span>
                  <span style={styles.signedInText}>Signed in</span>
                  <span style={styles.signedInEmail}>{user.email}</span>
                </div>
                <button onClick={signOut} style={styles.secondaryButton}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={isMobile ? styles.mobileActionRow : styles.authBoxCompact}>
                <input
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") signIn();
                  }}
                  placeholder="Email address"
                  style={styles.authInput}
                />
                <input
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") signIn();
                  }}
                  placeholder="Password"
                  type="password"
                  style={styles.authInput}
                />
                <button
                  onClick={signIn}
                  disabled={authLoading}
                  style={{
                    ...styles.button,
                    opacity: authLoading ? 0.65 : 1,
                    cursor: authLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {authLoading ? "Working..." : "Sign In"}
                </button>
                <button
                  onClick={signUp}
                  disabled={authLoading}
                  style={{
                    ...styles.secondaryButton,
                    opacity: authLoading ? 0.65 : 1,
                    cursor: authLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </header>

        {!user ? (
          <section style={styles.loginHeroShell}>
            <div
              style={
                isMobile
                  ? {
                      ...styles.loginHeroCard,
                      ...styles.mobileOneColumnGrid,
                      padding: "24px",
                    }
                  : styles.loginHeroCard
              }
            >
              <div style={styles.loginHeroContent}>
                <div style={styles.loginHeroBadge}>AI-powered delivery assistant</div>
                <h2 style={isMobile ? { ...styles.loginHeroTitle, fontSize: "32px" } : styles.loginHeroTitle}>
                  Turn rough requirements into delivery-ready outcomes
                </h2>
                <p style={styles.loginHeroText}>
                  Convert business intake into ServiceNow-aligned solution design,
                  user stories, technical notes, QA artifacts, delivery reviews, and
                  export-ready packages.
                </p>

                <div style={styles.loginHeroFeatureList}>
                  <div style={styles.loginHeroFeature}>
                    <span style={styles.loginHeroFeatureIcon}>▣</span>
                    <span>Build solution designs, scoped app guidance, and workflow structure.</span>
                  </div>
                  <div style={styles.loginHeroFeature}>
                    <span style={styles.loginHeroFeatureIcon}>✓</span>
                    <span>Generate stories, acceptance criteria, QA cases, and UAT coverage.</span>
                  </div>
                  <div style={styles.loginHeroFeature}>
                    <span style={styles.loginHeroFeatureIcon}>AI</span>
                    <span>Ask the Delivery Lead questions and refine requirements interactively.</span>
                  </div>
                  <div style={styles.loginHeroFeature}>
                    <span style={styles.loginHeroFeatureIcon}>↗</span>
                    <span>Save projects, reload packages, and continue across devices.</span>
                  </div>
                </div>

                <div style={styles.loginHeroSecurityNote}>
                  <span style={styles.loginHeroShield}>◇</span>
                  <span>Sign in to keep your delivery packages private and reusable.</span>
                </div>
              </div>

              <div
                style={
                  isMobile
                    ? {
                        ...styles.loginHeroVisual,
                        minHeight: "520px",
                        padding: "36px 16px 22px",
                      }
                    : styles.loginHeroVisual
                }
              >
                <div style={styles.visualBrowserBar}>
                  <span style={styles.visualDot}></span>
                  <span style={styles.visualDot}></span>
                  <span style={styles.visualDot}></span>
                </div>
                <div style={styles.visualWorkspace}>
                  <div style={styles.visualColumn}>
                    <p style={styles.visualLabel}>Requirements</p>
                    <div style={styles.visualCardSmall}></div>
                    <div style={styles.visualCardSmall}></div>
                    <div style={styles.visualCardSmall}></div>
                  </div>

                  <div style={styles.visualAssistantCard}>
                    <div style={styles.visualSpark}>✦</div>
                    <p style={styles.visualAssistantTitle}>AI Delivery Lead</p>
                    <p style={styles.visualAssistantText}>
                      I analyze the intake and assemble the right delivery artifacts.
                    </p>
                  </div>

                  <div style={styles.visualColumn}>
                    <p style={styles.visualLabel}>Deliverables</p>
                    <div style={styles.visualDeliverable}>Solution Design</div>
                    <div style={styles.visualDeliverable}>User Stories</div>
                    <div style={styles.visualDeliverable}>Technical Notes</div>
                    <div style={styles.visualDeliverable}>QA Artifacts</div>
                  </div>
                </div>

                <div style={styles.visualFlowGrid}>
                  <div style={styles.visualFlowNode}>Intake</div>
                  <div style={styles.visualFlowNodePrimary}>AI</div>
                  <div style={styles.visualFlowNode}>Build</div>
                  <div style={styles.visualFlowNode}>Review</div>
                  <div style={styles.visualFlowNodeSuccess}>Deliver</div>
                </div>

                <div style={styles.visualPackageCard}>
                  <p style={styles.visualPackageTitle}>Delivery Package</p>
                  <p style={styles.visualPackageLine}>✓ Solution Design</p>
                  <p style={styles.visualPackageLine}>✓ Stories</p>
                  <p style={styles.visualPackageLine}>✓ Technical Notes</p>
                  <p style={styles.visualPackageLine}>✓ QA Artifacts</p>
                </div>
              </div>
            </div>

            <div style={styles.loginHeroPills}>
              <span style={styles.loginHeroPill}>AI-Powered</span>
              <span style={styles.loginHeroPill}>ServiceNow Aligned</span>
              <span style={styles.loginHeroPill}>Secure by Design</span>
              <span style={styles.loginHeroPill}>Export Ready</span>
            </div>
          </section>
        ) : (
          <>

        <section style={styles.templateCard}>
          <div style={responsiveTemplateHeader}>
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
            <div style={responsiveTemplateGrid}>
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

        <section style={styles.projectBar}>
          <div style={responsiveProjectBarTop}>
            <div>
              <p style={styles.label}>Project Workspace</p>
              <h2 style={styles.projectBarTitle}>Save and reload delivery packages</h2>
            </div>

            <div style={responsiveProjectActions}>
              <button onClick={newProject} style={styles.secondaryButton}>
                New / Clear
              </button>

              <button
                onClick={saveProject}
                disabled={projectSaving}
                style={{
                  ...styles.button,
                  opacity: projectSaving ? 0.65 : 1,
                  cursor: projectSaving ? "not-allowed" : "pointer",
                }}
              >
                {projectSaving
                  ? "Saving..."
                  : activeProjectId
                    ? "Update Project"
                    : "Save Project"}
              </button>
            </div>
          </div>

          <div style={responsiveProjectControls}>
            <div style={styles.projectField}>
              <label style={styles.projectLabel}>Current Project</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Optional. Name this delivery package..."
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


        {loadingStage && <div style={styles.loadingStage}>{loadingStage}</div>}

        <section style={styles.intakeCard}>
          <div style={responsiveCardHeader}>
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

          <div style={responsiveUploadArea}>
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

          <div style={responsiveTextareaFooter}>
            <span>
              Paste rough notes. It does not need to be perfectly formatted.
            </span>
            <span>
              {requirement.length} characters · {files.length} file
              {files.length === 1 ? "" : "s"}
            </span>
          </div>

          <div style={isMobile ? { ...styles.intakeActions, ...styles.mobileActionRow } : styles.intakeActions}>
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

            <button
              onClick={() => generatePackage("quick")}
              disabled={loading || analyzing}
              style={{
                ...styles.secondaryButton,
                opacity: loading || analyzing ? 0.65 : 1,
                cursor: loading || analyzing ? "not-allowed" : "pointer",
              }}
            >
              {activeGenerationMode === "quick" ? "Generating Quick..." : "Quick Package"}
            </button>

            <button
              onClick={() => generatePackage("full")}
              disabled={loading || analyzing}
              style={{
                ...styles.button,
                opacity: loading || analyzing ? 0.65 : 1,
                cursor: loading || analyzing ? "not-allowed" : "pointer",
              }}
            >
              {activeGenerationMode === "full" ? "Generating Full..." : "Full Detailed Package"}
            </button>
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

              <div style={responsiveTwoGrid}>
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
                    onClick={() => generatePackage("quick")}
                    disabled={loading || analyzing}
                    style={{
                      ...styles.secondaryButton,
                      opacity: loading || analyzing ? 0.65 : 1,
                      cursor: loading || analyzing ? "not-allowed" : "pointer",
                    }}
                  >
                    {activeGenerationMode === "quick" ? "Generating Quick..." : "Quick Package with Answers"}
                  </button>

                  <button
                    onClick={() => generatePackage("full")}
                    disabled={loading || analyzing}
                    style={{
                      ...styles.button,
                      opacity: loading || analyzing ? 0.65 : 1,
                      cursor: loading || analyzing ? "not-allowed" : "pointer",
                    }}
                  >
                    {activeGenerationMode === "full" ? "Generating Full..." : "Full Detailed Package with Answers"}
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
          <section style={styles.packageWorkspace}>
            <div style={styles.packageSummaryCard}>
              <div>
                <p style={styles.label}>Generated Package</p>
                <h2 style={styles.packageTitle}>
                  {projectName || "Current Delivery Package"}
                </h2>
                <p style={styles.muted}>
                  Use the section tabs to review, refine, and export the package without scrolling through the full output.
                </p>
                {(!result.developer || !result.qa || !result.quality_score) && (
                  <div style={{ marginTop: "14px" }}>
                    <button
                      onClick={upgradeQuickPackageToFull}
                      disabled={loading}
                      style={{
                        ...styles.button,
                        opacity: loading ? 0.65 : 1,
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loading ? "Upgrading..." : "Upgrade to Full Detailed Package"}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "12px" }}>
                  <button
                    onClick={runAgentReview}
                    disabled={loading}
                    style={{
                      ...styles.secondaryButton,
                      opacity: loading ? 0.65 : 1,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Reviewing..." : "Run Agent Review"}
                  </button>
                </div>

              <div style={isMobile ? styles.mobileSnapshotGrid : styles.snapshotGrid}>
                <div style={styles.snapshotMetric}>
                  <p style={styles.label}>{packageScoreLabel}</p>
                  <p style={styles.snapshotNumber}>
                    {displayScore(result.quality_score?.overall_score)}
                  </p>
                  <p style={styles.snapshotText}>
                    {hasScore ? "/ 100" : result.generation_mode === "quick" ? "not scored yet" : "unavailable"}
                  </p>
                </div>
                <div style={styles.snapshotMetric}>
                  <p style={styles.label}>Stories</p>
                  <p style={styles.snapshotNumber}>{result.stories?.length || 0}</p>
                  <p style={styles.snapshotText}>generated</p>
                </div>
                <div style={styles.snapshotMetric}>
                  <p style={styles.label}>Test Cases</p>
                  <p style={styles.snapshotNumber}>
                    {result.generation_mode === "quick" ? "—" : result.qa?.test_cases?.length || 0}
                  </p>
                  <p style={styles.snapshotText}>
                    {result.generation_mode === "quick" ? "full package only" : "QA cases"}
                  </p>
                </div>
                <div style={styles.snapshotMetric}>
                  <p style={styles.label}>Tech Objects</p>
                  <p style={styles.snapshotNumber}>
                    {result.generation_mode === "quick" ? "—" : result.developer?.service_now_objects?.length || 0}
                  </p>
                  <p style={styles.snapshotText}>
                    {result.generation_mode === "quick" ? "full package only" : "objects"}
                  </p>
                </div>
                <div style={styles.snapshotMetric}>
                  <p style={styles.label}>Open Questions</p>
                  <p style={styles.snapshotNumber}>{result.open_questions?.length || 0}</p>
                  <p style={styles.snapshotText}>items</p>
                </div>
              </div>
            </div>

            <div style={isMobile ? styles.mobilePackageNav : styles.packageNav}>
              {PACKAGE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPackageTab(tab.id)}
                  style={
                    packageTab === tab.id
                      ? styles.activePackageTab
                      : styles.inactivePackageTab
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {packageTab === "overview" && (
              <div style={styles.results}>
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

                      <div style={responsiveTwoGrid}>
                        <div style={styles.innerCard}>
                          <p style={styles.label}>MVP Scope</p>
                          <ul style={styles.list}>
                            {result.delivery_lead_review.mvp_scope?.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div style={styles.innerCard}>
                          <p style={styles.label}>Phase 2 Scope</p>
                          <ul style={styles.list}>
                            {result.delivery_lead_review.phase_2_scope?.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div style={responsiveTwoGrid}>
                        <div style={styles.innerCard}>
                          <p style={styles.label}>Clarifying Questions</p>
                          <ul style={styles.list}>
                            {result.delivery_lead_review.clarifying_questions?.map((question, index) => (
                              <li key={index}>{question}</li>
                            ))}
                          </ul>
                        </div>

                        <div style={styles.innerCard}>
                          <p style={styles.label}>Recommended Next Steps</p>
                          <ul style={styles.list}>
                            {result.delivery_lead_review.recommended_next_steps?.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {result.delivery_lead_review.missing_requirements?.length > 0 && (
                        <div style={styles.innerCard}>
                          <p style={styles.label}>Missing / Weak Requirements</p>
                          <div style={styles.stack}>
                            {result.delivery_lead_review.missing_requirements.map((item, index) => (
                              <div key={index} style={styles.riskBox}>
                                <p style={styles.riskTitle}>{item.gap}</p>
                                <p style={styles.bodyText}>
                                  <strong>Why it matters:</strong> {item.why_it_matters}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.delivery_lead_review.assumptions?.length > 0 && (
                        <div style={styles.innerCard}>
                          <p style={styles.label}>Assumptions</p>
                          <ul style={styles.list}>
                            {result.delivery_lead_review.assumptions.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
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
                  title={packageScoreTitle}
                  copyValue={JSON.stringify(result.quality_score, null, 2)}
                  onCopy={copyToClipboard}
                >
                  {result.quality_score ? (
                    <div style={styles.stack}>
                      {!hasUsableQualityScore(result.quality_score) && (
                        <div style={styles.riskBox}>
                          <p style={styles.riskTitle}>Score unavailable</p>
                          <p style={styles.bodyText}>
                            {result.quality_score.summary ||
                              "The backend did not return a usable score. Regenerate the score or check the quality score agent."}
                          </p>
                        </div>
                      )}

                      <div style={responsiveScoreGrid}>
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

                      {result.quality_score.build_readiness_verdict && (
  <div style={styles.innerCard}>
    <p style={styles.label}>Build Readiness Verdict</p>
    <p style={styles.accentText}>
      {result.quality_score.build_readiness_verdict}
    </p>
  </div>
)}

    {result.quality_score.score_rationale && (
      <div style={styles.innerCard}>
        <p style={styles.label}>Score Rationale</p>
        <p style={styles.bodyText}>
          <strong>Completeness:</strong>{" "}
          {result.quality_score.score_rationale.completeness}
        </p>
        <p style={styles.bodyText}>
          <strong>Risk:</strong> {result.quality_score.score_rationale.risk}
        </p>
        <p style={styles.bodyText}>
          <strong>Readiness:</strong>{" "}
          {result.quality_score.score_rationale.readiness}
        </p>
      </div>
    )}

    {result.quality_score.score_caps_applied?.length ? (
      <div style={styles.riskBox}>
        <p style={styles.riskTitle}>Score Caps / Penalties Applied</p>
        <ul style={styles.list}>
          {result.quality_score.score_caps_applied.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    ) : null}

                      <div style={responsiveTwoGrid}>
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
                        <pre style={styles.mermaidCodeBlock}>{result.process_diagram.mermaid_code}</pre>
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
              </div>
            )}

            {packageTab === "design" && (
              <div style={styles.results}>
                <div style={responsiveTopGrid}>
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
                    <p style={styles.muted}>Use this as the delivery architecture direction before refining stories and technical notes.</p>
                  </Card>
                </div>

                <Card
                  title="Open Questions / Build Gaps"
                  copyValue={result.open_questions?.join("\n")}
                  onCopy={copyToClipboard}
                >
                  {result.open_questions?.length ? (
                    <div style={responsiveTwoGrid}>
                      {result.open_questions.map((question, index) => (
                        <div key={index} style={styles.questionCard}>
                          <p style={styles.questionNumber}>Question {index + 1}</p>
                          <p style={styles.bodyText}>{question}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.muted}>No open questions identified.</p>
                  )}
                </Card>

                <Card
                  title="Solution Design"
                  copyValue={result.solution_design}
                  onCopy={copyToClipboard}
                >
                  <div style={styles.stack}>
                    <p style={styles.bodyText}>{result.solution_design}</p>
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

                <div style={responsiveTwoGrid}>
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
              </div>
            )}

            {packageTab === "stories" && (
              <Card
                title="Stories"
                copyValue={JSON.stringify(result.stories, null, 2)}
                onCopy={copyToClipboard}
              >
                <div style={styles.stack}>
                  {result.epic && (
                    <div style={styles.innerCard}>
                      <p style={styles.label}>Epic</p>
                      <p style={styles.accentText}>{result.epic}</p>
                    </div>
                  )}

                  {result.stories?.length ? (
                    <div style={responsiveTwoGrid}>
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
                                {story.acceptance_criteria.map((criteria, i) => (
                                  <li key={i}>{criteria}</li>
                                ))}
                              </ul>
                            </>
                          )}

                          <button
                            style={styles.smallCopyButton}
                            onClick={() => copyToClipboard(JSON.stringify(story, null, 2))}
                          >
                            Copy Story
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.muted}>No stories generated.</p>
                  )}

                  <RegeneratePanel
                    section="stories"
                    instruction={regenerateInstruction}
                    setInstruction={setRegenerateInstruction}
                    regeneratingSection={regeneratingSection}
                    onRegenerate={regenerateSection}
                  />
                </div>
              </Card>
            )}

            {packageTab === "technical" && (
              <Card
                title="Technical Workbench"
                copyValue={JSON.stringify(result.developer, null, 2)}
                onCopy={copyToClipboard}
              >
                <div style={styles.stack}>
                  {result.developer ? (
                    <>
                      <div style={styles.technicalHero}>
                        <div>
                          <p style={styles.label}>Implementation Summary</p>
                          <p style={styles.bodyText}>{result.developer.implementation_summary}</p>
                        </div>
                        <div style={styles.technicalStatsGrid}>
                          <div style={styles.technicalStat}>
                            <p style={styles.label}>Objects</p>
                            <p style={styles.snapshotNumber}>{result.developer.service_now_objects?.length || 0}</p>
                          </div>
                          <div style={styles.technicalStat}>
                            <p style={styles.label}>Flows</p>
                            <p style={styles.snapshotNumber}>{result.developer.flow_designer_notes?.length || 0}</p>
                          </div>
                          <div style={styles.technicalStat}>
                            <p style={styles.label}>Rules</p>
                            <p style={styles.snapshotNumber}>{result.developer.business_rules?.length || 0}</p>
                          </div>
                        </div>
                      </div>

                      {result.developer.service_now_objects?.length > 0 && (
                        <div style={styles.techSection}>
                          <div style={styles.techSectionHeader}>
                            <div>
                              <p style={styles.label}>Build Inventory</p>
                              <h3 style={styles.itemTitle}>ServiceNow Objects</h3>
                            </div>
                            <Badge>{result.developer.service_now_objects.length} objects</Badge>
                          </div>
                          <div style={responsiveTwoGrid}>
                            {result.developer.service_now_objects.map((object, index) => (
                              <button
                                key={index}
                                style={styles.clickableInnerCard}
                                onClick={() =>
                                  generateCodeForCard(
                                    { category: "ServiceNow Object", ...object },
                                    object.name
                                  )
                                }
                              >
                                <div style={styles.rowBetween}>
                                  <p style={styles.accentText}>{object.name}</p>
                                  <span style={styles.objectTypePill}>{object.object_type}</span>
                                </div>
                                <p style={styles.bodyText}>{object.purpose}</p>
                                <p style={styles.clickHint}>Generate implementation guidance →</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.developer.flow_designer_notes?.length > 0 && (
                        <div style={styles.techSection}>
                          <div style={styles.techSectionHeader}>
                            <div>
                              <p style={styles.label}>Automation</p>
                              <h3 style={styles.itemTitle}>Flow Designer</h3>
                            </div>
                            <Badge>{result.developer.flow_designer_notes.length} flows</Badge>
                          </div>
                          <div style={styles.stack}>
                            {result.developer.flow_designer_notes.map((flow, index) => (
                              <button
                                key={index}
                                style={styles.clickableInnerCard}
                                onClick={() =>
                                  generateCodeForCard(
                                    { category: "Flow Designer", ...flow },
                                    flow.flow_name
                                  )
                                }
                              >
                                <div style={styles.rowBetween}>
                                  <h3 style={styles.itemTitle}>{flow.flow_name}</h3>
                                  <span style={styles.statusChip}>Flow</span>
                                </div>
                                <p style={styles.muted}>Trigger: {flow.trigger}</p>
                                <ol style={styles.list}>
                                  {flow.steps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ol>
                                <p style={styles.clickHint}>Generate flow implementation details →</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.developer.business_rules?.length > 0 && (
                        <div style={styles.techSection}>
                          <div style={styles.techSectionHeader}>
                            <div>
                              <p style={styles.label}>Server Logic</p>
                              <h3 style={styles.itemTitle}>Business Rules</h3>
                            </div>
                            <Badge>{result.developer.business_rules.length} rules</Badge>
                          </div>
                          <div style={responsiveTwoGrid}>
                            {result.developer.business_rules.map((rule, index) => (
                              <button
                                key={index}
                                style={styles.clickableInnerCard}
                                onClick={() =>
                                  generateCodeForCard(
                                    { category: "Business Rule", ...rule },
                                    rule.name
                                  )
                                }
                              >
                                <div style={styles.rowBetween}>
                                  <h3 style={styles.itemTitle}>{rule.name}</h3>
                                  <span style={styles.statusChip}>{rule.when}</span>
                                </div>
                                <p style={styles.muted}>Condition: {rule.condition}</p>
                                <p style={styles.bodyText}>{rule.purpose}</p>
                                <p style={styles.clickHint}>Generate business rule script/guidance →</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={responsiveTwoGrid}>
                        <div style={styles.innerCard}>
                          <p style={styles.label}>ACL / Security Notes</p>
                          {result.developer.acl_notes?.length ? (
                            <ul style={styles.list}>
                              {result.developer.acl_notes.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={styles.muted}>No ACL notes generated.</p>
                          )}
                        </div>
                        <div style={styles.innerCard}>
                          <p style={styles.label}>Notification Notes</p>
                          {result.developer.notification_notes?.length ? (
                            <ul style={styles.list}>
                              {result.developer.notification_notes.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={styles.muted}>No notification notes generated.</p>
                          )}
                        </div>
                      </div>

                      {result.developer.deployment_notes?.length > 0 && (
                        <div style={styles.innerCard}>
                          <p style={styles.label}>Deployment Notes</p>
                          <ul style={styles.list}>
                            {result.developer.deployment_notes.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <RegeneratePanel
                        section="developer"
                        instruction={regenerateInstruction}
                        setInstruction={setRegenerateInstruction}
                        regeneratingSection={regeneratingSection}
                        onRegenerate={regenerateSection}
                      />
                    </>
                  ) : (
                    <div style={styles.emptyCard}>
                      <h2 style={styles.sectionTitle}>Technical notes are not available yet</h2>
                      <p style={styles.bodyText}>
                        Generate a full detailed package or upgrade the quick package to create implementation notes, flows, ACL guidance, notifications, and code-ready objects.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {packageTab === "qa" && (
              <Card
                title="QA"
                copyValue={JSON.stringify(result.qa, null, 2)}
                onCopy={copyToClipboard}
              >
                <div style={styles.stack}>
                  {result.qa ? (
                    <>
                      <div style={styles.innerCard}>
                        <p style={styles.label}>Test Strategy</p>
                        <p style={styles.bodyText}>{result.qa.test_strategy}</p>
                      </div>

                      {result.qa.test_cases?.length > 0 && (
                        <>
                          <p style={styles.label}>Test Cases</p>
                          <div style={responsiveTwoGrid}>
                            {result.qa.test_cases.map((test, index) => (
                              <div key={index} style={styles.innerCard}>
                                <div style={styles.rowBetween}>
                                  <h3 style={styles.itemTitle}>{test.id}: {test.title}</h3>
                                  <Badge>{test.priority}</Badge>
                                </div>

                                <p style={styles.accentText}>{test.type}</p>
                                <ol style={styles.list}>
                                  {test.steps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ol>
                                <p style={styles.bodyText}>
                                  <strong>Expected:</strong> {test.expected_result}
                                </p>
                                <button
                                  style={styles.smallCopyButton}
                                  onClick={() => copyToClipboard(JSON.stringify(test, null, 2))}
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
                          <div style={responsiveTwoGrid}>
                            {result.qa.uat_cases.map((uat, index) => (
                              <div key={index} style={styles.innerCard}>
                                <h3 style={styles.itemTitle}>{uat.id}: {uat.title}</h3>
                                <p style={styles.muted}>{uat.persona}</p>
                                <ol style={styles.list}>
                                  {uat.steps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ol>
                                <p style={styles.bodyText}>
                                  <strong>Expected:</strong> {uat.expected_result}
                                </p>
                                <button
                                  style={styles.smallCopyButton}
                                  onClick={() => copyToClipboard(JSON.stringify(uat, null, 2))}
                                >
                                  Copy UAT Case
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <RegeneratePanel
                        section="qa"
                        instruction={regenerateInstruction}
                        setInstruction={setRegenerateInstruction}
                        regeneratingSection={regeneratingSection}
                        onRegenerate={regenerateSection}
                      />
                    </>
                  ) : (
                    <p style={styles.muted}>No QA generated.</p>
                  )}
                </div>
              </Card>
            )}

            {packageTab === "review" && (
              <Card
                title="Agent Review Board"
                copyValue={JSON.stringify(result.agent_review, null, 2)}
                onCopy={copyToClipboard}
              >
                {result.agent_review ? (
                  <div style={styles.stack}>
                    <div style={styles.reviewSummaryGrid}>
                      <div style={styles.innerCard}>
                        <p style={styles.label}>Overall Review Summary</p>
                        <p style={styles.bodyText}>
                          {result.agent_review.overall_review_summary}
                        </p>
                        <p style={{ ...styles.accentText, marginTop: "12px" }}>
                          Final Verdict: {result.agent_review.final_verdict}
                        </p>
                      </div>

                      <div style={styles.innerCard}>
                        <p style={styles.label}>How to Use This Review</p>
                        <p style={styles.bodyText}>
                          Start with the overall verdict and priority fixes. Then open a specialist
                          tab below to review Architect, Developer, QA, or Delivery Lead feedback.
                          You can ask that agent questions and apply requirement updates when needed.
                        </p>
                      </div>
                    </div>

                    {result.agent_review.priority_fixes?.length > 0 && (
                      <div style={styles.innerCard}>
                        <div style={styles.cardTitleRow}>
                          <div>
                            <p style={styles.label}>Priority Fixes</p>
                            <h3 style={styles.itemTitle}>Fix these before build handoff</h3>
                          </div>
                          <Badge>{result.agent_review.priority_fixes.length} fixes</Badge>
                        </div>

                        <div style={styles.priorityFixGrid}>
                          {result.agent_review.priority_fixes.map((fix, index) => (
                            <div key={index} style={styles.priorityFixCard}>
                              <p style={styles.riskTitle}>
                                {fix.priority}: {fix.fix}
                              </p>
                              <p style={styles.bodyText}>
                                <strong>Reason:</strong> {fix.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={styles.reviewAgentShell}>
                      <div style={styles.reviewAgentTabs}>
                        {REVIEW_AGENT_TABS.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveReviewAgent(tab.id);
                              setReviewAgentMessage("");
                              setReviewAgentPendingRequirementUpdate("");
                            }}
                            style={
                              activeReviewAgent === tab.id
                                ? styles.activeReviewAgentTab
                                : styles.inactiveReviewAgentTab
                            }
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <ReviewAgentPanel
                        agentTitle={
                          REVIEW_AGENT_TABS.find((tab) => tab.id === activeReviewAgent)?.title ||
                          "Agent Review"
                        }
                        review={getReviewFeedback(activeReviewAgent)}
                      />

                      <div style={styles.reviewAgentChatBox}>
                        <div style={styles.reviewAgentChatHeader}>
                          <div>
                            <p style={styles.label}>Reviewer Chat</p>
                            <h3 style={styles.itemTitle}>
                              Talk directly with {getReviewAgentLabel(activeReviewAgent)}
                            </h3>
                            <p style={styles.muted}>
                              Ask for priority fixes, requirement rewrites, implementation guidance,
                              risks, or what to clarify with business.
                            </p>
                          </div>

                          <Badge>{reviewAgentChats[activeReviewAgent]?.length || 0} messages</Badge>
                        </div>

                        <div style={styles.reviewAgentPromptGrid}>
                          {[
                            "What should I fix first?",
                            "Rewrite the requirement for your top concern.",
                            "What questions should I ask business?",
                            "What is risky for build handoff?",
                          ].map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              onClick={() => setReviewAgentMessage(prompt)}
                              style={styles.reviewAgentPromptButton}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>

                        <div style={styles.agentChatHistoryLarge}>
                          {reviewAgentChats[activeReviewAgent]?.length ? (
                            reviewAgentChats[activeReviewAgent].map((message, index) => (
                              <div
                                key={index}
                                style={
                                  message.role === "user"
                                    ? styles.agentUserMessage
                                    : styles.agentResponseMessage
                                }
                              >
                                <p style={styles.label}>
                                  {message.role === "user"
                                    ? "You"
                                    : getReviewAgentLabel(activeReviewAgent)}
                                </p>
                                <p style={styles.agentMessageText}>{message.content}</p>
                              </div>
                            ))
                          ) : (
                            <div style={styles.agentChatEmpty}>
                              <p style={styles.label}>Start with a specific ask</p>
                              <p style={styles.bodyText}>
                                Example: “Developer, rewrite the requirement to address your top
                                implementation concern.” If the reviewer suggests a requirement update,
                                you can apply it back to the main requirement.
                              </p>
                            </div>
                          )}
                        </div>

                        {reviewAgentPendingRequirementUpdate && (
                          <div style={styles.requirementUpdateBox}>
                            <p style={styles.label}>Suggested Requirement Update</p>
                            <p style={styles.bodyText}>{reviewAgentPendingRequirementUpdate}</p>
                            <button
                              onClick={() =>
                                applyReviewAgentRequirementUpdate(
                                  reviewAgentPendingRequirementUpdate
                                )
                              }
                              style={{ ...styles.button, marginTop: "12px" }}
                            >
                              Apply to Requirement
                            </button>
                          </div>
                        )}

                        <div style={styles.reviewAgentComposer}>
                          <textarea
                            value={reviewAgentMessage}
                            onChange={(e) => setReviewAgentMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                e.preventDefault();
                                askReviewAgent();
                              }
                            }}
                            placeholder={`Ask ${getReviewAgentLabel(activeReviewAgent)} to clarify, critique, rewrite, or improve the requirement...`}
                            style={styles.reviewAgentTextarea}
                          />

                          <div style={styles.reviewAgentActions}>
                            <button
                              onClick={askReviewAgent}
                              disabled={reviewAgentThinking || loading}
                              style={{
                                ...styles.button,
                                opacity: reviewAgentThinking || loading ? 0.65 : 1,
                                cursor:
                                  reviewAgentThinking || loading ? "not-allowed" : "pointer",
                              }}
                            >
                              {reviewAgentThinking
                                ? "Thinking..."
                                : `Ask ${getReviewAgentLabel(activeReviewAgent)}`}
                            </button>

                            <button
                              onClick={() => {
                                setReviewAgentChats({
                                  ...reviewAgentChats,
                                  [activeReviewAgent]: [],
                                });
                                setReviewAgentPendingRequirementUpdate("");
                              }}
                              style={styles.secondaryButton}
                            >
                              Clear Chat
                            </button>
                          </div>

                          <p style={styles.composerHint}>
                            Press Cmd/Ctrl + Enter to send. Use the reviewer tabs above to switch
                            between Architect, Developer, QA, and Delivery Lead.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={runAgentReview}
                      disabled={loading}
                      style={{
                        ...styles.secondaryButton,
                        opacity: loading ? 0.65 : 1,
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loading ? "Reviewing..." : "Rerun Agent Review"}
                    </button>
                  </div>
                ) : (
                  <div style={styles.stack}>
                    <p style={styles.bodyText}>
                      Run the agent review board to have the Architect, Developer, QA Lead,
                      and Delivery Lead critique this package.
                    </p>
                    <button
                      onClick={runAgentReview}
                      disabled={loading}
                      style={{
                        ...styles.button,
                        opacity: loading ? 0.65 : 1,
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loading ? "Reviewing..." : "Run Agent Review"}
                    </button>
                  </div>
                )}
              </Card>
            )}

            {packageTab === "delivery_lead" && (
              <Card title="Delivery Lead Copilot">
                <div style={styles.stack}>
                  <div style={styles.innerCard}>
                    <p style={styles.label}>Ask the Delivery Lead</p>
                    <p style={styles.bodyText}>
                      Ask about scope, missing requirements, ServiceNow approach, MVP vs phase 2,
                      stakeholder questions, risks, or request updates to the requirement.
                    </p>
                  </div>

                  {deliveryLeadChat.length > 0 && (
                    <div style={styles.stack}>
                      {deliveryLeadChat.map((message, index) => (
                        <div
                          key={index}
                          style={
                            message.role === "user"
                              ? styles.chatUserBubble
                              : styles.chatLeadBubble
                          }
                        >
                          <p style={styles.label}>
                            {message.role === "user" ? "You" : "Delivery Lead"}
                          </p>

                          <p style={styles.bodyText}>{safeText(message.content)}</p>
                          
                          {message.response?.artifact_type && (
                          <div style={styles.innerCard}>
                            <p style={styles.label}>Artifact Type</p>
                            <p style={styles.accentText}>{safeText(message.response.artifact_type)}</p>
                          </div>
                        )}

                        {message.response?.artifact_details && (
                          <div style={styles.innerCard}>
                            <p style={styles.label}>Artifact Details</p>

                            {message.response.artifact_details.name && (
                              <p style={styles.bodyText}>
                                <strong>Name:</strong>{" "}
                                {safeText(message.response.artifact_details.name)}
                              </p>
                            )}

                            {message.response.artifact_details.table && (
                              <p style={styles.bodyText}>
                                <strong>Table:</strong>{" "}
                                {safeText(message.response.artifact_details.table)}
                              </p>
                            )}

                            {message.response.artifact_details.trigger && (
                              <p style={styles.bodyText}>
                                <strong>Trigger:</strong>{" "}
                                {safeText(message.response.artifact_details.trigger)}
                              </p>
                            )}

                            {message.response.artifact_details.condition && (
                              <p style={styles.bodyText}>
                                <strong>Condition:</strong>{" "}
                                {safeText(message.response.artifact_details.condition)}
                              </p>
                            )}

                            {safeList(message.response.artifact_details.recipients).length > 0 && (
                              <>
                                <p style={styles.label}>Recipients</p>
                                <ul style={styles.list}>
                                  {safeList(message.response.artifact_details.recipients).map((item, i) => (
                                    <li key={i}>
                                      <pre style={styles.inlinePre}>{safeText(item)}</pre>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}

                            {message.response.artifact_details.subject && (
                              <p style={styles.bodyText}>
                                <strong>Subject:</strong>{" "}
                                {safeText(message.response.artifact_details.subject)}
                              </p>
                            )}

                            {message.response.artifact_details.body && (
                              <>
                                <p style={styles.label}>Body / Content</p>
                                <pre style={styles.inlinePre}>
                                  {safeText(message.response.artifact_details.body)}
                                </pre>
                              </>
                            )}

                            {safeList(message.response.artifact_details.steps).length > 0 && (
                              <>
                                <p style={styles.label}>Steps</p>
                                <ol style={styles.list}>
                                  {safeList(message.response.artifact_details.steps).map((item, i) => (
                                    <li key={i}>
                                      <pre style={styles.inlinePre}>{safeText(item)}</pre>
                                    </li>
                                  ))}
                                </ol>
                              </>
                            )}

                            {safeList(message.response.artifact_details.roles).length > 0 && (
                              <>
                                <p style={styles.label}>Roles</p>
                                <ul style={styles.list}>
                                  {safeList(message.response.artifact_details.roles).map((item, i) => (
                                    <li key={i}>
                                      <pre style={styles.inlinePre}>{safeText(item)}</pre>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}

                            {safeList(message.response.artifact_details.fields).length > 0 && (
                              <>
                                <p style={styles.label}>Fields</p>
                                <ul style={styles.list}>
                                  {safeList(message.response.artifact_details.fields).map((item, i) => (
                                    <li key={i}>
                                      <pre style={styles.inlinePre}>{safeText(item)}</pre>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}

                            {message.response.artifact_details.expected_result && (
                              <p style={styles.bodyText}>
                                <strong>Expected Result:</strong>{" "}
                                {safeText(message.response.artifact_details.expected_result)}
                              </p>
                            )}

                            {safeList(message.response.artifact_details.notes).length > 0 && (
                              <>
                                <p style={styles.label}>Notes</p>
                                <ul style={styles.list}>
                                  {safeList(message.response.artifact_details.notes).map((item, i) => (
                                    <li key={i}>
                                      <pre style={styles.inlinePre}>{safeText(item)}</pre>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}

                            <button
                              onClick={() =>
                                copyToClipboard(
                                  JSON.stringify(message.response?.artifact_details, null, 2)
                                )
                              }
                              style={{
                                ...styles.secondaryButton,
                                marginTop: "14px",
                              }}
                            >
                              Copy Artifact Details
                            </button>
                          </div>
                        )}

                          {message.response && (
                            <div style={{ marginTop: "14px" }}>
                              {message.response.delivery_lead_recommendation && (
                                <div style={styles.innerCard}>
                                  <p style={styles.label}>Recommendation</p>
                                  <p style={styles.bodyText}>
                                    {safeText(message.response.delivery_lead_recommendation)}
                                  </p>
                                </div>
                              )}

                              {message.response.impacted_sections?.length > 0 && (
                                <div style={{ ...styles.innerCard, marginTop: "12px" }}>
                                  <p style={styles.label}>Impacted Sections</p>
                                  <ul style={styles.list}>
                                    {message.response.impacted_sections.map((item, i) => (
                                      <li key={i}>{safeText(item)}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {message.response.follow_up_questions?.length > 0 && (
                                <div style={{ ...styles.innerCard, marginTop: "12px" }}>
                                  <p style={styles.label}>Follow-Up Questions</p>
                                  <ul style={styles.list}>
                                    {message.response.follow_up_questions.map((item, i) => (
                                      <li key={i}>{safeText(item)}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {message.response.suggested_requirement_update && (
                                <div style={{ ...styles.riskBox, marginTop: "12px" }}>
                                  <p style={styles.riskTitle}>Suggested Requirement Update</p>
                                  <p style={styles.bodyText}>
                                    {safeText(message.response.suggested_requirement_update)}
                                  </p>
                                </div>
                              )}

                              {message.response.recommended_next_action && (
                                <p style={{ ...styles.accentText, marginTop: "12px" }}>
                                  Recommended Next Action: {safeText(message.response.recommended_next_action)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    value={deliveryLeadMessage}
                    onChange={(e) => setDeliveryLeadMessage(e.target.value)}
                    placeholder="Ask the Delivery Lead: What is missing? Should this be a scoped app or catalog item? Update the requirement to include a rejection path..."
                    style={styles.regenerateTextarea}
                  />

                  <div style={isMobile ? styles.mobileActionRow : styles.exportActions}>
                    <button
                      onClick={askDeliveryLead}
                      disabled={deliveryLeadThinking || loading}
                      style={{
                        ...styles.button,
                        opacity: deliveryLeadThinking || loading ? 0.65 : 1,
                        cursor: deliveryLeadThinking || loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {deliveryLeadThinking ? "Thinking..." : "Ask Delivery Lead"}
                    </button>

                    {deliveryLeadPendingRequirementUpdate && (
                      <button
                        onClick={() =>
                          applyDeliveryLeadRequirementUpdate(
                            deliveryLeadPendingRequirementUpdate
                          )
                        }
                        style={styles.secondaryButton}
                      >
                        Apply Requirement Update
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setDeliveryLeadChat([]);
                        setDeliveryLeadPendingRequirementUpdate("");
                      }}
                      style={styles.secondaryButton}
                    >
                      Clear Chat
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {packageTab === "export" && (
              <Card
                title="Export Package"
                copyValue={buildMarkdown(result)}
                onCopy={copyToClipboard}
              >
                <div style={styles.stack}>
                  <div style={styles.innerCard}>
                    <p style={styles.label}>Export Options</p>
                    <p style={styles.bodyText}>
                      Export the full delivery package for review, delivery handoff, or copy-paste into your delivery tools.
                    </p>
                  </div>

                  <div style={isMobile ? styles.mobileActionRow : styles.exportActions}>
                    <button onClick={exportMarkdown} style={styles.secondaryButton}>
                      Export Markdown
                    </button>
                    <button onClick={exportDocx} style={styles.button}>
                      Export DOCX
                    </button>
                    <button
                      onClick={() => copyToClipboard(buildMarkdown(result))}
                      style={styles.secondaryButton}
                    >
                      Copy Full Package
                    </button>
                  </div>

                  <details style={styles.detailsBox}>
                    <summary style={styles.detailsSummary}>Preview Markdown Export</summary>
                    <pre style={styles.mermaidCodeBlock}>{buildMarkdown(result)}</pre>
                  </details>
                </div>
              </Card>
            )}
          </section>
        )}
          </>
        )}

        {user && (
          <button
            onClick={() => setFloatingChatOpen(true)}
            style={styles.floatingChatButton}
            aria-label="Open site help chat"
          >
            <span style={styles.floatingChatIcon}>?</span>
            Site Help
          </button>
        )}

        {floatingChatOpen && (
          <div style={styles.floatingChatPanel}>
            <div style={styles.floatingChatHeader}>
              <div>
                <p style={styles.label}>Site Help Assistant</p>
                <h3 style={styles.modalTitle}>How to use this site</h3>
              </div>
              <button
                style={styles.closeButton}
                onClick={() => setFloatingChatOpen(false)}
              >
                Close
              </button>
            </div>

            <div style={styles.miniChatBody}>
              {siteAssistantChat.length ? (
                siteAssistantChat.slice(-8).map((message, index) => (
                  <div
                    key={index}
                    style={message.role === "user" ? styles.chatUserBubble : styles.chatLeadBubble}
                  >
                    <p style={styles.label}>{message.role === "user" ? "You" : "Site Guide"}</p>
                    <p style={styles.bodyText}>{safeText(message.content)}</p>
                  </div>
                ))
              ) : (
                <div style={styles.innerCard}>
                  <p style={styles.bodyText}>
                    I can explain how to use this site: templates, requirement intake,
                    Quick vs Full Package, saved projects, package tabs, technical notes,
                    Delivery Lead chat, and exports.
                  </p>
                  <div style={styles.sitePromptGrid}>
                    <button
                      onClick={() => setSiteAssistantMessage("How do I use this site?")}
                      style={styles.sitePromptButton}
                    >
                      How do I use this site?
                    </button>
                    <button
                      onClick={() => setSiteAssistantMessage("What is Quick Package vs Full Detailed Package?")}
                      style={styles.sitePromptButton}
                    >
                      Quick vs Full
                    </button>
                    <button
                      onClick={() => setSiteAssistantMessage("How do I save and reload projects?")}
                      style={styles.sitePromptButton}
                    >
                      Save projects
                    </button>
                    <button
                      onClick={() => setSiteAssistantMessage("Where do I get technical notes and code guidance?")}
                      style={styles.sitePromptButton}
                    >
                      Technical notes
                    </button>
                  </div>
                </div>
              )}

              {siteAssistantThinking && (
                <div style={styles.chatLeadBubble}>
                  <p style={styles.label}>Site Guide</p>
                  <p style={styles.bodyText}>Thinking...</p>
                </div>
              )}
            </div>

            <textarea
              value={siteAssistantMessage}
              onChange={(e) => setSiteAssistantMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  askSiteAssistant();
                }
              }}
              placeholder="Ask how to use templates, packages, saving, exports, tabs, or technical notes..."
              style={styles.miniChatTextarea}
            />
            <div style={styles.exportActions}>
              <button
                onClick={askSiteAssistant}
                disabled={siteAssistantThinking}
                style={{
                  ...styles.button,
                  opacity: siteAssistantThinking ? 0.65 : 1,
                  cursor: siteAssistantThinking ? "not-allowed" : "pointer",
                }}
              >
                {siteAssistantThinking ? "Thinking..." : "Send"}
              </button>
              <button onClick={() => setSiteAssistantChat([])} style={styles.secondaryButton}>
                Clear
              </button>
              <button
                onClick={() => {
                  setFloatingChatOpen(false);
                  setPackageTab("delivery_lead");
                }}
                style={styles.secondaryButton}
              >
                Open Delivery Lead Tab
              </button>
            </div>
          </div>
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
  score: number | null | undefined;
  color: string;
  background: string;
}) {
  return (
    <div style={{ ...styles.scoreBox, background }}>
      <p style={styles.label}>{label}</p>
      <p style={{ ...styles.scoreNumber, color }}>{displayScore(score)}</p>
      <p style={styles.scoreOutOf}>{isValidScore(score) ? "/ 100" : "Unavailable"}</p>
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


function ReviewAgentPanel({
  agentTitle,
  review,
}: {
  agentTitle: string;
  review: AgentReviewerFeedback | null;
}) {
  if (!review) {
    return (
      <div style={styles.innerCard}>
        <p style={styles.muted}>Run the agent review board to see this reviewer feedback.</p>
      </div>
    );
  }

  return (
    <div style={styles.reviewAgentPanel}>
      <div style={styles.cardTitleRow}>
        <div>
          <p style={styles.label}>Specialist Review</p>
          <h3 style={styles.itemTitle}>{agentTitle}</h3>
        </div>
      </div>

      <div style={styles.reviewAgentContentGrid}>
        <div style={styles.innerCard}>
          <p style={styles.label}>What Looks Good</p>
          <ul style={styles.list}>
            {review.what_looks_good?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={styles.innerCard}>
          <p style={styles.label}>Concerns</p>
          <ul style={styles.list}>
            {review.concerns?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={styles.innerCard}>
          <p style={styles.label}>Recommended Improvements</p>
          <ul style={styles.list}>
            {review.recommended_improvements?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={styles.innerCard}>
          <p style={styles.label}>Questions for Business</p>
          <ul style={styles.list}>
            {review.questions_for_business?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReviewerCard({
  title,
  review,
}: {
  title: string;
  review: AgentReviewerFeedback;
}) {
  return (
    <div style={styles.innerCard}>
      <h3 style={styles.itemTitle}>{title}</h3>

      <p style={styles.label}>What Looks Good</p>
      <ul style={styles.list}>
        {review.what_looks_good?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <p style={styles.label}>Concerns</p>
      <ul style={styles.list}>
        {review.concerns?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <p style={styles.label}>Recommended Improvements</p>
      <ul style={styles.list}>
        {review.recommended_improvements?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <p style={styles.label}>Questions for Business</p>
      <ul style={styles.list}>
        {review.questions_for_business?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
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
    maxWidth: "1360px",
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
    whiteSpace: "nowrap",
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

authBox: {
  display: "grid",
  gridTemplateColumns: "180px 180px auto auto",
  gap: "10px",
  alignItems: "center",
},

authBoxCompact: {
  display: "grid",
  gridTemplateColumns: "minmax(210px, 1fr) minmax(190px, 1fr) 96px 104px",
  gap: "10px",
  alignItems: "center",
  minWidth: "690px",
},

authInput: {
  width: "100%",
  border: "1px solid #CBD5E1",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.94)",
  color: "#0F172A",
  padding: "14px 16px",
  fontSize: "15px",
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box",
},

accountTopRight: {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
},

signedInPill: {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  border: "1px solid #CBD5E1",
  borderRadius: "999px",
  background: "#FFFFFF",
  padding: "10px 14px",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 800,
},

signedInDot: {
  width: "8px",
  height: "8px",
  borderRadius: "999px",
  background: "#16A34A",
},

signedInText: {
  color: "#16A34A",
  fontWeight: 900,
},

signedInEmail: {
  color: "#475569",
  fontWeight: 800,
},

loginHeroShell: {
  width: "100%",
  maxWidth: "1220px",
  margin: "54px auto 0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "26px",
},

loginHeroCard: {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "0.92fr 1.08fr",
  gap: "34px",
  alignItems: "center",
  background: "rgba(255,255,255,0.96)",
  border: "1px solid #CBD5E1",
  borderRadius: "32px",
  padding: "44px",
  boxShadow: "0 28px 84px rgba(15, 23, 42, 0.13)",
  boxSizing: "border-box",
},

loginHeroContent: {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
},

loginHeroBadge: {
  alignSelf: "flex-start",
  borderRadius: "999px",
  background: "#DBEAFE",
  color: "#1D4ED8",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
},

loginHeroTitle: {
  margin: 0,
  color: "#0F172A",
  fontSize: "42px",
  lineHeight: "1.08",
  fontWeight: 950,
  letterSpacing: "-0.05em",
},

loginHeroText: {
  margin: 0,
  color: "#475569",
  fontSize: "17px",
  lineHeight: "1.75",
},

loginHeroFeatureList: {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  marginTop: "4px",
},

loginHeroFeature: {
  display: "grid",
  gridTemplateColumns: "42px 1fr",
  gap: "14px",
  alignItems: "center",
  color: "#334155",
  fontSize: "15px",
  lineHeight: "1.65",
  fontWeight: 650,
},

loginHeroFeatureIcon: {
  width: "42px",
  height: "42px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "14px",
  background: "#EEF2FF",
  color: "#4F46E5",
  fontWeight: 950,
  fontSize: "13px",
},

loginHeroSecurityNote: {
  marginTop: "8px",
  paddingTop: "18px",
  borderTop: "1px solid #E2E8F0",
  display: "flex",
  gap: "10px",
  alignItems: "center",
  color: "#64748B",
  fontSize: "14px",
  fontWeight: 750,
},

loginHeroShield: {
  color: "#059669",
  fontWeight: 950,
},

loginHeroVisual: {
  position: "relative",
  minHeight: "450px",
  borderRadius: "26px",
  background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 45%, #F5F3FF 100%)",
  border: "1px solid #D8E3F8",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
  overflow: "hidden",
  padding: "42px 34px 34px",
},

visualBrowserBar: {
  position: "absolute",
  top: "26px",
  left: "34px",
  right: "34px",
  height: "34px",
  borderRadius: "14px 14px 0 0",
  background: "#0F172A",
  display: "flex",
  alignItems: "center",
  gap: "7px",
  padding: "0 14px",
},

visualDot: {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: "#CBD5E1",
},

visualWorkspace: {
  marginTop: "18px",
  padding: "52px 22px 20px",
  borderRadius: "0 0 20px 20px",
  background: "rgba(255,255,255,0.86)",
  border: "1px solid #E2E8F0",
  display: "grid",
  gridTemplateColumns: "1fr 1.1fr 1fr",
  gap: "16px",
},

visualColumn: {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
},

visualLabel: {
  margin: "0 0 2px",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 900,
},

visualCardSmall: {
  height: "42px",
  borderRadius: "12px",
  background: "#F1F5F9",
  border: "1px solid #E2E8F0",
},

visualAssistantCard: {
  borderRadius: "18px",
  background: "#FFFFFF",
  border: "1px solid #C7D2FE",
  padding: "18px",
  boxShadow: "0 18px 40px rgba(79, 70, 229, 0.12)",
},

visualSpark: {
  width: "36px",
  height: "36px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #2563EB, #7C3AED)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 950,
  marginBottom: "12px",
},

visualAssistantTitle: {
  margin: "0 0 6px",
  color: "#0F172A",
  fontWeight: 900,
  fontSize: "14px",
},

visualAssistantText: {
  margin: 0,
  color: "#64748B",
  fontSize: "12px",
  lineHeight: "1.55",
},

visualDeliverable: {
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#ECFDF5",
  border: "1px solid #BBF7D0",
  color: "#166534",
  fontSize: "12px",
  fontWeight: 850,
},

visualFlowGrid: {
  margin: "22px auto 0",
  maxWidth: "430px",
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "10px",
  alignItems: "center",
},

visualFlowNode: {
  padding: "12px 8px",
  borderRadius: "16px",
  background: "#FFFFFF",
  border: "1px solid #CBD5E1",
  color: "#334155",
  textAlign: "center",
  fontSize: "12px",
  fontWeight: 900,
},

visualFlowNodePrimary: {
  padding: "14px 8px",
  borderRadius: "18px",
  background: "linear-gradient(135deg, #2563EB, #7C3AED)",
  color: "#FFFFFF",
  textAlign: "center",
  fontSize: "14px",
  fontWeight: 950,
  boxShadow: "0 16px 32px rgba(37, 99, 235, 0.28)",
},

visualFlowNodeSuccess: {
  padding: "12px 8px",
  borderRadius: "16px",
  background: "#D1FAE5",
  border: "1px solid #A7F3D0",
  color: "#047857",
  textAlign: "center",
  fontSize: "12px",
  fontWeight: 900,
},

visualPackageCard: {
  position: "absolute",
  right: "28px",
  bottom: "26px",
  width: "190px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.94)",
  border: "1px solid #C7D2FE",
  padding: "18px",
  boxShadow: "0 22px 50px rgba(15, 23, 42, 0.14)",
},

visualPackageTitle: {
  margin: "0 0 10px",
  color: "#0F172A",
  fontWeight: 950,
  fontSize: "15px",
},

visualPackageLine: {
  margin: "6px 0",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 800,
},

loginHeroPills: {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "12px",
},

loginHeroPill: {
  padding: "10px 18px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.9)",
  border: "1px solid #CBD5E1",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 850,
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
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },

  templateTile: {
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    background: "#FFFFFF",
    padding: "16px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
    minWidth: 0,
    overflow: "hidden",
  },

  templateTileTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "flex-start",
    marginBottom: "10px",
    flexWrap: "wrap",
  },

  templateName: {
    margin: 0,
    color: "#0F172A",
    fontSize: "16px",
    fontWeight: 850,
    lineHeight: "1.35",
    overflowWrap: "anywhere",
    maxWidth: "100%",
  },

  templateCategory: {
    display: "inline-flex",
    borderRadius: "999px",
    background: "#DBEAFE",
    color: "#1D4ED8",
    padding: "4px 8px",
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
    minHeight: "68px",
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
  intakeActions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "12px",
    marginTop: "18px",
    paddingTop: "18px",
    borderTop: "1px solid #E2E8F0",
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
  packageWorkspace: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  packageSummaryCard: {
    background: "rgba(255,255,255,0.96)",
    border: "1px solid #CBD5E1",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.10)",
  },
  packageTitle: {
    margin: "0 0 8px",
    color: "#0F172A",
    fontSize: "26px",
    lineHeight: "1.2",
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  snapshotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "18px",
  },
  mobileSnapshotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "18px",
  },
  snapshotMetric: {
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    padding: "14px",
  },
  snapshotNumber: {
    margin: "4px 0 0",
    color: "#2563EB",
    fontSize: "30px",
    lineHeight: "1",
    fontWeight: 900,
  },
  snapshotText: {
    margin: "5px 0 0",
    color: "#64748B",
    fontSize: "12px",
    fontWeight: 800,
  },
  packageNav: {
  position: "sticky",
  top: "0",
  zIndex: 30,
  display: "grid",
  gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
  gap: "10px",
  padding: "12px",
  background: "rgba(255, 255, 255, 0.92)",
  border: "1px solid #CBD5E1",
  borderRadius: "20px",
  boxShadow: "0 14px 40px rgba(15, 23, 42, 0.10)",
  backdropFilter: "blur(12px)",
},
  mobilePackageNav: {
    position: "sticky",
    top: "0",
    zIndex: 30,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    padding: "10px",
    background: "rgba(255, 255, 255, 0.94)",
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.10)",
    backdropFilter: "blur(12px)",
  },
  activePackageTab: {
    border: "1px solid #2563EB",
    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
    color: "#FFFFFF",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.22)",
  },
  inactivePackageTab: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#334155",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },
  exportActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
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
  chatUserBubble: {
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    borderRadius: "18px",
    padding: "18px",
  },
  chatLeadBubble: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
  },
  inlinePre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#334155",
    background: "transparent",
  },
  technicalHero: {
    background: "linear-gradient(135deg, #EFF6FF, #F8FAFC)",
    border: "1px solid #BFDBFE",
    borderRadius: "20px",
    padding: "20px",
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "18px",
    alignItems: "center",
  },
  technicalStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
  },
  technicalStat: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "16px",
    padding: "12px",
    textAlign: "center",
  },
  techSection: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
  },
  techSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
  },
  objectTypePill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    background: "#EEF2FF",
    color: "#4338CA",
    padding: "5px 9px",
    fontSize: "12px",
    fontWeight: 850,
    whiteSpace: "nowrap",
  },
  statusChip: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    background: "#ECFDF5",
    color: "#047857",
    padding: "5px 9px",
    fontSize: "12px",
    fontWeight: 850,
    whiteSpace: "nowrap",
  },
  questionCard: {
    background: "#FFFBEB",
    border: "1px solid #FACC15",
    borderRadius: "18px",
    padding: "16px",
  },
  questionNumber: {
    margin: "0 0 8px",
    color: "#92400E",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 850,
  },
  floatingChatButton: {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    zIndex: 800,
    border: "0",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
    color: "#FFFFFF",
    padding: "14px 18px",
    fontSize: "14px",
    fontWeight: 900,
    boxShadow: "0 20px 50px rgba(37, 99, 235, 0.35)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  floatingChatIcon: {
    display: "inline-flex",
    width: "24px",
    height: "24px",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.20)",
  },
  floatingChatPanel: {
    position: "fixed",
    right: "24px",
    bottom: "86px",
    zIndex: 850,
    width: "min(440px, calc(100vw - 32px))",
    maxHeight: "72vh",
    overflow: "auto",
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "24px",
    padding: "18px",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.28)",
  },
  floatingChatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "14px",
  },
  miniChatBody: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "300px",
    overflowY: "auto",
    marginBottom: "12px",
  },
  miniChatTextarea: {
    width: "100%",
    minHeight: "96px",
    resize: "vertical",
    border: "1px solid #94A3B8",
    borderRadius: "16px",
    background: "#FFFFFF",
    padding: "13px",
    color: "#0F172A",
    fontSize: "14px",
    lineHeight: "1.6",
    outline: "none",
    boxSizing: "border-box",
  },
  reviewSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.8fr",
    gap: "18px",
  },
  priorityFixGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "14px",
  },
  priorityFixCard: {
    background: "#FFFBEB",
    border: "1px solid #FACC15",
    borderRadius: "18px",
    padding: "18px",
    minWidth: 0,
  },
  reviewAgentShell: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 12px 34px rgba(15, 23, 42, 0.06)",
  },
  reviewAgentTabs: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },
  activeReviewAgentTab: {
    border: "1px solid #2563EB",
    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
    color: "#FFFFFF",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  inactiveReviewAgentTab: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#334155",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },
  reviewAgentPanel: {
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "16px",
  },
  reviewAgentContentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },
  reviewAgentChatBox: {
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 14px 38px rgba(15, 23, 42, 0.06)",
  },
  reviewAgentChatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "16px",
  },
  reviewAgentPromptGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },
  reviewAgentPromptButton: {
    border: "1px solid #CBD5E1",
    borderRadius: "14px",
    background: "#FFFFFF",
    color: "#2563EB",
    padding: "12px 14px",
    fontSize: "13px",
    lineHeight: "1.4",
    fontWeight: 850,
    cursor: "pointer",
    textAlign: "left",
  },
  agentChatHistory: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "14px",
    maxHeight: "360px",
    overflowY: "auto",
  },
  agentChatHistoryLarge: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "16px",
    minHeight: "220px",
    maxHeight: "520px",
    overflowY: "auto",
    padding: "14px",
    border: "1px solid #CBD5E1",
    borderRadius: "20px",
    background: "#FFFFFF",
  },
  agentChatEmpty: {
    background: "#F8FAFC",
    border: "1px dashed #94A3B8",
    borderRadius: "18px",
    padding: "20px",
  },
  agentUserMessage: {
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    borderRadius: "16px",
    padding: "16px",
    marginLeft: "14%",
  },
  agentResponseMessage: {
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "16px",
    padding: "16px",
    marginRight: "14%",
  },
  agentMessageText: {
    margin: 0,
    color: "#334155",
    fontSize: "15px",
    lineHeight: "1.8",
    whiteSpace: "pre-wrap",
  },
  reviewAgentComposer: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "20px",
    padding: "16px",
  },
  reviewAgentTextarea: {
    width: "100%",
    minHeight: "180px",
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
  },
  reviewAgentActions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "12px",
    marginTop: "14px",
    flexWrap: "wrap",
  },
  composerHint: {
    margin: "12px 0 0",
    color: "#64748B",
    fontSize: "12px",
    lineHeight: "1.6",
    fontWeight: 700,
  },
  requirementUpdateBox: {
    background: "#FFFBEB",
    border: "1px solid #FACC15",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "14px",
  },
  mobileContainer: {
    padding: "18px",
    maxWidth: "100%",
  },
  mobileHeader: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: "18px",
    marginBottom: "20px",
  },
  mobileHeaderActions: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    justifyContent: "stretch",
  },
  mobileTitle: {
    fontSize: "32px",
    lineHeight: "1.12",
  },
  mobileStackRow: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: "12px",
  },
  mobileActionRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    width: "100%",
    gap: "10px",
  },
  mobileOneColumnGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "14px",
  },
  mobileTemplateGrid: {
    gridTemplateColumns: "1fr",
    gap: "12px",
  },
  mobileScoreGrid: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  sitePromptGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    marginTop: "14px",
  },
  sitePromptButton: {
    border: "1px solid #CBD5E1",
    borderRadius: "12px",
    background: "#FFFFFF",
    color: "#2563EB",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: 850,
    cursor: "pointer",
    textAlign: "left",
  },

};