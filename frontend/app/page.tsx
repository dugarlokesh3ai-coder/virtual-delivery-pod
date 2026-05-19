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

type PlatformFitOption = {
  option?: any;
  name?: any;
  module?: any;
  feature?: any;
  fit?: any;
  rationale?: any;
  pros?: any[];
  cons?: any[];
};

type TechnicalDebtItem = {
  item?: any;
  level?: any;
  impact?: any;
  mitigation?: any;
};

type PlatformFitDecision = {
  recommended_approach?: any;
  oob_options_considered?: PlatformFitOption[];
  oob_features_considered?: PlatformFitOption[];
  oob_modules_considered?: PlatformFitOption[];
  oob_fit_assessment?: any;
  custom_build_needed?: any;
  customization_required?: any[];
  customization_summary?: any[];
  technical_debt?: TechnicalDebtItem[];
  maintenance_impact?: any[];
  upgrade_impact?: any[];
  licensing_assumptions?: any[];
  pros?: any[];
  cons?: any[];
  final_recommendation?: any;
  build_readiness_verdict?: any;
};


type BuildReadinessGate = {
  verdict?: any;
  reason?: any;
  must_resolve_before_build?: any[];
  safe_to_generate_code?: any;
};

type SensitiveDataControls = {
  sensitive_data_present?: any;
  data_types?: any[];
  field_level_security?: any[];
  attachment_security?: any[];
  notification_privacy?: any[];
  audit_retention?: any[];
  encryption_or_masking?: any[];
  open_questions?: any[];
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
  platform_fit_decision?: PlatformFitDecision | null;
  oob_vs_custom_decision?: PlatformFitDecision | null;
  service_now_platform_fit?: PlatformFitDecision | null;
  build_readiness_gate?: BuildReadinessGate | null;
  sensitive_data_controls?: SensitiveDataControls | null;
  platform_object_accuracy_notes?: any[];
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

type ConsolidatedDecision = {
  decision_area?: any;
  question?: any;
  why_it_matters?: any;
  impacted_reviewers?: any[];
  recommended_default_if_unanswered?: any;
  blocks_build_readiness?: any;
};

type AgentReview = {
  overall_review_summary: string;
  architect_review: AgentReviewerFeedback;
  developer_review: AgentReviewerFeedback;
  qa_review: AgentReviewerFeedback;
  delivery_lead_review: AgentReviewerFeedback;
  consolidated_decisions_needed?: ConsolidatedDecision[];
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

type ProjectStatus = "Draft" | "Reviewed" | "Ready" | "Blocked";
type WorkspacePanel =
  | "none"
  | "templates"
  | "saved"
  | "versions"
  | "diagnostics"
  | "guide";

type AppDiagnostic = {
  id: string;
  timestamp: string;
  area: string;
  status: "success" | "warning" | "error" | "info";
  message: string;
  detail?: string;
};

type ProjectVersion = {
  id: string;
  created_at: string;
  label: string;
  requirement: string;
  clarification_answers: string;
  result: DeliveryResult | null;
  project_status: ProjectStatus;
};

const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  "Draft",
  "Reviewed",
  "Ready",
  "Blocked",
];

function emptyReviewAgentChats(): Record<
  ReviewAgentKey,
  ReviewAgentChatMessage[]
> {
  return {
    architect: [],
    developer: [],
    qa: [],
    delivery_lead: [],
  };
}

function normalizeReviewAgentChats(
  value: any,
): Record<ReviewAgentKey, ReviewAgentChatMessage[]> {
  const empty = emptyReviewAgentChats();

  if (!value || typeof value !== "object") {
    return empty;
  }

  return {
    architect: Array.isArray(value.architect) ? value.architect : [],
    developer: Array.isArray(value.developer) ? value.developer : [],
    qa: Array.isArray(value.qa) ? value.qa : [],
    delivery_lead: Array.isArray(value.delivery_lead)
      ? value.delivery_lead
      : [],
  };
}

const REVIEW_AGENT_TABS: {
  id: ReviewAgentKey;
  label: string;
  title: string;
}[] = [
  { id: "architect", label: "Architect", title: "Architect Review" },
  { id: "developer", label: "Developer", title: "Developer Review" },
  { id: "qa", label: "QA", title: "QA Review" },
  {
    id: "delivery_lead",
    label: "Delivery Lead",
    title: "Delivery Lead Review",
  },
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
  review_agent_chats?: Record<ReviewAgentKey, ReviewAgentChatMessage[]>;
  project_status?: ProjectStatus;
  versions?: ProjectVersion[];
  last_autosaved_at?: string | null;
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
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);

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

function getPlatformFitDecision(
  data: DeliveryResult | null | undefined,
): PlatformFitDecision | null {
  const raw =
    (data as any)?.platform_fit_decision ||
    (data as any)?.oob_vs_custom_decision ||
    (data as any)?.service_now_platform_fit ||
    null;

  if (!raw || typeof raw !== "object") return null;
  return raw as PlatformFitDecision;
}

function getOobOptions(decision: PlatformFitDecision | null) {
  if (!decision) return [];

  return (
    safeList(decision.oob_options_considered).length
      ? safeList(decision.oob_options_considered)
      : safeList(decision.oob_features_considered).length
        ? safeList(decision.oob_features_considered)
        : safeList(decision.oob_modules_considered)
  ) as PlatformFitOption[];
}


function getBuildReadinessGate(
  data: DeliveryResult | null | undefined,
): BuildReadinessGate | null {
  const raw = (data as any)?.build_readiness_gate || null;
  if (!raw || typeof raw !== "object") return null;
  return raw as BuildReadinessGate;
}

function getSensitiveDataControls(
  data: DeliveryResult | null | undefined,
): SensitiveDataControls | null {
  const raw = (data as any)?.sensitive_data_controls || null;
  if (!raw || typeof raw !== "object") return null;
  return raw as SensitiveDataControls;
}

function getPlatformObjectAccuracyNotes(
  data: DeliveryResult | null | undefined,
): any[] {
  return safeList((data as any)?.platform_object_accuracy_notes);
}

function isBuildBlockedByGate(data: DeliveryResult | null | undefined) {
  const gate = getBuildReadinessGate(data);
  if (!gate) return false;

  const verdict = safeText(gate.verdict).toLowerCase();
  const safeToGenerateCode = gate.safe_to_generate_code;

  return (
    (verdict.includes("needs discovery") || verdict.includes("not ready")) &&
    safeToGenerateCode === false
  );
}

function buildReadinessGateMarkdown(data: DeliveryResult | null | undefined) {
  const gate = getBuildReadinessGate(data);

  if (!gate) {
    return `## Build Readiness Gate\n\nNo build-readiness gate was returned by the backend.`;
  }

  return `## Build Readiness Gate\n\n**Verdict:** ${safeText(gate.verdict) || "Not provided"}\n\n**Safe to Generate Code:** ${safeText(gate.safe_to_generate_code) || "Not provided"}\n\n### Reason\n${safeText(gate.reason) || "Not provided"}\n\n### Must Resolve Before Build\n${safeList(gate.must_resolve_before_build)
    .map((item) => `- ${safeText(item)}`)
    .join("\n") || "- Not provided"}`;
}

function sensitiveDataControlsMarkdown(data: DeliveryResult | null | undefined) {
  const controls = getSensitiveDataControls(data);

  if (!controls) {
    return `## Sensitive Data Controls\n\nNo sensitive-data controls were returned by the backend.`;
  }

  return `## Sensitive Data Controls\n\n**Sensitive Data Present:** ${safeText(controls.sensitive_data_present) || "Not provided"}\n\n### Data Types\n${safeList(controls.data_types)
    .map((item) => `- ${safeText(item)}`)
    .join("\n") || "- Not provided"}\n\n### Field-Level Security\n${safeList(controls.field_level_security)
    .map((item) => `- ${safeText(item)}`)
    .join("\n") || "- Not provided"}\n\n### Attachment Security\n${safeList(controls.attachment_security)
    .map((item) => `- ${safeText(item)}`)
    .join("\n") || "- Not provided"}\n\n### Notification Privacy\n${safeList(controls.notification_privacy)
    .map((item) => `- ${safeText(item)}`)
    .join("\n") || "- Not provided"}\n\n### Audit / Retention\n${safeList(controls.audit_retention)
    .map((item) => `- ${safeText(item)}`)
    .join("\n") || "- Not provided"}\n\n### Encryption / Masking\n${safeList(controls.encryption_or_masking)
    .map((item) => `- ${safeText(item)}`)
    .join("\n") || "- Not provided"}\n\n### Open Questions\n${safeList(controls.open_questions)
    .map((item) => `- ${safeText(item)}`)
    .join("\n") || "- Not provided"}`;
}

function platformObjectAccuracyMarkdown(data: DeliveryResult | null | undefined) {
  const notes = getPlatformObjectAccuracyNotes(data);

  return `## Platform Object Accuracy Notes\n\n${notes.length ? notes.map((item) => `- ${safeText(item)}`).join("\n") : "- Not provided"}`;
}



function getConsolidatedDecisions(
  review: AgentReview | null | undefined,
): ConsolidatedDecision[] {
  return safeList((review as any)?.consolidated_decisions_needed) as ConsolidatedDecision[];
}

function buildConsolidatedDecisionsMarkdown(
  review: AgentReview | null | undefined,
) {
  const decisions = getConsolidatedDecisions(review);

  if (!decisions.length) {
    return `## Business Decisions Needed\n\nNo consolidated business decisions were returned by the review board.`;
  }

  return `## Business Decisions Needed\n\n${decisions
    .map((decision, index) => {
      const reviewers = safeList(decision.impacted_reviewers)
        .map((item) => safeText(item))
        .filter(Boolean)
        .join(", ");

      return `### ${index + 1}. ${safeText(decision.decision_area) || "Business Decision"}\n\n**Question:** ${safeText(decision.question) || "Not provided"}\n\n**Why it matters:** ${safeText(decision.why_it_matters) || "Not provided"}\n\n**Impacted reviewers:** ${reviewers || "Not provided"}\n\n**Default if unanswered:** ${safeText(decision.recommended_default_if_unanswered) || "Treat as unresolved."}\n\n**Blocks build readiness:** ${safeText(decision.blocks_build_readiness) || "Not provided"}`;
    })
    .join("\n\n")}`;
}

function buildPlatformFitMarkdown(data: DeliveryResult | null | undefined) {
  const decision = getPlatformFitDecision(data);

  if (!decision) {
    return `## ServiceNow Platform Fit / OOB vs Custom Decision\n\nNo platform-fit decision was returned by the backend. Update the architect prompt/backend response to include platform_fit_decision.`;
  }

  const oobOptions = getOobOptions(decision);

  return `## ServiceNow Platform Fit / OOB vs Custom Decision\n\n### Recommended Approach\n${safeText(decision.recommended_approach) || "Not specified"}\n\n### OOB Features / Modules Considered\n${
    oobOptions.length
      ? oobOptions
          .map(
            (option) =>
              `- **${safeText(option.option || option.name || option.module || option.feature) || "Option"}** — ${safeText(option.fit) || "Fit not stated"}: ${safeText(option.rationale)}`,
          )
          .join("\n")
      : "- Not provided"
  }\n\n### OOB Fit Assessment\n${safeText(decision.oob_fit_assessment) || "Not provided"}\n\n### Custom Build Needed\n${safeText(decision.custom_build_needed) || "Not specified"}\n\n### Customization Required\n${safeList(decision.customization_required || decision.customization_summary)
  .map((item) => `- ${safeText(item)}`)
  .join("\n") || "- Not provided"}\n\n### Technical Debt / Maintenance Impact\n${
    safeList(decision.technical_debt).length
      ? safeList(decision.technical_debt)
          .map(
            (item: TechnicalDebtItem) =>
              `- **${safeText(item.item) || "Technical debt item"}** (${safeText(item.level) || "Level not stated"}): ${safeText(item.impact)} Mitigation: ${safeText(item.mitigation)}`,
          )
          .join("\n")
      : safeList(decision.maintenance_impact)
          .map((item) => `- ${safeText(item)}`)
          .join("\n") || "- Not provided"
  }\n\n### Upgrade Impact\n${safeList(decision.upgrade_impact)
  .map((item) => `- ${safeText(item)}`)
  .join("\n") || "- Not provided"}\n\n### Licensing Assumptions\n${safeList(decision.licensing_assumptions)
  .map((item) => `- ${safeText(item)}`)
  .join("\n") || "- Not provided"}\n\n### Pros\n${safeList(decision.pros)
  .map((item) => `- ${safeText(item)}`)
  .join("\n") || "- Not provided"}\n\n### Cons\n${safeList(decision.cons)
  .map((item) => `- ${safeText(item)}`)
  .join("\n") || "- Not provided"}\n\n### Final Recommendation\n${safeText(decision.final_recommendation) || "Not provided"}`;
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
  const packageContentRef = useRef<HTMLDivElement | null>(null);
  const [packageChromeExpanded, setPackageChromeExpanded] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loadingStage, setLoadingStage] = useState("");

  const [intakeAnalysis, setIntakeAnalysis] = useState<IntakeAnalysis | null>(
    null,
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [clarificationAnswers, setClarificationAnswers] = useState("");

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [selectedCodeTitle, setSelectedCodeTitle] = useState("");
  const [selectedCode, setSelectedCode] = useState("");

  const [regenerateInstruction, setRegenerateInstruction] = useState("");
  const [regeneratingSection, setRegeneratingSection] = useState("");

  const [deliveryLeadMessage, setDeliveryLeadMessage] = useState("");
  const [deliveryLeadChat, setDeliveryLeadChat] = useState<
    DeliveryLeadChatMessage[]
  >([]);
  const [deliveryLeadThinking, setDeliveryLeadThinking] = useState(false);
  const [
    deliveryLeadPendingRequirementUpdate,
    setDeliveryLeadPendingRequirementUpdate,
  ] = useState("");
  const [activeGenerationMode, setActiveGenerationMode] = useState<
    "quick" | "full" | null
  >(null);
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);
  const [siteAssistantMessage, setSiteAssistantMessage] = useState("");
  const [siteAssistantChat, setSiteAssistantChat] = useState<
    SiteAssistantMessage[]
  >([]);
  const [siteAssistantThinking, setSiteAssistantThinking] = useState(false);
  const [activeReviewAgent, setActiveReviewAgent] =
    useState<ReviewAgentKey>("architect");
  const [reviewAgentMessage, setReviewAgentMessage] = useState("");
  const [reviewAgentThinking, setReviewAgentThinking] = useState(false);
  const [reviewAgentChats, setReviewAgentChats] = useState<
    Record<ReviewAgentKey, ReviewAgentChatMessage[]>
  >(emptyReviewAgentChats());
  const [
    reviewAgentPendingRequirementUpdate,
    setReviewAgentPendingRequirementUpdate,
  ] = useState("");

  const [projectName, setProjectName] = useState("");
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [workspacePanel, setWorkspacePanel] = useState<WorkspacePanel>("none");
  const showTemplates = workspacePanel === "templates";
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("Draft");
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([]);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const [autoSaveState, setAutoSaveState] = useState("Auto-save idle");
  const [packageNeedsRegeneration, setPackageNeedsRegeneration] =
    useState(false);
  const [compareVersionId, setCompareVersionId] = useState("");
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [showOnboardingTips, setShowOnboardingTips] = useState(false);
  const showSavedProjectsPanel = workspacePanel === "saved";
  const showVersionHistoryPanel = workspacePanel === "versions";
  const showDiagnosticsPanel = workspacePanel === "diagnostics";
  const [diagnostics, setDiagnostics] = useState<AppDiagnostic[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

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

  function clearLocalSupabaseAuthStorage() {
    if (typeof window === "undefined") return;

    const clearStorage = (storage: Storage) => {
      const keysToRemove: string[] = [];

      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);

        if (
          key &&
          key.startsWith("sb-") &&
          (key.includes("auth") || key.includes("token") || key.includes("code-verifier"))
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => storage.removeItem(key));
    };

    clearStorage(window.localStorage);
    clearStorage(window.sessionStorage);
  }

  async function signOut() {
    if (authLoading) return;

    setAuthLoading(true);

    // Clear UI immediately. Supabase sign-out can occasionally hang in browser
    // storage/session cleanup, so do not let the button stay stuck on
    // "Signing out...".
    setUser(null);
    setAuthEmail("");
    setAuthPassword("");
    setSavedProjects([]);
    clearWorkspace();
    clearLocalSupabaseAuthStorage();
    setAuthLoading(false);

    addDiagnostic({
      area: "Authentication",
      status: "success",
      message: "Signed out locally.",
    });

    try {
      const { error } = await withDbTimeout(
        supabase.auth.signOut({ scope: "local" }),
        "Supabase sign out",
        3000,
      );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.warn("Remote Supabase sign out did not confirm", error);
      addDiagnostic({
        area: "Authentication",
        status: "warning",
        message: "Local sign out completed, but Supabase did not confirm remote sign out.",
        detail: getErrorMessage(error),
      });
    }
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
      addDiagnostic({
        area: "Saved projects",
        status: "error",
        message: "Unable to load saved projects.",
        detail: error.message,
      });
      alert(
        "Unable to load saved projects. Open System Diagnostics for details.",
      );
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
      review_agent_chats: normalizeReviewAgentChats(project.review_agent_chats),
      project_status: project.project_status || "Draft",
      versions: project.versions || [],
      last_autosaved_at: project.last_autosaved_at || null,
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
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const seen = window.localStorage.getItem(
      "virtual_delivery_pod_seen_onboarding",
    );
    setShowOnboardingTips(!seen);
  }, []);

  function dismissOnboardingTips() {
    window.localStorage.setItem("virtual_delivery_pod_seen_onboarding", "true");
    setShowOnboardingTips(false);
  }

  function openWorkspacePanel(panel: WorkspacePanel) {
    if (panel === "guide") {
      setShowOnboardingTips(true);
      setWorkspacePanel("none");
      return;
    }

    setWorkspacePanel(panel);
    setShowComparePanel(false);
  }

  function selectPackageTab(tab: PackageTab) {
    setPackageTab(tab);

    window.setTimeout(() => {
      packageContentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function getWorkspacePanelLabel(panel: WorkspacePanel) {
    if (panel === "templates") return "Templates";
    if (panel === "saved") return `Saved Projects (${savedProjects.length})`;
    if (panel === "versions")
      return `Version History (${projectVersions.length})`;
    if (panel === "diagnostics") return `Diagnostics (${diagnostics.length})`;
    if (panel === "guide") return "Guide";
    return "Workspace menu";
  }

  function getErrorMessage(error: any) {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    if (error.message) return String(error.message);

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  function addDiagnostic(event: Omit<AppDiagnostic, "id" | "timestamp">) {
    const nextEvent: AppDiagnostic = {
      ...event,
      id: createProjectId(),
      timestamp: new Date().toISOString(),
    };

    setDiagnostics((previous) => [nextEvent, ...previous].slice(0, 12));
  }

  function clearDiagnostics() {
    setDiagnostics([]);
    setShowDiagnostics(false);
  }

  useEffect(() => {
    if (!user) return;

    const timer = window.setInterval(() => {
      persistProjectDraft({ autosave: true });
    }, 45000);

    return () => window.clearInterval(timer);
  }, [
    user?.id,
    activeProjectId,
    projectName,
    requirement,
    clarificationAnswers,
    result,
    deliveryLeadChat,
    reviewAgentChats,
    projectStatus,
    projectVersions,
    loading,
    analyzing,
    projectSaving,
  ]);

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
      addDiagnostic({
        area: "Requirement analysis",
        status: "error",
        message: "Analyze Requirement failed.",
        detail: getErrorMessage(error),
      });
      alert("Analyze failed. Open System Diagnostics for details.");
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

  function buildProjectVersion(label: string): ProjectVersion {
    return {
      id: createProjectId(),
      created_at: new Date().toISOString(),
      label,
      requirement,
      clarification_answers: clarificationAnswers,
      result: result || null,
      project_status: projectStatus,
    };
  }

  function buildVersionFromSavedProject(
    project: SavedProject,
    label: string,
  ): ProjectVersion {
    return {
      id: createProjectId(),
      created_at: new Date().toISOString(),
      label,
      requirement: project.requirement || "",
      clarification_answers: project.clarification_answers || "",
      result: project.result || null,
      project_status: project.project_status || "Draft",
    };
  }

  function getUpdatedVersions(label: string) {
    const nextVersion = buildProjectVersion(label);
    return [nextVersion, ...projectVersions].slice(0, 15);
  }

  function mergeRequirementUpdate(currentText: string, updateText: string) {
    const current = currentText.trim();
    let update = updateText.trim();

    if (!update) return currentText;
    if (!current) return update;

    update = update
      .replace(/^add the following clause to the requirement:\s*/i, "")
      .replace(/^add following clause to the requirement:\s*/i, "")
      .replace(/^update the requirement to include:\s*/i, "")
      .replace(/^suggested requirement update:\s*/i, "")
      .trim();

    update = update.replace(/^[“"]|[”"]$/g, "").trim();

    if (!update) return currentText;
    if (current.toLowerCase().includes(update.toLowerCase()))
      return currentText;

    return `${current}

Additional clarification / requirement update:
${update}`;
  }

  function countReviewAgentMessages(
    chats: Record<ReviewAgentKey, ReviewAgentChatMessage[]> = reviewAgentChats,
  ) {
    return Object.values(chats).reduce(
      (total, messages) => total + messages.length,
      0,
    );
  }

  function buildProjectPayload(
    resolvedProjectName: string,
    options?: {
      includeVersion?: boolean;
      versionLabel?: string;
      autosave?: boolean;
    },
  ) {
    const nextVersions = options?.includeVersion
      ? getUpdatedVersions(options.versionLabel || "Manual save")
      : projectVersions;

    return {
      project_name: resolvedProjectName,
      requirement,
      clarification_answers: clarificationAnswers,
      uploaded_file_names: files.map((file) => file.name),
      result: result || null,
      delivery_lead_chat: deliveryLeadChat || [],
      review_agent_chats: reviewAgentChats || emptyReviewAgentChats(),
      project_status: projectStatus,
      versions: nextVersions,
      last_autosaved_at: options?.autosave
        ? new Date().toISOString()
        : lastAutoSavedAt,
      updated_at: new Date().toISOString(),
    };
  }

  function mapDbProject(savedRecord: any): SavedProject {
    return {
      id: savedRecord.id,
      project_name: savedRecord.project_name,
      created_at: savedRecord.created_at,
      updated_at: savedRecord.updated_at,
      requirement: savedRecord.requirement || "",
      clarification_answers: savedRecord.clarification_answers || "",
      uploaded_file_names: savedRecord.uploaded_file_names || [],
      result: savedRecord.result || null,
      delivery_lead_chat: savedRecord.delivery_lead_chat || [],
      review_agent_chats: normalizeReviewAgentChats(
        savedRecord.review_agent_chats,
      ),
      project_status: savedRecord.project_status || "Draft",
      versions: savedRecord.versions || [],
      last_autosaved_at: savedRecord.last_autosaved_at || null,
    };
  }

  async function withDbTimeout<T>(
    operation: PromiseLike<T>,
    label: string,
    timeoutMs = 20000,
  ): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs / 1000}s.`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async function persistProjectDraft({
    autosave = false,
  }: { autosave?: boolean } = {}) {
    if (!user || projectSaving || loading || analyzing) return null;

    const hasWorkspaceContent =
      !!projectName.trim() ||
      !!requirement.trim() ||
      !!clarificationAnswers.trim() ||
      !!result ||
      deliveryLeadChat.length > 0 ||
      countReviewAgentMessages() > 0;

    if (!hasWorkspaceContent) return null;

    const resolvedProjectName = projectName.trim() || buildDefaultProjectName();
    const payload: any = buildProjectPayload(resolvedProjectName, {
      autosave,
      includeVersion: false,
    });

    // Auto-save should preserve version history. Do not let a stale client-side
    // projectVersions array overwrite database snapshots.
    if (activeProjectId) {
      delete payload.versions;
    }

    try {
      if (activeProjectId) {
        const { data, error } = await supabase
          .from("delivery_projects")
          .update(payload)
          .eq("id", activeProjectId)
          .eq("user_id", user.id)
          .select("*")
          .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const mapped = mapDbProject(data);
        setSavedProjects((previousProjects) =>
          previousProjects.map((project) =>
            project.id === mapped.id ? mapped : project,
          ),
        );
        setLastAutoSavedAt(mapped.last_autosaved_at || null);
        if (autosave) setAutoSaveState("Auto-saved");
        return mapped;
      }

      const { data, error } = await supabase
        .from("delivery_projects")
        .insert({
          ...payload,
          user_id: user.id,
        })
        .select("*")
        .single();

      if (error) throw error;

      const mapped = mapDbProject(data);
      setActiveProjectId(mapped.id);
      setProjectName(mapped.project_name);
      setSavedProjects((previousProjects) => [mapped, ...previousProjects]);
      setLastAutoSavedAt(mapped.last_autosaved_at || null);
      if (autosave) setAutoSaveState("Auto-saved");
      return mapped;
    } catch (error) {
      console.error("Auto-save failed", error);
      if (autosave) {
        setAutoSaveState(
          "Auto-save failed. Run the database migration and retry.",
        );
      }
      return null;
    }
  }

  function getSelectedCompareVersion() {
    return (
      projectVersions.find((version) => version.id === compareVersionId) || null
    );
  }

  function buildPackageComparison(version: ProjectVersion | null) {
    if (!version || !result) return [];

    const previous = version.result;

    return [
      {
        label: "Requirement length",
        previous: `${version.requirement?.length || 0} characters`,
        current: `${requirement.length} characters`,
      },
      {
        label: "Package mode",
        previous: previous?.generation_mode || "No package",
        current: result.generation_mode || "Unknown",
      },
      {
        label: "Score",
        previous: scoreText(previous?.quality_score?.overall_score),
        current: scoreText(result.quality_score?.overall_score),
      },
      {
        label: "Stories",
        previous: String(previous?.stories?.length || 0),
        current: String(result.stories?.length || 0),
      },
      {
        label: "Open questions",
        previous: String(previous?.open_questions?.length || 0),
        current: String(result.open_questions?.length || 0),
      },
      {
        label: "Tech objects",
        previous: String(previous?.developer?.service_now_objects?.length || 0),
        current: String(result.developer?.service_now_objects?.length || 0),
      },
      {
        label: "Test cases",
        previous: String(previous?.qa?.test_cases?.length || 0),
        current: String(result.qa?.test_cases?.length || 0),
      },
    ];
  }

  async function saveProject() {
    if (!user) {
      alert("Sign in before saving projects.");
      return;
    }

    if (projectSaving) return;

    const resolvedProjectName = projectName.trim() || buildDefaultProjectName();
    const wasUpdating = !!activeProjectId;

    setProjectSaving(true);
    setAutoSaveState(wasUpdating ? "Updating project..." : "Saving project...");

    try {
      let savedRecord: any = null;

      if (activeProjectId) {
        const { data: existingRecord, error: existingError } =
          await withDbTimeout(
            supabase
              .from("delivery_projects")
              .select("*")
              .eq("id", activeProjectId)
              .eq("user_id", user.id)
              .maybeSingle(),
            "Read existing project",
          );

        if (existingError) {
          throw new Error(
            `Unable to read existing project before update: ${existingError.message}`,
          );
        }

        if (!existingRecord) {
          const createNewCopy = window.confirm(
            "This saved project could not be found for your account. Create a new saved copy instead?",
          );

          if (!createNewCopy) {
            setActiveProjectId(null);
            loadSavedProjectsFromDb(user.id).catch((error) =>
              console.error("Refresh saved projects failed", error),
            );
            return;
          }

          const insertPayload = buildProjectPayload(resolvedProjectName, {
            includeVersion: true,
            versionLabel: "Initial project save",
          });

          const { data: insertedData, error: insertError } =
            await withDbTimeout(
              supabase
                .from("delivery_projects")
                .insert({
                  ...insertPayload,
                  user_id: user.id,
                })
                .select("*")
                .single(),
              "Create new saved project copy",
            );

          if (insertError) {
            throw new Error(
              `Unable to save new project copy: ${insertError.message}`,
            );
          }

          savedRecord = insertedData;
        } else {
          const existingProject = mapDbProject(existingRecord);
          const existingVersions = Array.isArray(existingProject.versions)
            ? existingProject.versions
            : [];

          const previousSnapshot = buildVersionFromSavedProject(
            existingProject,
            `Before update · ${new Date().toLocaleString()}`,
          );

          const updatePayload = buildProjectPayload(resolvedProjectName, {
            includeVersion: false,
          });

          updatePayload.versions = [
            previousSnapshot,
            ...existingVersions,
          ].slice(0, 15);
          updatePayload.last_autosaved_at = lastAutoSavedAt;

          const { data, error } = await withDbTimeout(
            supabase
              .from("delivery_projects")
              .update(updatePayload)
              .eq("id", activeProjectId)
              .eq("user_id", user.id)
              .select("*")
              .maybeSingle(),
            "Update project",
          );

          if (error) {
            throw new Error(`Unable to update project: ${error.message}`);
          }

          if (!data) {
            throw new Error("Update finished but no project row was returned.");
          }

          savedRecord = data;
        }
      } else {
        const insertPayload = buildProjectPayload(resolvedProjectName, {
          includeVersion: true,
          versionLabel: "Initial project save",
        });

        const { data, error } = await withDbTimeout(
          supabase
            .from("delivery_projects")
            .insert({
              ...insertPayload,
              user_id: user.id,
            })
            .select("*")
            .single(),
          "Save new project",
        );

        if (error) {
          throw new Error(`Unable to save project: ${error.message}`);
        }

        savedRecord = data;
      }

      if (!savedRecord) {
        throw new Error(
          "Project was not saved. No database record was returned.",
        );
      }

      const savedProject: SavedProject = mapDbProject(savedRecord);

      setActiveProjectId(savedProject.id);
      setProjectName(savedProject.project_name);
      setProjectStatus(savedProject.project_status || "Draft");
      setProjectVersions(savedProject.versions || []);
      setLastAutoSavedAt(savedProject.last_autosaved_at || null);

      setSavedProjects((previousProjects) => {
        const existingIndex = previousProjects.findIndex(
          (project) => project.id === savedProject.id,
        );

        if (existingIndex >= 0) {
          return previousProjects.map((project) =>
            project.id === savedProject.id ? savedProject : project,
          );
        }

        return [savedProject, ...previousProjects];
      });

      setAutoSaveState(wasUpdating ? "Project updated" : "Project saved");
      addDiagnostic({
        area: "Project save",
        status: "success",
        message: wasUpdating
          ? "Project updated and previous state snapshotted."
          : "Project saved successfully.",
      });

      loadSavedProjectsFromDb(user.id).catch((error) =>
        console.error("Refresh saved projects failed", error),
      );

      window.setTimeout(() => {
        setAutoSaveState("Auto-save idle");
      }, 3000);
    } catch (error: any) {
      console.error("Project save/update failed", error);
      setAutoSaveState("Save failed");
      addDiagnostic({
        area: "Project save",
        status: "error",
        message: "Project save/update failed.",
        detail: getErrorMessage(error),
      });
      alert(
        error?.message ||
          "Project save/update failed. Open System Diagnostics for details.",
      );
    } finally {
      setProjectSaving(false);
    }
  }

  function loadProject(project: SavedProject) {
    setProjectName(project.project_name);
    setRequirement(project.requirement || "");
    setClarificationAnswers(project.clarification_answers || "");
    setResult(project.result);
    clearUploadedFiles();
    setIntakeAnalysis(null);
    setActiveProjectId(project.id);
    setActiveTab("stories");
    setPackageTab("overview");
    setRegenerateInstruction("");
    setDeliveryLeadChat(project.delivery_lead_chat || []);
    setReviewAgentChats(normalizeReviewAgentChats(project.review_agent_chats));
    setProjectStatus(project.project_status || "Draft");
    setProjectVersions(project.versions || []);
    setLastAutoSavedAt(project.last_autosaved_at || null);
    setAutoSaveState(
      project.last_autosaved_at ? "Loaded saved autosave" : "Auto-save idle",
    );
    setPackageNeedsRegeneration(false);
    setCompareVersionId("");
    setShowComparePanel(false);
    setDeliveryLeadPendingRequirementUpdate("");
  }

  function clearUploadedFiles() {
    setFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearWorkspace() {
    setActiveProjectId(null);
    setProjectName("");

    setRequirement("");
    setClarificationAnswers("");
    clearUploadedFiles();

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
    setReviewAgentChats(emptyReviewAgentChats());
    setReviewAgentPendingRequirementUpdate("");
    setProjectSaving(false);
    setProjectStatus("Draft");
    setProjectVersions([]);
    setLastAutoSavedAt(null);
    setAutoSaveState("Auto-save idle");
    setPackageNeedsRegeneration(false);
    setCompareVersionId("");
    setShowComparePanel(false);
    setWorkspacePanel("none");
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
        "Start a new project? Unsaved changes in the current workspace will be cleared.",
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
        "Apply this template? It will replace the current requirement text and clear current analysis/output.",
      );

      if (!confirmed) return;
    }

    setProjectName(template.name);
    setProjectStatus("Draft");
    setProjectVersions([]);
    setLastAutoSavedAt(null);
    setPackageNeedsRegeneration(false);
    setCompareVersionId("");
    setShowComparePanel(false);
    setRequirement(template.requirement);
    setClarificationAnswers("");
    clearUploadedFiles();
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
    setReviewAgentChats(emptyReviewAgentChats());
    setReviewAgentPendingRequirementUpdate("");
    setWorkspacePanel("none");
  }

  async function generatePackage(
    mode: "quick" | "full" = "full",
    options?: { suppressAlert?: boolean },
  ) {
    if (!requirement.trim() && files.length === 0) {
      alert("Paste a business process or upload a document first.");
      return;
    }

    setLoading(true);
    setActiveGenerationMode(mode);
    setLoadingStage(
      mode === "quick"
        ? "Generating quick delivery package..."
        : "Reading requirement and uploaded documents...",
    );

    const startedAt = Date.now();

    const stageTimers =
      mode === "quick"
        ? [
            setTimeout(
              () =>
                setLoadingStage(
                  "Architect is creating quick solution design...",
                ),
              900,
            ),
            setTimeout(
              () => setLoadingStage("BSA is creating core stories..."),
              2400,
            ),
            setTimeout(
              () =>
                setLoadingStage("Delivery Lead is assembling quick package..."),
              4200,
            ),
          ]
        : [
            setTimeout(
              () => setLoadingStage("Architect is creating solution design..."),
              900,
            ),
            setTimeout(
              () =>
                setLoadingStage(
                  "BSA is writing stories and acceptance criteria...",
                ),
              2600,
            ),
            setTimeout(
              () =>
                setLoadingStage("Developer is preparing technical notes..."),
              5200,
            ),
            setTimeout(
              () =>
                setLoadingStage(
                  "QA is building test cases and UAT scenarios...",
                ),
              7800,
            ),
            setTimeout(
              () =>
                setLoadingStage("Delivery Lead is assembling final package..."),
              10400,
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
        const errorText = await response.text();
        console.error(
          "Package generation failed response:",
          response.status,
          errorText,
        );
        addDiagnostic({
          area: `${mode === "quick" ? "Quick" : "Full"} package generation`,
          status: "error",
          message: `Backend returned ${response.status} for /generate.`,
          detail: errorText.slice(0, 2000),
        });
        throw new Error(
          `Backend request failed: ${response.status} ${errorText}`,
        );
      }

      const data = await response.json();
      setResult(data);
      setProjectStatus("Draft");
      setPackageNeedsRegeneration(false);
      setActiveTab("stories");
      setPackageTab(mode === "quick" ? "design" : "overview");
      addDiagnostic({
        area: `${mode === "quick" ? "Quick" : "Full"} package generation`,
        status: "success",
        message: `${mode === "quick" ? "Quick" : "Full"} package generated in ${Math.round((Date.now() - startedAt) / 1000)}s.`,
      });
      return true;
    } catch (error) {
      console.error(error);
      addDiagnostic({
        area: `${mode === "quick" ? "Quick" : "Full"} package generation`,
        status: "error",
        message: "Package generation failed.",
        detail: getErrorMessage(error),
      });
      if (!options?.suppressAlert) {
        alert(
          "Package generation failed. Open System Diagnostics and Render/backend logs for details.",
        );
      }
      return false;
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
        900,
      ),
      setTimeout(
        () => setLoadingStage("Creating process/state flow diagram..."),
        2200,
      ),
      setTimeout(
        () => setLoadingStage("QA is building test cases and UAT scenarios..."),
        4200,
      ),
      setTimeout(
        () => setLoadingStage("Quality gate is scoring the full package..."),
        6800,
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
      setProjectStatus("Draft");
      setPackageNeedsRegeneration(false);
      setPackageTab("overview");
    } catch (error) {
      console.error(error);
      addDiagnostic({
        area: "Upgrade package",
        status: "error",
        message: "Upgrade to full package failed.",
        detail: getErrorMessage(error),
      });
      alert("Upgrade failed. Open System Diagnostics and backend logs.");
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
        900,
      ),
      setTimeout(
        () =>
          setLoadingStage("Developer is reviewing implementation detail..."),
        2400,
      ),
      setTimeout(
        () => setLoadingStage("QA is reviewing test coverage..."),
        4200,
      ),
      setTimeout(
        () =>
          setLoadingStage("Delivery Lead is reviewing delivery readiness..."),
        6200,
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
        console.error(
          "Agent review failed response:",
          response.status,
          errorText,
        );
        throw new Error(`Agent review failed: ${response.status}`);
      }

      const review = await response.json();

      setResult({
        ...result,
        agent_review: review,
      });
      setProjectStatus("Reviewed");

      setPackageTab("review");
    } catch (error) {
      console.error(error);
      addDiagnostic({
        area: "Agent review",
        status: "error",
        message: "Agent review failed.",
        detail: getErrorMessage(error),
      });
      alert("Agent review failed. Open System Diagnostics and backend logs.");
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

    const uploadAnswer = `You can paste rough notes directly or upload supporting documents. You can attach multiple files at once. Supported uploads include .txt, .pdf, .docx, .pptx, .ppt, and common image files such as .png, .jpg, .jpeg, .webp, .gif, .bmp, .tif, and .tiff. Image-based PDFs and images require the backend OCR/document reader configuration.`;

    if (
      normalizedQuestion.includes("quick") ||
      normalizedQuestion.includes("full") ||
      normalizedQuestion.includes("generation")
    ) {
      return quickFullAnswer;
    }

    if (
      normalizedQuestion.includes("template") ||
      normalizedQuestion.includes("example")
    ) {
      return templateAnswer;
    }

    if (
      normalizedQuestion.includes("save") ||
      normalizedQuestion.includes("reload") ||
      normalizedQuestion.includes("project") ||
      normalizedQuestion.includes("database")
    ) {
      return saveAnswer;
    }

    if (
      normalizedQuestion.includes("export") ||
      normalizedQuestion.includes("docx") ||
      normalizedQuestion.includes("markdown") ||
      normalizedQuestion.includes("download")
    ) {
      return exportAnswer;
    }

    if (
      normalizedQuestion.includes("technical") ||
      normalizedQuestion.includes("code") ||
      normalizedQuestion.includes("business rule") ||
      normalizedQuestion.includes("flow") ||
      normalizedQuestion.includes("acl")
    ) {
      return technicalAnswer;
    }

    if (
      normalizedQuestion.includes("delivery lead") ||
      normalizedQuestion.includes("requirement update") ||
      normalizedQuestion.includes("missing") ||
      normalizedQuestion.includes("scope") ||
      normalizedQuestion.includes("risk")
    ) {
      return deliveryLeadAnswer;
    }

    if (
      normalizedQuestion.includes("review") ||
      normalizedQuestion.includes("score") ||
      normalizedQuestion.includes("quality")
    ) {
      return reviewAnswer;
    }

    if (
      normalizedQuestion.includes("upload") ||
      normalizedQuestion.includes("document") ||
      normalizedQuestion.includes("pdf") ||
      normalizedQuestion.includes("docx") ||
      normalizedQuestion.includes("file")
    ) {
      return uploadAnswer;
    }

    if (
      normalizedQuestion.includes("how") ||
      normalizedQuestion.includes("use") ||
      normalizedQuestion.includes("start") ||
      normalizedQuestion.includes("help")
    ) {
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

  function getReviewFeedback(
    agent: ReviewAgentKey,
  ): AgentReviewerFeedback | null {
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
      alert(
        `Ask the ${getReviewAgentLabel(activeReviewAgent)} a question first.`,
      );
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
      const answer = safeText(
        rawData.answer || rawData.delivery_lead_recommendation,
      );

      const normalizedSuggestedUpdate = safeText(
        rawData.suggested_requirement_update,
      );
      if (normalizedSuggestedUpdate.trim()) {
        setReviewAgentPendingRequirementUpdate(normalizedSuggestedUpdate);
      }

      const finalReviewAgentChats = {
        ...reviewAgentChats,
        [activeReviewAgent]: [
          ...nextAgentChat,
          {
            role: "agent" as const,
            content:
              answer ||
              `${agentLabel} reviewed this, but no detailed answer was returned. Try asking for a specific requirement change, risk, or implementation recommendation.`,
          },
        ],
      };

      setReviewAgentChats(finalReviewAgentChats);

      if (activeProjectId && user?.id) {
        await supabase
          .from("delivery_projects")
          .update({
            review_agent_chats: finalReviewAgentChats,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeProjectId)
          .eq("user_id", user.id);
      }
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
      `Append this ${getReviewAgentLabel(activeReviewAgent)} update to the main requirement box?`,
    );

    if (!confirmed) return;

    setRequirement((currentText) =>
      mergeRequirementUpdate(currentText, updateText),
    );
    setClarificationAnswers("");
    setIntakeAnalysis(null);
    setReviewAgentPendingRequirementUpdate("");
    setPackageNeedsRegeneration(true);
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
          rawData.delivery_lead_recommendation,
        ),
        artifact_type: safeText(rawData.artifact_type),
        suggested_requirement_update: safeText(
          rawData.suggested_requirement_update,
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
          normalizedData.suggested_requirement_update,
        );
      }

      const finalDeliveryLeadChat = [
        ...nextChat,
        {
          role: "delivery_lead" as const,
          content: normalizedData.answer,
          response: normalizedData,
        },
      ];

      setDeliveryLeadChat(finalDeliveryLeadChat);

      if (activeProjectId && user?.id) {
        await supabase
          .from("delivery_projects")
          .update({
            delivery_lead_chat: finalDeliveryLeadChat,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeProjectId)
          .eq("user_id", user.id);
      }
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
      "Append this Delivery Lead update to the main requirement box?",
    );

    if (!confirmed) return;

    setRequirement((currentText) =>
      mergeRequirementUpdate(currentText, updateText),
    );
    setClarificationAnswers("");
    setIntakeAnalysis(null);
    setDeliveryLeadPendingRequirementUpdate("");
    setPackageNeedsRegeneration(true);
    setPackageTab("design");
  }

  async function regeneratePackageAfterRequirementUpdate() {
    if (!requirement.trim()) {
      alert("Add requirement text before regenerating.");
      return;
    }

    const mode = result?.generation_mode === "quick" ? "quick" : "full";
    const success = await generatePackage(mode, { suppressAlert: true });

    if (success) return;

    if (mode === "full") {
      const retryQuick = window.confirm(
        "Full package regeneration failed. Generate a Quick Package from the updated requirement instead?",
      );

      if (retryQuick) {
        await generatePackage("quick");
        return;
      }
    }

    addDiagnostic({
      area: "Regenerate package",
      status: "error",
      message: "Regeneration failed after requirement update.",
      detail: `Attempted ${mode} regeneration from updated requirement.`,
    });
    alert(
      "Regeneration failed. Open System Diagnostics and Render/backend logs for details.",
    );
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
      `- **Gap:** ${item.gap}\n  - **Why it matters:** ${item.why_it_matters}`,
  )
  .join("\n")}

### Assumptions
${data.delivery_lead_review?.assumptions?.map((item) => `- ${item}`).join("\n")}

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

${data.agent_review ? `## Agent Review Board\n\n### Overall Review Summary\n${data.agent_review.overall_review_summary || ""}\n\n### Final Verdict\n${data.agent_review.final_verdict || ""}\n\n${buildConsolidatedDecisionsMarkdown(data.agent_review)}\n\n### Priority Fixes\n${data.agent_review.priority_fixes?.map((fix) => `- **${fix.priority}: ${fix.fix}** — ${fix.reason}`).join("\n") || "- Not provided"}` : ""}

---

## Requirement Summary
${data.requirement_summary}

## Recommended App Type
${data.recommended_app_type}

${buildPlatformFitMarkdown(data)}

${buildReadinessGateMarkdown(data)}

${sensitiveDataControlsMarkdown(data)}

${platformObjectAccuracyMarkdown(data)}

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
`,
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
`,
  )
  .join("\n")}

### Business Rules
${data.developer?.business_rules
  ?.map(
    (b) => `- **${b.name}** (${b.when})
  - Condition: ${b.condition}
  - Purpose: ${b.purpose}`,
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
`,
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
`,
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
    if (isBuildBlockedByGate(result)) {
      const gate = getBuildReadinessGate(result);
      alert(
        `This package is not build-ready. Resolve discovery gaps before generating implementation/code.\n\nVerdict: ${safeText(gate?.verdict)}\nReason: ${safeText(gate?.reason)}`,
      );
      return;
    }

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
        "Unable to generate code. Check that the backend /generate-code endpoint is running.",
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
      2,
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
          requirement_summary:
            output.requirement_summary || result.requirement_summary,
          solution_design: output.solution_design || result.solution_design,
          recommended_app_type:
            output.recommended_app_type || result.recommended_app_type,
          platform_fit_decision:
            output.platform_fit_decision ||
            output.oob_vs_custom_decision ||
            result.platform_fit_decision ||
            result.oob_vs_custom_decision ||
            result.service_now_platform_fit,
          oob_vs_custom_decision:
            output.platform_fit_decision ||
            output.oob_vs_custom_decision ||
            result.oob_vs_custom_decision ||
            result.platform_fit_decision ||
            result.service_now_platform_fit,
          service_now_platform_fit:
            output.platform_fit_decision ||
            output.oob_vs_custom_decision ||
            result.service_now_platform_fit ||
            result.platform_fit_decision,
          build_readiness_gate:
            output.build_readiness_gate || result.build_readiness_gate,
          sensitive_data_controls:
            output.sensitive_data_controls || result.sensitive_data_controls,
          platform_object_accuracy_notes:
            output.platform_object_accuracy_notes ||
            result.platform_object_accuracy_notes,
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
              }),
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
                  }),
              ),
            }),
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
      }),
    );

    children.push(docHeading("Delivery Lead Review"));
    children.push(docHeading("Understanding", HeadingLevel.HEADING_2));
    children.push(docParagraph(result.delivery_lead_review?.understanding));

    children.push(docHeading("MVP Scope", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.mvp_scope?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(docHeading("Phase 2 Scope", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.phase_2_scope?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(docHeading("Clarifying Questions", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.clarifying_questions?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(
      docHeading("Missing / Weak Requirements", HeadingLevel.HEADING_2),
    );
    result.delivery_lead_review?.missing_requirements?.forEach((item) => {
      children.push(docBullet(`Gap: ${item.gap}`));
      children.push(docParagraph(`Why it matters: ${item.why_it_matters}`));
    });

    children.push(docHeading("Assumptions", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.assumptions?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(docHeading("Recommended Next Steps", HeadingLevel.HEADING_2));
    result.delivery_lead_review?.recommended_next_steps?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(
      docHeading(
        result.generation_mode === "quick"
          ? "Quick Readiness Score"
          : "Delivery Quality Score",
      ),
    );
    children.push(
      docParagraph(
        `Overall Score: ${scoreText(result.quality_score?.overall_score)}`,
      ),
    );
    children.push(
      docParagraph(
        `Completeness Score: ${scoreText(result.quality_score?.completeness_score)}`,
      ),
    );
    children.push(
      docParagraph(
        `Risk Score: ${scoreText(result.quality_score?.risk_score)}`,
      ),
    );
    children.push(
      docParagraph(
        `Readiness Score: ${scoreText(result.quality_score?.readiness_score)}`,
      ),
    );
    children.push(
      docParagraph(
        `Rating: ${result.quality_score?.rating || "Score unavailable"}`,
      ),
    );
    children.push(docParagraph(result.quality_score?.summary));

    children.push(docHeading("Strengths", HeadingLevel.HEADING_2));
    result.quality_score?.strengths?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(docHeading("Weaknesses", HeadingLevel.HEADING_2));
    result.quality_score?.weaknesses?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(docHeading("Recommended Fixes", HeadingLevel.HEADING_2));
    result.quality_score?.recommended_fixes?.forEach((item) =>
      children.push(docBullet(item)),
    );

    if (result.agent_review) {
      children.push(docHeading("Agent Review Board"));
      children.push(docHeading("Overall Review Summary", HeadingLevel.HEADING_2));
      children.push(docParagraph(result.agent_review.overall_review_summary));
      children.push(docParagraph(`Final Verdict: ${result.agent_review.final_verdict || "Not provided"}`));

      const consolidatedDecisions = getConsolidatedDecisions(result.agent_review);
      children.push(docHeading("Business Decisions Needed", HeadingLevel.HEADING_2));
      if (consolidatedDecisions.length) {
        consolidatedDecisions.forEach((decision, index) => {
          children.push(docParagraph(`${index + 1}. ${safeText(decision.decision_area) || "Business Decision"}`));
          children.push(docBullet(`Question: ${safeText(decision.question) || "Not provided"}`));
          children.push(docBullet(`Why it matters: ${safeText(decision.why_it_matters) || "Not provided"}`));
          children.push(docBullet(`Impacted reviewers: ${safeList(decision.impacted_reviewers).map((item) => safeText(item)).filter(Boolean).join(", ") || "Not provided"}`));
          children.push(docBullet(`Default if unanswered: ${safeText(decision.recommended_default_if_unanswered) || "Treat as unresolved."}`));
          children.push(docBullet(`Blocks build readiness: ${safeText(decision.blocks_build_readiness) || "Not provided"}`));
        });
      } else {
        children.push(docParagraph("No consolidated business decisions were returned by the review board."));
      }

      children.push(docHeading("Priority Fixes", HeadingLevel.HEADING_2));
      result.agent_review.priority_fixes?.forEach((fix) =>
        children.push(docBullet(`${fix.priority}: ${fix.fix} — ${fix.reason}`)),
      );
    }

    children.push(docHeading("Process / State Flow Diagram"));
    children.push(docParagraph(result.process_diagram?.title));
    children.push(docParagraph(result.process_diagram?.summary));
    children.push(docHeading("Mermaid Code", HeadingLevel.HEADING_2));
    children.push(docParagraph(result.process_diagram?.mermaid_code));
    children.push(docHeading("Diagram Notes", HeadingLevel.HEADING_2));
    result.process_diagram?.diagram_notes?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(docHeading("Requirement Summary"));
    children.push(docParagraph(result.requirement_summary));

    children.push(docHeading("Recommended App Type"));
    children.push(docParagraph(result.recommended_app_type));

    const platformFitDecision = getPlatformFitDecision(result);
    children.push(docHeading("ServiceNow Platform Fit / OOB vs Custom Decision"));
    if (platformFitDecision) {
      children.push(docHeading("Recommended Approach", HeadingLevel.HEADING_2));
      children.push(docParagraph(safeText(platformFitDecision.recommended_approach)));

      children.push(docHeading("OOB Features / Modules Considered", HeadingLevel.HEADING_2));
      const oobOptions = getOobOptions(platformFitDecision);
      if (oobOptions.length) {
        oobOptions.forEach((option) => {
          children.push(
            docBullet(
              `${safeText(option.option || option.name || option.module || option.feature) || "Option"} — ${safeText(option.fit) || "Fit not stated"}: ${safeText(option.rationale)}`,
            ),
          );
        });
      } else {
        children.push(docParagraph("Not provided."));
      }

      children.push(docHeading("OOB Fit Assessment", HeadingLevel.HEADING_2));
      children.push(docParagraph(safeText(platformFitDecision.oob_fit_assessment)));

      children.push(docHeading("Custom Build Needed", HeadingLevel.HEADING_2));
      children.push(docParagraph(safeText(platformFitDecision.custom_build_needed)));

      children.push(docHeading("Customization Required", HeadingLevel.HEADING_2));
      safeList(
        platformFitDecision.customization_required ||
          platformFitDecision.customization_summary,
      ).forEach((item) => children.push(docBullet(safeText(item))));

      children.push(docHeading("Technical Debt / Maintenance Impact", HeadingLevel.HEADING_2));
      if (safeList(platformFitDecision.technical_debt).length) {
        safeList(platformFitDecision.technical_debt).forEach((item: TechnicalDebtItem) => {
          children.push(
            docBullet(
              `${safeText(item.item) || "Technical debt item"} (${safeText(item.level) || "Level not stated"}): ${safeText(item.impact)} Mitigation: ${safeText(item.mitigation)}`,
            ),
          );
        });
      } else {
        safeList(platformFitDecision.maintenance_impact).forEach((item) =>
          children.push(docBullet(safeText(item))),
        );
      }

      children.push(docHeading("Upgrade Impact", HeadingLevel.HEADING_2));
      safeList(platformFitDecision.upgrade_impact).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );

      children.push(docHeading("Licensing Assumptions", HeadingLevel.HEADING_2));
      safeList(platformFitDecision.licensing_assumptions).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );

      children.push(docHeading("Pros", HeadingLevel.HEADING_2));
      safeList(platformFitDecision.pros).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );

      children.push(docHeading("Cons", HeadingLevel.HEADING_2));
      safeList(platformFitDecision.cons).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );

      children.push(docHeading("Final Recommendation", HeadingLevel.HEADING_2));
      children.push(docParagraph(safeText(platformFitDecision.final_recommendation)));
    } else {
      children.push(
        docParagraph(
          "No platform-fit decision was returned by the backend. Update the architect prompt/backend response to include platform_fit_decision.",
        ),
      );
    }


    const buildReadinessGate = getBuildReadinessGate(result);
    children.push(docHeading("Build Readiness Gate"));
    if (buildReadinessGate) {
      children.push(docParagraph(`Verdict: ${safeText(buildReadinessGate.verdict) || "Not provided"}`));
      children.push(docParagraph(`Safe to Generate Code: ${safeText(buildReadinessGate.safe_to_generate_code) || "Not provided"}`));
      children.push(docParagraph(`Reason: ${safeText(buildReadinessGate.reason) || "Not provided"}`));
      children.push(docHeading("Must Resolve Before Build", HeadingLevel.HEADING_2));
      safeList(buildReadinessGate.must_resolve_before_build).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );
    } else {
      children.push(docParagraph("No build-readiness gate was returned by the backend."));
    }

    const sensitiveDataControls = getSensitiveDataControls(result);
    children.push(docHeading("Sensitive Data Controls"));
    if (sensitiveDataControls) {
      children.push(docParagraph(`Sensitive Data Present: ${safeText(sensitiveDataControls.sensitive_data_present) || "Not provided"}`));

      children.push(docHeading("Data Types", HeadingLevel.HEADING_2));
      safeList(sensitiveDataControls.data_types).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );

      children.push(docHeading("Field-Level Security", HeadingLevel.HEADING_2));
      safeList(sensitiveDataControls.field_level_security).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );

      children.push(docHeading("Attachment Security", HeadingLevel.HEADING_2));
      safeList(sensitiveDataControls.attachment_security).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );

      children.push(docHeading("Notification Privacy", HeadingLevel.HEADING_2));
      safeList(sensitiveDataControls.notification_privacy).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );

      children.push(docHeading("Audit / Retention", HeadingLevel.HEADING_2));
      safeList(sensitiveDataControls.audit_retention).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );

      children.push(docHeading("Encryption / Masking", HeadingLevel.HEADING_2));
      safeList(sensitiveDataControls.encryption_or_masking).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );

      children.push(docHeading("Open Security Questions", HeadingLevel.HEADING_2));
      safeList(sensitiveDataControls.open_questions).forEach((item) =>
        children.push(docBullet(safeText(item))),
      );
    } else {
      children.push(docParagraph("No sensitive-data control assessment was returned by the backend."));
    }

    children.push(docHeading("Platform Object Accuracy Notes"));
    const platformObjectAccuracyNotes = getPlatformObjectAccuracyNotes(result);
    if (platformObjectAccuracyNotes.length) {
      platformObjectAccuracyNotes.forEach((item) =>
        children.push(docBullet(safeText(item))),
      );
    } else {
      children.push(docParagraph("No platform-object accuracy notes were returned by the backend."));
    }

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
        ]) || [],
      ),
    );

    children.push(docHeading("Workflow Steps"));
    result.workflow_steps?.forEach((step) => children.push(docBullet(step)));

    children.push(docHeading("Risks"));
    result.risks?.forEach((risk) => {
      children.push(docBullet(`Risk: ${risk.risk}`));
      children.push(docParagraph(`Mitigation: ${risk.mitigation}`));
    });

    children.push(docHeading("Open Questions"));
    result.open_questions?.forEach((question) =>
      children.push(docBullet(question)),
    );

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
        children.push(docBullet(criteria)),
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
    result.developer?.acl_notes?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(docHeading("Notification Notes", HeadingLevel.HEADING_2));
    result.developer?.notification_notes?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(docHeading("Deployment Notes", HeadingLevel.HEADING_2));
    result.developer?.deployment_notes?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(docHeading("QA"));
    children.push(docParagraph(result.qa?.test_strategy));

    children.push(docHeading("Test Scenarios", HeadingLevel.HEADING_2));
    result.qa?.test_scenarios?.forEach((scenario) =>
      children.push(docBullet(scenario)),
    );

    children.push(docHeading("Test Cases", HeadingLevel.HEADING_2));
    result.qa?.test_cases?.forEach((test) => {
      children.push(
        docHeading(`${test.id}: ${test.title}`, HeadingLevel.HEADING_3),
      );
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
      children.push(
        docHeading(`${uat.id}: ${uat.title}`, HeadingLevel.HEADING_3),
      );
      children.push(docParagraph(`Persona: ${uat.persona}`));
      uat.steps?.forEach((step) => children.push(docBullet(step)));
      children.push(docParagraph(`Expected Result: ${uat.expected_result}`));
    });

    children.push(docHeading("Edge Cases", HeadingLevel.HEADING_2));
    result.qa?.edge_cases?.forEach((edgeCase) =>
      children.push(docBullet(edgeCase)),
    );

    children.push(docHeading("Test Data Needs", HeadingLevel.HEADING_2));
    result.qa?.test_data_needs?.forEach((item) =>
      children.push(docBullet(item)),
    );

    children.push(docHeading("Regression Areas", HeadingLevel.HEADING_2));
    result.qa?.regression_areas?.forEach((item) =>
      children.push(docBullet(item)),
    );

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
  const packageScoreLabel =
    result?.generation_mode === "quick" ? "Readiness" : "Quality";
  const packageScoreTitle =
    result?.generation_mode === "quick"
      ? "Quick Readiness Score"
      : "Delivery Quality Score";

  const buildReadinessGate = getBuildReadinessGate(result);
  const platformFitDecision = getPlatformFitDecision(result);
  const consolidatedDecisions = getConsolidatedDecisions(result?.agent_review);
  const blockingDecisionCount = consolidatedDecisions.filter(
    (decision) => decision.blocks_build_readiness === true,
  ).length;
  const unresolvedCount =
    consolidatedDecisions.length ||
    result?.delivery_lead_review?.missing_requirements?.length ||
    result?.open_questions?.length ||
    0;
  const packageHealthLabel =
    safeText(buildReadinessGate?.verdict) ||
    safeText(result?.quality_score?.build_readiness_verdict) ||
    safeText(result?.quality_score?.rating) ||
    "Not assessed";

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
            {user ? (
              <div
                style={
                  isMobile ? styles.mobileActionRow : styles.accountTopRight
                }
              >
                <div style={styles.signedInPill}>
                  <span style={styles.signedInDot}></span>
                  <span style={styles.signedInText}>Signed in</span>
                  <span style={styles.signedInEmail}>{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  disabled={authLoading}
                  style={{
                    ...styles.secondaryButton,
                    opacity: authLoading ? 0.65 : 1,
                    cursor: authLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {authLoading ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            ) : (
              <div
                style={
                  isMobile ? styles.mobileActionRow : styles.authBoxCompact
                }
              >
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
                <div style={styles.loginHeroBadge}>
                  AI-powered delivery assistant
                </div>
                <h2
                  style={
                    isMobile
                      ? { ...styles.loginHeroTitle, fontSize: "32px" }
                      : styles.loginHeroTitle
                  }
                >
                  Turn rough requirements into delivery-ready outcomes
                </h2>
                <p style={styles.loginHeroText}>
                  Convert business intake into ServiceNow-aligned solution
                  design, user stories, technical notes, QA artifacts, delivery
                  reviews, and export-ready packages.
                </p>

                <div style={styles.loginHeroFeatureList}>
                  <div style={styles.loginHeroFeature}>
                    <span style={styles.loginHeroFeatureIcon}>▣</span>
                    <span>
                      Build solution designs, scoped app guidance, and workflow
                      structure.
                    </span>
                  </div>
                  <div style={styles.loginHeroFeature}>
                    <span style={styles.loginHeroFeatureIcon}>✓</span>
                    <span>
                      Generate stories, acceptance criteria, QA cases, and UAT
                      coverage.
                    </span>
                  </div>
                  <div style={styles.loginHeroFeature}>
                    <span style={styles.loginHeroFeatureIcon}>AI</span>
                    <span>
                      Ask the Delivery Lead questions and refine requirements
                      interactively.
                    </span>
                  </div>
                  <div style={styles.loginHeroFeature}>
                    <span style={styles.loginHeroFeatureIcon}>↗</span>
                    <span>
                      Save projects, reload packages, and continue across
                      devices.
                    </span>
                  </div>
                </div>

                <div style={styles.loginHeroSecurityNote}>
                  <span style={styles.loginHeroShield}>◇</span>
                  <span>
                    Sign in to keep your delivery packages private and reusable.
                  </span>
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
                      I analyze the intake and assemble the right delivery
                      artifacts.
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
            {showOnboardingTips && (
              <section style={styles.onboardingCard}>
                <div style={styles.cardTitleRow}>
                  <div>
                    <p style={styles.label}>First-time guide</p>
                    <h2 style={styles.cardTitle}>How to use this workspace</h2>
                  </div>
                  <button
                    onClick={dismissOnboardingTips}
                    style={styles.copyButton}
                  >
                    Got it
                  </button>
                </div>

                <div
                  style={
                    isMobile
                      ? styles.mobileOneColumnGrid
                      : styles.onboardingGrid
                  }
                >
                  <div style={styles.onboardingStep}>
                    <p style={styles.onboardingStepNumber}>1</p>
                    <p style={styles.onboardingStepTitle}>Paste or template</p>
                    <p style={styles.muted}>
                      Start from rough notes, a document, or a workflow
                      template.
                    </p>
                  </div>
                  <div style={styles.onboardingStep}>
                    <p style={styles.onboardingStepNumber}>2</p>
                    <p style={styles.onboardingStepTitle}>
                      Analyze or generate
                    </p>
                    <p style={styles.muted}>
                      Analyze gaps first, or generate Quick/Full packages
                      directly.
                    </p>
                  </div>
                  <div style={styles.onboardingStep}>
                    <p style={styles.onboardingStepNumber}>3</p>
                    <p style={styles.onboardingStepTitle}>Review and refine</p>
                    <p style={styles.muted}>
                      Use Review and Delivery Lead tabs to improve the
                      requirement.
                    </p>
                  </div>
                  <div style={styles.onboardingStep}>
                    <p style={styles.onboardingStepNumber}>4</p>
                    <p style={styles.onboardingStepTitle}>Save and export</p>
                    <p style={styles.muted}>
                      Auto-save preserves drafts. Manual Save creates a version
                      snapshot.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section style={styles.workspaceCommandBar}>
              <div>
                <p style={styles.label}>Workspace Controls</p>
                <h2 style={styles.commandBarTitle}>
                  Manage templates, saved work, and versions
                </h2>
              </div>

              <div
                style={
                  isMobile ? styles.mobileActionRow : styles.commandBarActions
                }
              >
                <select
                  value={workspacePanel}
                  onChange={(e) =>
                    openWorkspacePanel(e.target.value as WorkspacePanel)
                  }
                  style={styles.workspaceSelect}
                >
                  <option value="none">Workspace menu</option>
                  <option value="templates">Templates</option>
                  <option value="saved">
                    Saved Projects ({savedProjects.length})
                  </option>
                  <option value="versions">
                    Version History ({projectVersions.length})
                  </option>
                  <option value="diagnostics">
                    Diagnostics ({diagnostics.length})
                  </option>
                  <option value="guide">Guide</option>
                </select>

                {workspacePanel !== "none" && (
                  <button
                    onClick={() => setWorkspacePanel("none")}
                    style={styles.secondaryButton}
                  >
                    Close Panel
                  </button>
                )}
              </div>
            </section>

            {showTemplates && (
              <section style={styles.compactPanel}>
                <div style={responsiveTemplateHeader}>
                  <div>
                    <p style={styles.label}>Template Library</p>
                    <h2 style={styles.templateTitle}>
                      Start from a common ServiceNow workflow
                    </h2>
                    <p style={styles.muted}>
                      Pick a template to preload a strong sample requirement.
                      You can edit it before analysis.
                    </p>
                  </div>

                  <button
                    onClick={() => setWorkspacePanel("none")}
                    style={styles.copyButton}
                  >
                    Close
                  </button>
                </div>

                <div style={responsiveTemplateGrid}>
                  {REQUIREMENT_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      style={styles.templateTile}
                    >
                      <div style={styles.templateTileTop}>
                        <p style={styles.templateName}>{template.name}</p>
                        <span style={styles.templateCategory}>
                          {template.category}
                        </span>
                      </div>

                      <p style={styles.templateDescription}>
                        {template.description}
                      </p>

                      <p style={styles.templateUse}>Use template →</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {showSavedProjectsPanel && (
              <section style={styles.compactPanel}>
                <div style={styles.cardTitleRow}>
                  <div>
                    <p style={styles.label}>Saved Projects</p>
                    <h2 style={styles.cardTitle}>
                      Load or delete saved delivery packages
                    </h2>
                  </div>
                  <button
                    onClick={() => setWorkspacePanel("none")}
                    style={styles.copyButton}
                  >
                    Close
                  </button>
                </div>

                {savedProjects.length ? (
                  <div
                    style={
                      isMobile
                        ? styles.mobileOneColumnGrid
                        : styles.savedProjectGrid
                    }
                  >
                    {savedProjects.map((project) => (
                      <div
                        key={project.id}
                        style={
                          project.id === activeProjectId
                            ? {
                                ...styles.savedProjectCard,
                                ...styles.savedProjectCardActive,
                              }
                            : styles.savedProjectCard
                        }
                      >
                        <button
                          onClick={() => {
                            loadProject(project);
                            setWorkspacePanel("none");
                          }}
                          style={styles.savedProjectLoadButton}
                        >
                          <div style={styles.rowBetween}>
                            <h3 style={styles.itemTitle}>
                              {project.project_name}
                            </h3>
                            <Badge>{project.project_status || "Draft"}</Badge>
                          </div>
                          <p style={styles.muted}>
                            Updated{" "}
                            {new Date(project.updated_at).toLocaleString()}
                          </p>
                          <p style={styles.projectMeta}>
                            {project.result?.generation_mode || "No package"} ·{" "}
                            {scoreText(
                              project.result?.quality_score?.overall_score,
                            )}{" "}
                            · {(project.versions || []).length} version
                            {(project.versions || []).length === 1 ? "" : "s"}
                          </p>
                        </button>

                        <button
                          onClick={() => deleteProject(project.id)}
                          style={styles.dangerButton}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={styles.muted}>
                    No saved projects yet. Create or generate a package, then
                    click Save Project.
                  </p>
                )}
              </section>
            )}

            {showVersionHistoryPanel && (
              <section style={styles.compactPanel}>
                <div style={styles.cardTitleRow}>
                  <div>
                    <p style={styles.label}>Version History</p>
                    <h2 style={styles.cardTitle}>
                      Compare current package with previous saved states
                    </h2>
                  </div>
                  <button
                    onClick={() => setWorkspacePanel("none")}
                    style={styles.copyButton}
                  >
                    Close
                  </button>
                </div>

                {projectVersions.length ? (
                  <div style={styles.stack}>
                    <div
                      style={
                        isMobile
                          ? styles.mobileOneColumnGrid
                          : styles.versionControlRow
                      }
                    >
                      <div style={styles.projectField}>
                        <label style={styles.projectLabel}>
                          Previous Version
                        </label>
                        <select
                          value={compareVersionId}
                          onChange={(e) => setCompareVersionId(e.target.value)}
                          style={styles.projectSelect}
                        >
                          <option value="">Select a previous version...</option>
                          {projectVersions.map((version) => (
                            <option key={version.id} value={version.id}>
                              {version.label} ·{" "}
                              {new Date(version.created_at).toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          if (!compareVersionId) {
                            alert("Select a previous version first.");
                            return;
                          }
                          setShowComparePanel(!showComparePanel);
                        }}
                        disabled={!compareVersionId || !result}
                        style={{
                          ...styles.secondaryButton,
                          opacity: compareVersionId && result ? 1 : 0.5,
                          cursor:
                            compareVersionId && result
                              ? "pointer"
                              : "not-allowed",
                        }}
                      >
                        Compare Version
                      </button>
                    </div>

                    <div style={styles.versionList}>
                      {projectVersions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => {
                            setCompareVersionId(version.id);
                            setShowComparePanel(true);
                          }}
                          style={
                            version.id === compareVersionId
                              ? {
                                  ...styles.versionRow,
                                  ...styles.versionRowActive,
                                }
                              : styles.versionRow
                          }
                        >
                          <div>
                            <p style={styles.itemTitle}>{version.label}</p>
                            <p style={styles.muted}>
                              {new Date(version.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div style={styles.versionMetaGroup}>
                            <Badge>{version.project_status}</Badge>
                            <span style={styles.versionMeta}>
                              {version.result?.generation_mode || "No package"}
                            </span>
                            <span style={styles.versionMeta}>
                              {scoreText(
                                version.result?.quality_score?.overall_score,
                              )}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {showComparePanel && getSelectedCompareVersion() && (
                      <div style={styles.comparePanel}>
                        <div style={styles.cardTitleRow}>
                          <div>
                            <p style={styles.label}>
                              Compare current package vs previous version
                            </p>
                            <h3 style={styles.itemTitle}>
                              {getSelectedCompareVersion()?.label}
                            </h3>
                          </div>
                          <button
                            style={styles.copyButton}
                            onClick={() => setShowComparePanel(false)}
                          >
                            Close Compare
                          </button>
                        </div>

                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Area</th>
                              <th style={styles.th}>Previous Version</th>
                              <th style={styles.th}>Current Workspace</th>
                            </tr>
                          </thead>
                          <tbody>
                            {buildPackageComparison(
                              getSelectedCompareVersion(),
                            ).map((row) => (
                              <tr key={row.label}>
                                <td style={styles.tableName}>{row.label}</td>
                                <td style={styles.td}>{row.previous}</td>
                                <td style={styles.td}>{row.current}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={styles.muted}>
                    No versions yet. Manual Save/Update creates version
                    snapshots.
                  </p>
                )}
              </section>
            )}

            {showDiagnosticsPanel && (
              <section style={styles.compactPanel}>
                <div style={styles.cardTitleRow}>
                  <div>
                    <p style={styles.label}>System Diagnostics</p>
                    <h2 style={styles.cardTitle}>Operation history</h2>
                    <p style={styles.muted}>
                      Hidden by default. Use this only when troubleshooting API,
                      save, upload, or generation issues.
                    </p>
                  </div>
                  <div style={styles.headerActions}>
                    <button
                      onClick={() => setShowDiagnostics(!showDiagnostics)}
                      style={styles.copyButton}
                    >
                      {showDiagnostics ? "Collapse Details" : "Expand Details"}
                    </button>
                    <button
                      onClick={clearDiagnostics}
                      style={styles.copyButton}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setWorkspacePanel("none")}
                      style={styles.copyButton}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {diagnostics.length ? (
                  <div style={styles.stack}>
                    <div style={styles.diagnosticSummary}>
                      <Badge>{diagnostics[0].status}</Badge>
                      <span style={styles.bodyText}>
                        {diagnostics[0].area}: {diagnostics[0].message}
                      </span>
                    </div>

                    {showDiagnostics && (
                      <div style={styles.stack}>
                        {diagnostics.map((event) => (
                          <div key={event.id} style={styles.diagnosticEvent}>
                            <div style={styles.rowBetween}>
                              <p style={styles.itemTitle}>{event.area}</p>
                              <Badge>{event.status}</Badge>
                            </div>
                            <p style={styles.bodyText}>{event.message}</p>
                            {event.detail && (
                              <pre style={styles.smallCodeBlock}>
                                {event.detail}
                              </pre>
                            )}
                            <p style={styles.muted}>
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={styles.muted}>
                    No diagnostics recorded yet. Errors and key operation
                    results will appear here after they happen.
                  </p>
                )}
              </section>
            )}

            <section style={styles.statusBanner}>
              <div>
                <p style={styles.label}>Project Status</p>
                <h2 style={styles.statusTitle}>{projectStatus}</h2>
                <p style={styles.projectMeta}>
                  {activeProjectId
                    ? "Active saved project"
                    : "Unsaved workspace"}{" "}
                  · {files.length} file{files.length === 1 ? "" : "s"} attached
                  by name · {autoSaveState}
                  {lastAutoSavedAt
                    ? ` at ${new Date(lastAutoSavedAt).toLocaleTimeString()}`
                    : ""}
                </p>
              </div>

              <div
                style={isMobile ? styles.mobileStatusFlow : styles.statusFlow}
              >
                {PROJECT_STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => setProjectStatus(status)}
                    style={
                      projectStatus === status
                        ? styles.statusStepActive
                        : styles.statusStep
                    }
                  >
                    {status}
                  </button>
                ))}
              </div>
            </section>

            <section style={styles.projectBar}>
              <div style={responsiveProjectBarTop}>
                <div>
                  <p style={styles.label}>Project Workspace</p>
                  <h2 style={styles.projectBarTitle}>
                    Name and save the current package
                  </h2>
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

              <div
                style={
                  isMobile
                    ? styles.mobileOneColumnGrid
                    : styles.simpleProjectControls
                }
              >
                <div style={styles.projectField}>
                  <label style={styles.projectLabel}>Current Project</label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Optional. Name this delivery package..."
                    style={styles.projectInput}
                  />
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
            </section>

            {loadingStage && (
              <div style={styles.loadingStage}>{loadingStage}</div>
            )}



            {packageNeedsRegeneration && result && (
              <div style={styles.regenerationNotice}>
                <div>
                  <p style={styles.label}>
                    Requirement changed after package generation
                  </p>
                  <p style={styles.bodyText}>
                    Regenerate the package so design, stories, technical notes,
                    QA, and review content match the updated requirement.
                  </p>
                </div>
                <button
                  onClick={regeneratePackageAfterRequirementUpdate}
                  disabled={loading}
                  style={{
                    ...styles.button,
                    opacity: loading ? 0.65 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Regenerating..." : "Regenerate Package"}
                </button>
              </div>
            )}

            <section style={styles.intakeCard}>
              <div style={responsiveCardHeader}>
                <h2 style={styles.sectionTitle}>Requirement Intake</h2>
                <span style={styles.muted}>
                  Text or docs → delivery-ready package
                </span>
              </div>

              <textarea
                value={requirement}
                onChange={(e) => {
                  setRequirement(e.target.value);
                  if (result) setPackageNeedsRegeneration(true);
                }}
                placeholder="Paste rough requirement notes here..."
                style={styles.textarea}
              />

              <div style={responsiveUploadArea}>
                <div>
                  <p style={styles.uploadTitle}>Upload supporting documents</p>
                  <p style={styles.muted}>
                    Supported: .txt, .pdf, .docx, .pptx, .ppt, and common image files.
                    You can attach multiple documents. Image-based PDFs/images are read by backend OCR when configured.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.pdf,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tif,.tiff"
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

                  <button
                    type="button"
                    onClick={clearUploadedFiles}
                    style={styles.clearFilesButton}
                  >
                    Clear uploaded files
                  </button>
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

              <div
                style={
                  isMobile
                    ? { ...styles.intakeActions, ...styles.mobileActionRow }
                    : styles.intakeActions
                }
              >
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
                  {activeGenerationMode === "quick"
                    ? "Generating Quick..."
                    : "Quick Package"}
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
                  {activeGenerationMode === "full"
                    ? "Generating Full..."
                    : "Full Detailed Package"}
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
                    <p style={styles.bodyText}>
                      {intakeAnalysis.understanding}
                    </p>
                  </div>

                  <div style={responsiveTwoGrid}>
                    <div style={styles.innerCard}>
                      <p style={styles.label}>Clarifying Questions</p>
                      {intakeAnalysis.clarifying_questions?.length ? (
                        <ul style={styles.list}>
                          {intakeAnalysis.clarifying_questions.map(
                            (question, index) => (
                              <li key={index}>{question}</li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <p style={styles.muted}>
                          No major questions identified.
                        </p>
                      )}
                    </div>

                    <div style={styles.innerCard}>
                      <p style={styles.label}>Assumptions</p>
                      {intakeAnalysis.assumptions?.length ? (
                        <ul style={styles.list}>
                          {intakeAnalysis.assumptions.map(
                            (assumption, index) => (
                              <li key={index}>{assumption}</li>
                            ),
                          )}
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
                        {intakeAnalysis.missing_requirements.map(
                          (item, index) => (
                            <div key={index} style={styles.riskBox}>
                              <p style={styles.riskTitle}>{item.gap}</p>
                              <p style={styles.bodyText}>
                                <strong>Why it matters:</strong>{" "}
                                {item.why_it_matters}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div style={styles.innerCard}>
                    <p style={styles.label}>
                      Answer Questions / Add Clarifications
                    </p>
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
                          cursor:
                            analyzing || loading ? "not-allowed" : "pointer",
                        }}
                      >
                        {analyzing
                          ? "Reanalyzing..."
                          : "Reanalyze with Answers"}
                      </button>

                      <button
                        onClick={() => generatePackage("quick")}
                        disabled={loading || analyzing}
                        style={{
                          ...styles.secondaryButton,
                          opacity: loading || analyzing ? 0.65 : 1,
                          cursor:
                            loading || analyzing ? "not-allowed" : "pointer",
                        }}
                      >
                        {activeGenerationMode === "quick"
                          ? "Generating Quick..."
                          : "Quick Package with Answers"}
                      </button>

                      <button
                        onClick={() => generatePackage("full")}
                        disabled={loading || analyzing}
                        style={{
                          ...styles.button,
                          opacity: loading || analyzing ? 0.65 : 1,
                          cursor:
                            loading || analyzing ? "not-allowed" : "pointer",
                        }}
                      >
                        {activeGenerationMode === "full"
                          ? "Generating Full..."
                          : "Full Detailed Package with Answers"}
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
                <div style={styles.packageCommandBar}>
                  <div style={styles.packageCommandLeft}>
                    <p style={styles.label}>Package Workspace</p>
                    <h2 style={styles.packageTitleCompact}>
                      {projectName || "Current Delivery Package"}
                    </h2>
                    <div style={styles.packagePillRow}>
                      <span style={styles.softPill}>{result.generation_mode === "quick" ? "Quick package" : "Full package"}</span>
                      <span style={styles.softPill}>{packageScoreLabel}: {displayScore(result.quality_score?.overall_score)}</span>
                      <span style={styles.softPill}>Readiness: {packageHealthLabel}</span>
                      {unresolvedCount > 0 && (
                        <span style={styles.warningPill}>{unresolvedCount} items to resolve</span>
                      )}
                    </div>
                  </div>

                  <div style={styles.packageCommandActions}>
                    {(!result.developer || !result.qa || !result.quality_score) && (
                      <button
                        onClick={upgradeQuickPackageToFull}
                        disabled={loading}
                        style={{
                          ...styles.button,
                          opacity: loading ? 0.65 : 1,
                          cursor: loading ? "not-allowed" : "pointer",
                        }}
                      >
                        {loading ? "Upgrading..." : "Make Full"}
                      </button>
                    )}
                    <button
                      onClick={runAgentReview}
                      disabled={loading}
                      style={{
                        ...styles.secondaryButton,
                        opacity: loading ? 0.65 : 1,
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loading ? "Reviewing..." : result.agent_review ? "Refresh Review" : "Run Review"}
                    </button>
                    <button onClick={() => selectPackageTab("review")} style={styles.secondaryButton}>
                      Decisions
                    </button>
                    <button onClick={() => selectPackageTab("delivery_lead")} style={styles.secondaryButton}>
                      Ask Lead
                    </button>
                    <button onClick={() => selectPackageTab("export")} style={styles.secondaryButton}>
                      Export
                    </button>
                    <button
                      onClick={() => setPackageChromeExpanded(!packageChromeExpanded)}
                      style={styles.tertiaryButton}
                    >
                      {packageChromeExpanded ? "Hide details" : "Show details"}
                    </button>
                  </div>
                </div>

                {packageNeedsRegeneration && (
                  <div style={styles.regenerationNotice}>
                    <div>
                      <p style={styles.riskTitle}>Requirement changed after package generation</p>
                      <p style={styles.bodyText}>Regenerate the package before exporting or using it for handoff.</p>
                    </div>
                    <button onClick={() => generatePackage("full")} disabled={loading} style={styles.button}>
                      {loading ? "Regenerating..." : "Regenerate Full Package"}
                    </button>
                  </div>
                )}

                {packageChromeExpanded && (
                  <div style={isMobile ? styles.mobileSnapshotGrid : styles.snapshotGrid}>
                    <div style={styles.snapshotMetric}>
                      <p style={styles.label}>{packageScoreLabel}</p>
                      <p style={styles.snapshotNumber}>{displayScore(result.quality_score?.overall_score)}</p>
                      <p style={styles.snapshotText}>{hasScore ? "/ 100" : "unavailable"}</p>
                    </div>
                    <div style={styles.snapshotMetric}>
                      <p style={styles.label}>Stories</p>
                      <p style={styles.snapshotNumber}>{result.stories?.length || 0}</p>
                      <p style={styles.snapshotText}>generated</p>
                    </div>
                    <div style={styles.snapshotMetric}>
                      <p style={styles.label}>Test Cases</p>
                      <p style={styles.snapshotNumber}>{result.generation_mode === "quick" ? "—" : result.qa?.test_cases?.length || 0}</p>
                      <p style={styles.snapshotText}>{result.generation_mode === "quick" ? "full only" : "QA cases"}</p>
                    </div>
                    <div style={styles.snapshotMetric}>
                      <p style={styles.label}>Tech Objects</p>
                      <p style={styles.snapshotNumber}>{result.generation_mode === "quick" ? "—" : result.developer?.service_now_objects?.length || 0}</p>
                      <p style={styles.snapshotText}>{result.generation_mode === "quick" ? "full only" : "objects"}</p>
                    </div>
                    <div style={styles.snapshotMetric}>
                      <p style={styles.label}>Open Questions</p>
                      <p style={styles.snapshotNumber}>{result.open_questions?.length || 0}</p>
                      <p style={styles.snapshotText}>items</p>
                    </div>
                  </div>
                )}

                <div
                  ref={packageContentRef}
                  style={isMobile ? styles.mobilePackageNav : styles.packageNav}
                >
                  {PACKAGE_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => selectPackageTab(tab.id)}
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
                      title="Executive Overview"
                      copyValue={result ? buildMarkdown(result) : ""}
                      onCopy={copyToClipboard}
                    >
                      <div style={styles.stack}>
                        <div style={styles.overviewHeroGrid}>
                          <div style={styles.innerCard}>
                            <p style={styles.label}>Requirement Summary</p>
                            <p style={styles.bodyText}>{result.requirement_summary || result.delivery_lead_review?.understanding}</p>
                          </div>
                          <div style={styles.innerCard}>
                            <p style={styles.label}>Recommended Approach</p>
                            <p style={styles.accentText}>
                              {safeText(platformFitDecision?.recommended_approach) || result.recommended_app_type || "Not provided"}
                            </p>
                            <p style={styles.bodyText}>{safeText(platformFitDecision?.final_recommendation)}</p>
                          </div>
                        </div>

                        <div style={styles.nextStepGrid}>
                          <button onClick={() => selectPackageTab("design")} style={styles.nextStepCardButton}>
                            <span style={styles.label}>1 · Architecture</span>
                            <strong>Review platform fit</strong>
                            <span>OOB vs custom, readiness, security, object model.</span>
                          </button>
                          <button onClick={() => selectPackageTab("review")} style={styles.nextStepCardButton}>
                            <span style={styles.label}>2 · Decisions</span>
                            <strong>{consolidatedDecisions.length ? `${consolidatedDecisions.length} consolidated decisions` : "Run agent review"}</strong>
                            <span>{blockingDecisionCount ? `${blockingDecisionCount} blocking decisions` : "De-duplicate reviewer questions."}</span>
                          </button>
                          <button onClick={() => selectPackageTab("delivery_lead")} style={styles.nextStepCardButton}>
                            <span style={styles.label}>3 · Clarify</span>
                            <strong>Ask Delivery Lead</strong>
                            <span>Apply answers back to the requirement.</span>
                          </button>
                          <button onClick={() => selectPackageTab("export")} style={styles.nextStepCardButton}>
                            <span style={styles.label}>4 · Handoff</span>
                            <strong>Export package</strong>
                            <span>DOCX and Markdown stay in the Export tab.</span>
                          </button>
                        </div>

                        <div style={responsiveTwoGrid}>
                          <div style={styles.innerCard}>
                            <p style={styles.label}>Build Readiness</p>
                            <p style={styles.accentText}>{packageHealthLabel}</p>
                            <p style={styles.bodyText}>{safeText(buildReadinessGate?.reason) || result.quality_score?.summary}</p>
                            {safeList(buildReadinessGate?.must_resolve_before_build).length > 0 && (
                              <details style={styles.detailsBox}>
                                <summary style={styles.detailsSummary}>Show blockers</summary>
                                <ul style={styles.list}>
                                  {safeList(buildReadinessGate?.must_resolve_before_build).map((item, index) => (
                                    <li key={index}>{safeText(item)}</li>
                                  ))}
                                </ul>
                              </details>
                            )}
                          </div>

                          <div style={styles.innerCard}>
                            <p style={styles.label}>MVP Scope Preview</p>
                            <ul style={styles.list}>
                              {result.delivery_lead_review?.mvp_scope?.slice(0, 5).map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                            {(result.delivery_lead_review?.mvp_scope?.length || 0) > 5 && (
                              <button onClick={() => selectPackageTab("delivery_lead")} style={styles.inlineLinkButton}>
                                View full Delivery Lead scope →
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={responsiveTwoGrid}>
                          <div style={styles.innerCard}>
                            <p style={styles.label}>Business Decisions Needed</p>
                            {consolidatedDecisions.length ? (
                              <div style={styles.stackSmall}>
                                {consolidatedDecisions.slice(0, 4).map((decision, index) => (
                                  <div key={index} style={styles.decisionMiniCard}>
                                    <strong>{safeText(decision.decision_area) || `Decision ${index + 1}`}</strong>
                                    <span>{safeText(decision.question)}</span>
                                  </div>
                                ))}
                                <button onClick={() => selectPackageTab("review")} style={styles.inlineLinkButton}>
                                  Resolve all decisions in Review →
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p style={styles.bodyText}>Run Agent Review to consolidate duplicate questions from Architect, Developer, QA, and Delivery Lead.</p>
                                <button onClick={runAgentReview} disabled={loading} style={styles.secondaryButton}>
                                  {loading ? "Reviewing..." : "Run Agent Review"}
                                </button>
                              </div>
                            )}
                          </div>

                          <div style={styles.innerCard}>
                            <p style={styles.label}>Quality Snapshot</p>
                            <div style={styles.compactScoreRow}>
                              <ScoreBox
                                label="Overall"
                                score={result.quality_score?.overall_score}
                                color={getScoreColor(result.quality_score?.overall_score)}
                                background={getScoreBackground(result.quality_score?.overall_score)}
                              />
                              <ScoreBox
                                label="Readiness"
                                score={result.quality_score?.readiness_score}
                                color={getScoreColor(result.quality_score?.readiness_score)}
                                background={getScoreBackground(result.quality_score?.readiness_score)}
                              />
                            </div>
                            <p style={styles.bodyText}>{result.quality_score?.summary}</p>
                          </div>
                        </div>
                      </div>
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
                        <p style={styles.bodyText}>
                          {result.requirement_summary}
                        </p>
                      </Card>

                      <Card
                        title="Recommended App Type"
                        copyValue={result.recommended_app_type}
                        onCopy={copyToClipboard}
                      >
                        <p style={styles.accentText}>
                          {result.recommended_app_type}
                        </p>
                        <p style={styles.muted}>
                          Use this as the delivery architecture direction before
                          refining stories and technical notes.
                        </p>
                      </Card>
                    </div>

                    <PlatformFitDecisionCard
                      decision={getPlatformFitDecision(result)}
                      copyValue={buildPlatformFitMarkdown(result)}
                      onCopy={copyToClipboard}
                    />

                    <BuildReadinessGateCard
                      gate={getBuildReadinessGate(result)}
                      onCopy={copyToClipboard}
                    />

                    <SensitiveDataControlsCard
                      controls={getSensitiveDataControls(result)}
                      onCopy={copyToClipboard}
                    />

                    <PlatformObjectAccuracyCard
                      notes={getPlatformObjectAccuracyNotes(result)}
                      onCopy={copyToClipboard}
                    />

                    <Card
                      title="Open Questions / Build Gaps"
                      copyValue={result.open_questions?.join("\n")}
                      onCopy={copyToClipboard}
                    >
                      {result.open_questions?.length ? (
                        <div style={responsiveTwoGrid}>
                          {result.open_questions.map((question, index) => (
                            <div key={index} style={styles.questionCard}>
                              <p style={styles.questionNumber}>
                                Question {index + 1}
                              </p>
                              <p style={styles.bodyText}>{question}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={styles.muted}>
                          No open questions identified.
                        </p>
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
                                <td style={styles.tableName}>
                                  {table.table_name}
                                </td>
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
                          <p style={styles.muted}>
                            No workflow steps returned.
                          </p>
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
                                  <p style={styles.label}>
                                    Acceptance Criteria
                                  </p>
                                  <ul style={styles.list}>
                                    {story.acceptance_criteria.map(
                                      (criteria, i) => (
                                        <li key={i}>{criteria}</li>
                                      ),
                                    )}
                                  </ul>
                                </>
                              )}

                              <button
                                style={styles.smallCopyButton}
                                onClick={() =>
                                  copyToClipboard(
                                    JSON.stringify(story, null, 2),
                                  )
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
                              <p style={styles.bodyText}>
                                {result.developer.implementation_summary}
                              </p>
                            </div>
                            <div style={styles.technicalStatsGrid}>
                              <div style={styles.technicalStat}>
                                <p style={styles.label}>Objects</p>
                                <p style={styles.snapshotNumber}>
                                  {result.developer.service_now_objects
                                    ?.length || 0}
                                </p>
                              </div>
                              <div style={styles.technicalStat}>
                                <p style={styles.label}>Flows</p>
                                <p style={styles.snapshotNumber}>
                                  {result.developer.flow_designer_notes
                                    ?.length || 0}
                                </p>
                              </div>
                              <div style={styles.technicalStat}>
                                <p style={styles.label}>Rules</p>
                                <p style={styles.snapshotNumber}>
                                  {result.developer.business_rules?.length || 0}
                                </p>
                              </div>
                            </div>
                          </div>

                          {result.developer.service_now_objects?.length > 0 && (
                            <div style={styles.techSection}>
                              <div style={styles.techSectionHeader}>
                                <div>
                                  <p style={styles.label}>Build Inventory</p>
                                  <h3 style={styles.itemTitle}>
                                    ServiceNow Objects
                                  </h3>
                                </div>
                                <Badge>
                                  {result.developer.service_now_objects.length}{" "}
                                  objects
                                </Badge>
                              </div>
                              <div style={responsiveTwoGrid}>
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
                                          object.name,
                                        )
                                      }
                                    >
                                      <div style={styles.rowBetween}>
                                        <p style={styles.accentText}>
                                          {object.name}
                                        </p>
                                        <span style={styles.objectTypePill}>
                                          {object.object_type}
                                        </span>
                                      </div>
                                      <p style={styles.bodyText}>
                                        {object.purpose}
                                      </p>
                                      <p style={styles.clickHint}>
                                        Generate implementation guidance →
                                      </p>
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          {result.developer.flow_designer_notes?.length > 0 && (
                            <div style={styles.techSection}>
                              <div style={styles.techSectionHeader}>
                                <div>
                                  <p style={styles.label}>Automation</p>
                                  <h3 style={styles.itemTitle}>
                                    Flow Designer
                                  </h3>
                                </div>
                                <Badge>
                                  {result.developer.flow_designer_notes.length}{" "}
                                  flows
                                </Badge>
                              </div>
                              <div style={styles.stack}>
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
                                          flow.flow_name,
                                        )
                                      }
                                    >
                                      <div style={styles.rowBetween}>
                                        <h3 style={styles.itemTitle}>
                                          {flow.flow_name}
                                        </h3>
                                        <span style={styles.statusChip}>
                                          Flow
                                        </span>
                                      </div>
                                      <p style={styles.muted}>
                                        Trigger: {flow.trigger}
                                      </p>
                                      <ol style={styles.list}>
                                        {flow.steps.map((step, i) => (
                                          <li key={i}>{step}</li>
                                        ))}
                                      </ol>
                                      <p style={styles.clickHint}>
                                        Generate flow implementation details →
                                      </p>
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          {result.developer.business_rules?.length > 0 && (
                            <div style={styles.techSection}>
                              <div style={styles.techSectionHeader}>
                                <div>
                                  <p style={styles.label}>Server Logic</p>
                                  <h3 style={styles.itemTitle}>
                                    Business Rules
                                  </h3>
                                </div>
                                <Badge>
                                  {result.developer.business_rules.length} rules
                                </Badge>
                              </div>
                              <div style={responsiveTwoGrid}>
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
                                          rule.name,
                                        )
                                      }
                                    >
                                      <div style={styles.rowBetween}>
                                        <h3 style={styles.itemTitle}>
                                          {rule.name}
                                        </h3>
                                        <span style={styles.statusChip}>
                                          {rule.when}
                                        </span>
                                      </div>
                                      <p style={styles.muted}>
                                        Condition: {rule.condition}
                                      </p>
                                      <p style={styles.bodyText}>
                                        {rule.purpose}
                                      </p>
                                      <p style={styles.clickHint}>
                                        Generate business rule script/guidance →
                                      </p>
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          <div style={responsiveTwoGrid}>
                            <div style={styles.innerCard}>
                              <p style={styles.label}>ACL / Security Notes</p>
                              {result.developer.acl_notes?.length ? (
                                <ul style={styles.list}>
                                  {result.developer.acl_notes.map(
                                    (item, index) => (
                                      <li key={index}>{item}</li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <p style={styles.muted}>
                                  No ACL notes generated.
                                </p>
                              )}
                            </div>
                            <div style={styles.innerCard}>
                              <p style={styles.label}>Notification Notes</p>
                              {result.developer.notification_notes?.length ? (
                                <ul style={styles.list}>
                                  {result.developer.notification_notes.map(
                                    (item, index) => (
                                      <li key={index}>{item}</li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <p style={styles.muted}>
                                  No notification notes generated.
                                </p>
                              )}
                            </div>
                          </div>

                          {result.developer.deployment_notes?.length > 0 && (
                            <div style={styles.innerCard}>
                              <p style={styles.label}>Deployment Notes</p>
                              <ul style={styles.list}>
                                {result.developer.deployment_notes.map(
                                  (item, index) => (
                                    <li key={index}>{item}</li>
                                  ),
                                )}
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
                          <h2 style={styles.sectionTitle}>
                            Technical notes are not available yet
                          </h2>
                          <p style={styles.bodyText}>
                            Generate a full detailed package or upgrade the
                            quick package to create implementation notes, flows,
                            ACL guidance, notifications, and code-ready objects.
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
                            <p style={styles.bodyText}>
                              {result.qa.test_strategy}
                            </p>
                          </div>

                          {result.qa.test_cases?.length > 0 && (
                            <>
                              <p style={styles.label}>Test Cases</p>
                              <div style={responsiveTwoGrid}>
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
                                          JSON.stringify(test, null, 2),
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
                              <div style={responsiveTwoGrid}>
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
                                        copyToClipboard(
                                          JSON.stringify(uat, null, 2),
                                        )
                                      }
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
                            <p
                              style={{
                                ...styles.accentText,
                                marginTop: "12px",
                              }}
                            >
                              Final Verdict: {result.agent_review.final_verdict}
                            </p>
                          </div>

                          <div style={styles.innerCard}>
                            <p style={styles.label}>How to Use This Review</p>
                            <p style={styles.bodyText}>
                              Start with the overall verdict and priority fixes.
                              Then open a specialist tab below to review
                              Architect, Developer, QA, or Delivery Lead
                              feedback. You can ask that agent questions and
                              apply requirement updates when needed.
                            </p>
                          </div>
                        </div>

                        {result.agent_review.priority_fixes?.length > 0 && (
                          <div style={styles.innerCard}>
                            <div style={styles.cardTitleRow}>
                              <div>
                                <p style={styles.label}>Priority Fixes</p>
                                <h3 style={styles.itemTitle}>
                                  Fix these before build handoff
                                </h3>
                              </div>
                              <Badge>
                                {result.agent_review.priority_fixes.length}{" "}
                                fixes
                              </Badge>
                            </div>

                            <div style={styles.priorityFixGrid}>
                              {result.agent_review.priority_fixes.map(
                                (fix, index) => (
                                  <div
                                    key={index}
                                    style={styles.priorityFixCard}
                                  >
                                    <p style={styles.riskTitle}>
                                      {fix.priority}: {fix.fix}
                                    </p>
                                    <p style={styles.bodyText}>
                                      <strong>Reason:</strong> {fix.reason}
                                    </p>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {getConsolidatedDecisions(result.agent_review).length > 0 && (
                          <div style={styles.innerCard}>
                            <div style={styles.cardTitleRow}>
                              <div>
                                <p style={styles.label}>Business Decisions Needed</p>
                                <h3 style={styles.itemTitle}>Consolidated decision log</h3>
                                <p style={styles.muted}>
                                  These are deduplicated questions across Architect, Developer, QA, and Delivery Lead. Answer these once, apply them to the requirement, then regenerate.
                                </p>
                              </div>
                              <Badge>
                                {getConsolidatedDecisions(result.agent_review).length} decisions
                              </Badge>
                            </div>

                            <div style={styles.priorityFixGrid}>
                              {getConsolidatedDecisions(result.agent_review).map(
                                (decision, index) => (
                                  <div key={index} style={styles.priorityFixCard}>
                                    <p style={styles.label}>
                                      {safeText(decision.decision_area) || "Business Decision"}
                                    </p>
                                    <p style={styles.riskTitle}>
                                      {safeText(decision.question) || "Question not provided"}
                                    </p>
                                    <p style={styles.bodyText}>
                                      <strong>Why it matters:</strong>{" "}
                                      {safeText(decision.why_it_matters) || "Not provided"}
                                    </p>
                                    <p style={styles.bodyText}>
                                      <strong>Impacted reviewers:</strong>{" "}
                                      {safeList(decision.impacted_reviewers)
                                        .map((item) => safeText(item))
                                        .filter(Boolean)
                                        .join(", ") || "Not provided"}
                                    </p>
                                    <p style={styles.bodyText}>
                                      <strong>Default if unanswered:</strong>{" "}
                                      {safeText(decision.recommended_default_if_unanswered) ||
                                        "Treat as unresolved."}
                                    </p>
                                    <p style={styles.bodyText}>
                                      <strong>Blocks build readiness:</strong>{" "}
                                      {safeText(decision.blocks_build_readiness) ||
                                        "Not provided"}
                                    </p>
                                  </div>
                                ),
                              )}
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
                              REVIEW_AGENT_TABS.find(
                                (tab) => tab.id === activeReviewAgent,
                              )?.title || "Agent Review"
                            }
                            review={getReviewFeedback(activeReviewAgent)}
                          />

                          <div style={styles.reviewAgentChatBox}>
                            <div style={styles.reviewAgentChatHeader}>
                              <div>
                                <p style={styles.label}>Reviewer Chat</p>
                                <h3 style={styles.itemTitle}>
                                  Talk directly with{" "}
                                  {getReviewAgentLabel(activeReviewAgent)}
                                </h3>
                                <p style={styles.muted}>
                                  Ask for priority fixes, requirement rewrites,
                                  implementation guidance, risks, or what to
                                  clarify with business.
                                </p>
                              </div>

                              <Badge>
                                {reviewAgentChats[activeReviewAgent]?.length ||
                                  0}{" "}
                                messages
                              </Badge>
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
                                reviewAgentChats[activeReviewAgent].map(
                                  (message, index) => (
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
                                          : getReviewAgentLabel(
                                              activeReviewAgent,
                                            )}
                                      </p>
                                      <p style={styles.agentMessageText}>
                                        {message.content}
                                      </p>
                                    </div>
                                  ),
                                )
                              ) : (
                                <div style={styles.agentChatEmpty}>
                                  <p style={styles.label}>
                                    Start with a specific ask
                                  </p>
                                  <p style={styles.bodyText}>
                                    Example: “Developer, rewrite the requirement
                                    to address your top implementation concern.”
                                    If the reviewer suggests a requirement
                                    update, you can apply it back to the main
                                    requirement.
                                  </p>
                                </div>
                              )}
                            </div>

                            {reviewAgentPendingRequirementUpdate && (
                              <div style={styles.requirementUpdateBox}>
                                <p style={styles.label}>
                                  Suggested Requirement Update
                                </p>
                                <p style={styles.bodyText}>
                                  {reviewAgentPendingRequirementUpdate}
                                </p>
                                <button
                                  onClick={() =>
                                    applyReviewAgentRequirementUpdate(
                                      reviewAgentPendingRequirementUpdate,
                                    )
                                  }
                                  style={{
                                    ...styles.button,
                                    marginTop: "12px",
                                  }}
                                >
                                  Apply to Requirement
                                </button>
                              </div>
                            )}

                            <div style={styles.reviewAgentComposer}>
                              <textarea
                                value={reviewAgentMessage}
                                onChange={(e) =>
                                  setReviewAgentMessage(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (
                                    (e.metaKey || e.ctrlKey) &&
                                    e.key === "Enter"
                                  ) {
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
                                    opacity:
                                      reviewAgentThinking || loading ? 0.65 : 1,
                                    cursor:
                                      reviewAgentThinking || loading
                                        ? "not-allowed"
                                        : "pointer",
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
                                Press Cmd/Ctrl + Enter to send. Use the reviewer
                                tabs above to switch between Architect,
                                Developer, QA, and Delivery Lead.
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
                          Run the agent review board to have the Architect,
                          Developer, QA Lead, and Delivery Lead critique this
                          package.
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
                          Ask about scope, missing requirements, ServiceNow
                          approach, MVP vs phase 2, stakeholder questions,
                          risks, or request updates to the requirement.
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
                                {message.role === "user"
                                  ? "You"
                                  : "Delivery Lead"}
                              </p>

                              <p style={styles.bodyText}>
                                {safeText(message.content)}
                              </p>

                              {message.response?.artifact_type && (
                                <div style={styles.innerCard}>
                                  <p style={styles.label}>Artifact Type</p>
                                  <p style={styles.accentText}>
                                    {safeText(message.response.artifact_type)}
                                  </p>
                                </div>
                              )}

                              {message.response?.artifact_details && (
                                <div style={styles.innerCard}>
                                  <p style={styles.label}>Artifact Details</p>

                                  {message.response.artifact_details.name && (
                                    <p style={styles.bodyText}>
                                      <strong>Name:</strong>{" "}
                                      {safeText(
                                        message.response.artifact_details.name,
                                      )}
                                    </p>
                                  )}

                                  {message.response.artifact_details.table && (
                                    <p style={styles.bodyText}>
                                      <strong>Table:</strong>{" "}
                                      {safeText(
                                        message.response.artifact_details.table,
                                      )}
                                    </p>
                                  )}

                                  {message.response.artifact_details
                                    .trigger && (
                                    <p style={styles.bodyText}>
                                      <strong>Trigger:</strong>{" "}
                                      {safeText(
                                        message.response.artifact_details
                                          .trigger,
                                      )}
                                    </p>
                                  )}

                                  {message.response.artifact_details
                                    .condition && (
                                    <p style={styles.bodyText}>
                                      <strong>Condition:</strong>{" "}
                                      {safeText(
                                        message.response.artifact_details
                                          .condition,
                                      )}
                                    </p>
                                  )}

                                  {safeList(
                                    message.response.artifact_details
                                      .recipients,
                                  ).length > 0 && (
                                    <>
                                      <p style={styles.label}>Recipients</p>
                                      <ul style={styles.list}>
                                        {safeList(
                                          message.response.artifact_details
                                            .recipients,
                                        ).map((item, i) => (
                                          <li key={i}>
                                            <pre style={styles.inlinePre}>
                                              {safeText(item)}
                                            </pre>
                                          </li>
                                        ))}
                                      </ul>
                                    </>
                                  )}

                                  {message.response.artifact_details
                                    .subject && (
                                    <p style={styles.bodyText}>
                                      <strong>Subject:</strong>{" "}
                                      {safeText(
                                        message.response.artifact_details
                                          .subject,
                                      )}
                                    </p>
                                  )}

                                  {message.response.artifact_details.body && (
                                    <>
                                      <p style={styles.label}>Body / Content</p>
                                      <pre style={styles.inlinePre}>
                                        {safeText(
                                          message.response.artifact_details
                                            .body,
                                        )}
                                      </pre>
                                    </>
                                  )}

                                  {safeList(
                                    message.response.artifact_details.steps,
                                  ).length > 0 && (
                                    <>
                                      <p style={styles.label}>Steps</p>
                                      <ol style={styles.list}>
                                        {safeList(
                                          message.response.artifact_details
                                            .steps,
                                        ).map((item, i) => (
                                          <li key={i}>
                                            <pre style={styles.inlinePre}>
                                              {safeText(item)}
                                            </pre>
                                          </li>
                                        ))}
                                      </ol>
                                    </>
                                  )}

                                  {safeList(
                                    message.response.artifact_details.roles,
                                  ).length > 0 && (
                                    <>
                                      <p style={styles.label}>Roles</p>
                                      <ul style={styles.list}>
                                        {safeList(
                                          message.response.artifact_details
                                            .roles,
                                        ).map((item, i) => (
                                          <li key={i}>
                                            <pre style={styles.inlinePre}>
                                              {safeText(item)}
                                            </pre>
                                          </li>
                                        ))}
                                      </ul>
                                    </>
                                  )}

                                  {safeList(
                                    message.response.artifact_details.fields,
                                  ).length > 0 && (
                                    <>
                                      <p style={styles.label}>Fields</p>
                                      <ul style={styles.list}>
                                        {safeList(
                                          message.response.artifact_details
                                            .fields,
                                        ).map((item, i) => (
                                          <li key={i}>
                                            <pre style={styles.inlinePre}>
                                              {safeText(item)}
                                            </pre>
                                          </li>
                                        ))}
                                      </ul>
                                    </>
                                  )}

                                  {message.response.artifact_details
                                    .expected_result && (
                                    <p style={styles.bodyText}>
                                      <strong>Expected Result:</strong>{" "}
                                      {safeText(
                                        message.response.artifact_details
                                          .expected_result,
                                      )}
                                    </p>
                                  )}

                                  {safeList(
                                    message.response.artifact_details.notes,
                                  ).length > 0 && (
                                    <>
                                      <p style={styles.label}>Notes</p>
                                      <ul style={styles.list}>
                                        {safeList(
                                          message.response.artifact_details
                                            .notes,
                                        ).map((item, i) => (
                                          <li key={i}>
                                            <pre style={styles.inlinePre}>
                                              {safeText(item)}
                                            </pre>
                                          </li>
                                        ))}
                                      </ul>
                                    </>
                                  )}

                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        JSON.stringify(
                                          message.response?.artifact_details,
                                          null,
                                          2,
                                        ),
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
                                  {message.response
                                    .delivery_lead_recommendation && (
                                    <div style={styles.innerCard}>
                                      <p style={styles.label}>Recommendation</p>
                                      <p style={styles.bodyText}>
                                        {safeText(
                                          message.response
                                            .delivery_lead_recommendation,
                                        )}
                                      </p>
                                    </div>
                                  )}

                                  {message.response.impacted_sections?.length >
                                    0 && (
                                    <div
                                      style={{
                                        ...styles.innerCard,
                                        marginTop: "12px",
                                      }}
                                    >
                                      <p style={styles.label}>
                                        Impacted Sections
                                      </p>
                                      <ul style={styles.list}>
                                        {message.response.impacted_sections.map(
                                          (item, i) => (
                                            <li key={i}>{safeText(item)}</li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                  {message.response.follow_up_questions
                                    ?.length > 0 && (
                                    <div
                                      style={{
                                        ...styles.innerCard,
                                        marginTop: "12px",
                                      }}
                                    >
                                      <p style={styles.label}>
                                        Follow-Up Questions
                                      </p>
                                      <ul style={styles.list}>
                                        {message.response.follow_up_questions.map(
                                          (item, i) => (
                                            <li key={i}>{safeText(item)}</li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                  {message.response
                                    .suggested_requirement_update && (
                                    <div
                                      style={{
                                        ...styles.riskBox,
                                        marginTop: "12px",
                                      }}
                                    >
                                      <p style={styles.riskTitle}>
                                        Suggested Requirement Update
                                      </p>
                                      <p style={styles.bodyText}>
                                        {safeText(
                                          message.response
                                            .suggested_requirement_update,
                                        )}
                                      </p>
                                    </div>
                                  )}

                                  {message.response.recommended_next_action && (
                                    <p
                                      style={{
                                        ...styles.accentText,
                                        marginTop: "12px",
                                      }}
                                    >
                                      Recommended Next Action:{" "}
                                      {safeText(
                                        message.response
                                          .recommended_next_action,
                                      )}
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

                      <div
                        style={
                          isMobile
                            ? styles.mobileActionRow
                            : styles.exportActions
                        }
                      >
                        <button
                          onClick={askDeliveryLead}
                          disabled={deliveryLeadThinking || loading}
                          style={{
                            ...styles.button,
                            opacity: deliveryLeadThinking || loading ? 0.65 : 1,
                            cursor:
                              deliveryLeadThinking || loading
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {deliveryLeadThinking
                            ? "Thinking..."
                            : "Ask Delivery Lead"}
                        </button>

                        {deliveryLeadPendingRequirementUpdate && (
                          <button
                            onClick={() =>
                              applyDeliveryLeadRequirementUpdate(
                                deliveryLeadPendingRequirementUpdate,
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
                          Export the full delivery package for review, delivery
                          handoff, or copy-paste into your delivery tools.
                        </p>
                      </div>

                      <div
                        style={
                          isMobile
                            ? styles.mobileActionRow
                            : styles.exportActions
                        }
                      >
                        <button
                          onClick={exportMarkdown}
                          style={styles.secondaryButton}
                        >
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
                        <summary style={styles.detailsSummary}>
                          Preview Markdown Export
                        </summary>
                        <pre style={styles.mermaidCodeBlock}>
                          {buildMarkdown(result)}
                        </pre>
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
                    style={
                      message.role === "user"
                        ? styles.chatUserBubble
                        : styles.chatLeadBubble
                    }
                  >
                    <p style={styles.label}>
                      {message.role === "user" ? "You" : "Site Guide"}
                    </p>
                    <p style={styles.bodyText}>{safeText(message.content)}</p>
                  </div>
                ))
              ) : (
                <div style={styles.innerCard}>
                  <p style={styles.bodyText}>
                    I can explain how to use this site: templates, requirement
                    intake, Quick vs Full Package, saved projects, package tabs,
                    technical notes, Delivery Lead chat, and exports.
                  </p>
                  <div style={styles.sitePromptGrid}>
                    <button
                      onClick={() =>
                        setSiteAssistantMessage("How do I use this site?")
                      }
                      style={styles.sitePromptButton}
                    >
                      How do I use this site?
                    </button>
                    <button
                      onClick={() =>
                        setSiteAssistantMessage(
                          "What is Quick Package vs Full Detailed Package?",
                        )
                      }
                      style={styles.sitePromptButton}
                    >
                      Quick vs Full
                    </button>
                    <button
                      onClick={() =>
                        setSiteAssistantMessage(
                          "How do I save and reload projects?",
                        )
                      }
                      style={styles.sitePromptButton}
                    >
                      Save projects
                    </button>
                    <button
                      onClick={() =>
                        setSiteAssistantMessage(
                          "Where do I get technical notes and code guidance?",
                        )
                      }
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
              <button
                onClick={() => setSiteAssistantChat([])}
                style={styles.secondaryButton}
              >
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
      <p style={styles.scoreOutOf}>
        {isValidScore(score) ? "/ 100" : "Unavailable"}
      </p>
    </div>
  );
}

function PlatformFitDecisionCard({
  decision,
  copyValue,
  onCopy,
}: {
  decision: PlatformFitDecision | null;
  copyValue: string;
  onCopy: (value: string) => void;
}) {
  const oobOptions = getOobOptions(decision);

  return (
    <Card
      title="ServiceNow Platform Fit / OOB vs Custom Decision"
      copyValue={copyValue}
      onCopy={onCopy}
    >
      {decision ? (
        <div style={styles.stack}>
          <div style={styles.innerCard}>
            <p style={styles.label}>Recommended Approach</p>
            <p style={styles.accentText}>
              {safeText(decision.recommended_approach) || "Not specified"}
            </p>
            {decision.build_readiness_verdict && (
              <p style={styles.muted}>
                Build readiness: {safeText(decision.build_readiness_verdict)}
              </p>
            )}
          </div>

          <div style={styles.innerCard}>
            <p style={styles.label}>OOB Features / Modules Considered</p>
            {oobOptions.length ? (
              <div style={styles.stack}>
                {oobOptions.map((option, index) => (
                  <div key={index} style={styles.platformFitOption}>
                    <div style={styles.rowBetween}>
                      <p style={styles.itemTitle}>
                        {safeText(
                          option.option ||
                            option.name ||
                            option.module ||
                            option.feature,
                        ) || "ServiceNow option"}
                      </p>
                      <Badge>{safeText(option.fit) || "Fit not stated"}</Badge>
                    </div>
                    <p style={styles.bodyText}>{safeText(option.rationale)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.muted}>
                No OOB/module comparison returned. The architect prompt should
                evaluate Service Catalog, existing task records, licensed modules,
                and App Engine before recommending custom build.
              </p>
            )}
          </div>

          <div style={styles.innerCard}>
            <p style={styles.label}>OOB Fit Assessment</p>
            <p style={styles.bodyText}>
              {safeText(decision.oob_fit_assessment) || "Not provided"}
            </p>
          </div>

          <div style={styles.platformDecisionGrid}>
            <div style={styles.innerCard}>
              <p style={styles.label}>Custom Build Needed</p>
              <p style={styles.accentText}>
                {safeText(decision.custom_build_needed) || "Not specified"}
              </p>
            </div>

            <div style={styles.innerCard}>
              <p style={styles.label}>Licensing Assumptions</p>
              {safeList(decision.licensing_assumptions).length ? (
                <ul style={styles.list}>
                  {safeList(decision.licensing_assumptions).map((item, index) => (
                    <li key={index}>{safeText(item)}</li>
                  ))}
                </ul>
              ) : (
                <p style={styles.muted}>Not provided.</p>
              )}
            </div>
          </div>

          <div style={styles.platformDecisionGrid}>
            <div style={styles.innerCard}>
              <p style={styles.label}>Customization Required</p>
              {safeList(
                decision.customization_required || decision.customization_summary,
              ).length ? (
                <ul style={styles.list}>
                  {safeList(
                    decision.customization_required ||
                      decision.customization_summary,
                  ).map((item, index) => (
                    <li key={index}>{safeText(item)}</li>
                  ))}
                </ul>
              ) : (
                <p style={styles.muted}>Not provided.</p>
              )}
            </div>

            <div style={styles.innerCard}>
              <p style={styles.label}>Upgrade Impact</p>
              {safeList(decision.upgrade_impact).length ? (
                <ul style={styles.list}>
                  {safeList(decision.upgrade_impact).map((item, index) => (
                    <li key={index}>{safeText(item)}</li>
                  ))}
                </ul>
              ) : (
                <p style={styles.muted}>Not provided.</p>
              )}
            </div>
          </div>

          <div style={styles.innerCard}>
            <p style={styles.label}>Technical Debt / Maintenance Impact</p>
            {safeList(decision.technical_debt).length ? (
              <div style={styles.stack}>
                {safeList(decision.technical_debt).map(
                  (item: TechnicalDebtItem, index) => (
                    <div key={index} style={styles.riskBox}>
                      <p style={styles.riskTitle}>
                        {safeText(item.item) || "Technical debt item"} · {safeText(item.level) || "Level not stated"}
                      </p>
                      <p style={styles.bodyText}>
                        <strong>Impact:</strong> {safeText(item.impact)}
                      </p>
                      <p style={styles.bodyText}>
                        <strong>Mitigation:</strong> {safeText(item.mitigation)}
                      </p>
                    </div>
                  ),
                )}
              </div>
            ) : safeList(decision.maintenance_impact).length ? (
              <ul style={styles.list}>
                {safeList(decision.maintenance_impact).map((item, index) => (
                  <li key={index}>{safeText(item)}</li>
                ))}
              </ul>
            ) : (
              <p style={styles.muted}>Not provided.</p>
            )}
          </div>

          <div style={styles.platformDecisionGrid}>
            <div style={styles.innerCard}>
              <p style={styles.label}>Pros</p>
              {safeList(decision.pros).length ? (
                <ul style={styles.list}>
                  {safeList(decision.pros).map((item, index) => (
                    <li key={index}>{safeText(item)}</li>
                  ))}
                </ul>
              ) : (
                <p style={styles.muted}>Not provided.</p>
              )}
            </div>

            <div style={styles.innerCard}>
              <p style={styles.label}>Cons</p>
              {safeList(decision.cons).length ? (
                <ul style={styles.list}>
                  {safeList(decision.cons).map((item, index) => (
                    <li key={index}>{safeText(item)}</li>
                  ))}
                </ul>
              ) : (
                <p style={styles.muted}>Not provided.</p>
              )}
            </div>
          </div>

          <div style={styles.innerCard}>
            <p style={styles.label}>Final Recommendation</p>
            <p style={styles.bodyText}>
              {safeText(decision.final_recommendation) || "Not provided"}
            </p>
          </div>
        </div>
      ) : (
        <div style={styles.stack}>
          <div style={styles.riskBox}>
            <p style={styles.riskTitle}>Platform-fit decision missing</p>
            <p style={styles.bodyText}>
              The backend did not return an OOB vs Custom decision. Add
              platform_fit_decision to the architect output so every package
              evaluates OOB modules, Service Catalog, existing tables, licensing,
              technical debt, maintenance impact, and upgrade impact before
              recommending custom build.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}


function BuildReadinessGateCard({
  gate,
  onCopy,
}: {
  gate: BuildReadinessGate | null;
  onCopy: (value: string) => void;
}) {
  const verdict = safeText(gate?.verdict) || "Not provided";
  const isBlocked =
    verdict.toLowerCase().includes("needs discovery") ||
    verdict.toLowerCase().includes("not ready");

  return (
    <Card
      title="Build Readiness Gate"
      copyValue={buildReadinessGateMarkdown({ build_readiness_gate: gate } as any)}
      onCopy={onCopy}
    >
      {gate ? (
        <div style={styles.stack}>
          <div
            style={{
              ...styles.innerCard,
              background: isBlocked ? "#FFF7ED" : "#F8FAFC",
              borderColor: isBlocked ? "#FDBA74" : "#CBD5E1",
            }}
          >
            <div style={styles.rowBetween}>
              <div>
                <p style={styles.label}>Verdict</p>
                <p
                  style={{
                    ...styles.accentText,
                    color: isBlocked ? "#9A3412" : "#2563EB",
                  }}
                >
                  {verdict}
                </p>
              </div>
              <Badge>
                Safe to generate code: {safeText(gate.safe_to_generate_code)}
              </Badge>
            </div>
            <p style={styles.bodyText}>{safeText(gate.reason)}</p>
          </div>

          <div style={styles.innerCard}>
            <p style={styles.label}>Must Resolve Before Build</p>
            {safeList(gate.must_resolve_before_build).length ? (
              <ul style={styles.list}>
                {safeList(gate.must_resolve_before_build).map((item, index) => (
                  <li key={index}>{safeText(item)}</li>
                ))}
              </ul>
            ) : (
              <p style={styles.muted}>No blockers returned.</p>
            )}
          </div>
        </div>
      ) : (
        <p style={styles.muted}>
          No build-readiness gate was returned by the backend.
        </p>
      )}
    </Card>
  );
}

function SensitiveDataControlsCard({
  controls,
  onCopy,
}: {
  controls: SensitiveDataControls | null;
  onCopy: (value: string) => void;
}) {
  return (
    <Card
      title="Sensitive Data Controls"
      copyValue={sensitiveDataControlsMarkdown({ sensitive_data_controls: controls } as any)}
      onCopy={onCopy}
    >
      {controls ? (
        <div style={styles.stack}>
          <div style={styles.innerCard}>
            <div style={styles.rowBetween}>
              <div>
                <p style={styles.label}>Sensitive Data Present</p>
                <p style={styles.accentText}>
                  {safeText(controls.sensitive_data_present) || "Not provided"}
                </p>
              </div>
              <Badge>{safeList(controls.data_types).length} data types</Badge>
            </div>
            {safeList(controls.data_types).length > 0 && (
              <ul style={styles.list}>
                {safeList(controls.data_types).map((item, index) => (
                  <li key={index}>{safeText(item)}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={styles.platformDecisionGrid}>
            <div style={styles.innerCard}>
              <p style={styles.label}>Field-Level Security</p>
              <ul style={styles.list}>
                {safeList(controls.field_level_security).length
                  ? safeList(controls.field_level_security).map((item, index) => (
                      <li key={index}>{safeText(item)}</li>
                    ))
                  : <li>Not provided.</li>}
              </ul>
            </div>

            <div style={styles.innerCard}>
              <p style={styles.label}>Attachment Security</p>
              <ul style={styles.list}>
                {safeList(controls.attachment_security).length
                  ? safeList(controls.attachment_security).map((item, index) => (
                      <li key={index}>{safeText(item)}</li>
                    ))
                  : <li>Not provided.</li>}
              </ul>
            </div>
          </div>

          <div style={styles.platformDecisionGrid}>
            <div style={styles.innerCard}>
              <p style={styles.label}>Notification Privacy</p>
              <ul style={styles.list}>
                {safeList(controls.notification_privacy).length
                  ? safeList(controls.notification_privacy).map((item, index) => (
                      <li key={index}>{safeText(item)}</li>
                    ))
                  : <li>Not provided.</li>}
              </ul>
            </div>

            <div style={styles.innerCard}>
              <p style={styles.label}>Audit / Retention / Masking</p>
              <ul style={styles.list}>
                {[...safeList(controls.audit_retention), ...safeList(controls.encryption_or_masking)].length
                  ? [...safeList(controls.audit_retention), ...safeList(controls.encryption_or_masking)].map((item, index) => (
                      <li key={index}>{safeText(item)}</li>
                    ))
                  : <li>Not provided.</li>}
              </ul>
            </div>
          </div>

          {safeList(controls.open_questions).length > 0 && (
            <div style={styles.innerCard}>
              <p style={styles.label}>Open Security Questions</p>
              <ul style={styles.list}>
                {safeList(controls.open_questions).map((item, index) => (
                  <li key={index}>{safeText(item)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p style={styles.muted}>
          No sensitive-data control assessment was returned by the backend.
        </p>
      )}
    </Card>
  );
}

function PlatformObjectAccuracyCard({
  notes,
  onCopy,
}: {
  notes: any[];
  onCopy: (value: string) => void;
}) {
  return (
    <Card
      title="Platform Object Accuracy Notes"
      copyValue={platformObjectAccuracyMarkdown({ platform_object_accuracy_notes: notes } as any)}
      onCopy={onCopy}
    >
      {notes.length ? (
        <ul style={styles.list}>
          {notes.map((item, index) => (
            <li key={index}>{safeText(item)}</li>
          ))}
        </ul>
      ) : (
        <p style={styles.muted}>
          No platform-object accuracy notes returned. The backend should flag
          request/RITM vs task vs approval vs case modeling decisions here.
        </p>
      )}
    </Card>
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
        <p style={styles.muted}>
          Run the agent review board to see this reviewer feedback.
        </p>
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

  packageCommandBar: {
    background: "rgba(255,255,255,0.95)",
    border: "1px solid #CBD5E1",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 16px 42px rgba(15, 23, 42, 0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    marginBottom: "14px",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  packageCommandLeft: {
    minWidth: 0,
  },
  packageTitleCompact: {
    margin: "2px 0 8px",
    fontSize: "24px",
    lineHeight: 1.2,
    fontWeight: 900,
    color: "#0F172A",
    letterSpacing: "-0.03em",
  },
  packagePillRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  softPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    background: "#EFF6FF",
    color: "#1D4ED8",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 850,
  },
  warningPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    background: "#FFF7ED",
    color: "#9A3412",
    border: "1px solid #FDBA74",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 850,
  },
  packageCommandActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  tertiaryButton: {
    border: "0",
    borderRadius: "12px",
    background: "#F1F5F9",
    color: "#334155",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  regenerationNotice: {
    border: "1px solid #F59E0B",
    background: "#FFFBEB",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    marginBottom: "14px",
  },
  overviewHeroGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "14px",
  },
  nextStepGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
  },
  nextStepCardButton: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    borderRadius: "18px",
    padding: "16px",
    textAlign: "left",
    color: "#334155",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minHeight: "130px",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  inlineLinkButton: {
    border: "0",
    background: "transparent",
    color: "#2563EB",
    padding: 0,
    marginTop: "8px",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
    textAlign: "left",
  },
  stackSmall: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  decisionMiniCard: {
    border: "1px solid #E2E8F0",
    background: "#F8FAFC",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  compactScoreRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "12px",
  },
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
    background:
      "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 45%, #F5F3FF 100%)",
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
  clearFilesButton: {
    border: "1px solid #CBD5E1",
    borderRadius: "999px",
    background: "#FFFFFF",
    color: "#B91C1C",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
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

  onboardingCard: {
    background: "rgba(255,255,255,0.96)",
    border: "1px solid #BFDBFE",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 16px 42px rgba(37, 99, 235, 0.10)",
    marginBottom: "22px",
  },
  onboardingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  },
  onboardingStep: {
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    padding: "16px",
  },
  onboardingStepNumber: {
    margin: "0 0 10px",
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    background: "#DBEAFE",
    color: "#1D4ED8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
  },
  onboardingStepTitle: {
    margin: "0 0 6px",
    color: "#0F172A",
    fontSize: "15px",
    fontWeight: 900,
  },
  projectUtilityGrid: {
    display: "grid",
    gridTemplateColumns: "220px 1fr auto",
    gap: "14px",
    alignItems: "end",
    marginTop: "16px",
  },
  comparePanel: {
    marginTop: "16px",
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    padding: "18px",
  },
  regenerationNotice: {
    marginBottom: "20px",
    padding: "16px",
    borderRadius: "18px",
    border: "1px solid #FACC15",
    background: "#FFFBEB",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
  },
  packageSummaryActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "14px",
  },

  workspaceCommandBar: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #CBD5E1",
    borderRadius: "22px",
    padding: "18px 20px",
    boxShadow: "0 14px 36px rgba(15, 23, 42, 0.07)",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
  },
  commandBarTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 850,
    letterSpacing: "-0.02em",
    color: "#0F172A",
  },
  commandBarActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  workspaceSelect: {
    minWidth: "260px",
    border: "1px solid #CBD5E1",
    borderRadius: "14px",
    background: "#FFFFFF",
    color: "#1D4ED8",
    padding: "14px 16px",
    fontSize: "15px",
    fontWeight: 850,
    outline: "none",
    cursor: "pointer",
  },
  activeUtilityButton: {
    border: "1px solid #2563EB",
    borderRadius: "14px",
    background: "#EFF6FF",
    color: "#1D4ED8",
    padding: "14px 22px",
    fontSize: "15px",
    fontWeight: 850,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.14)",
  },
  compactPanel: {
    background: "rgba(255,255,255,0.96)",
    border: "1px solid #CBD5E1",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 16px 42px rgba(15, 23, 42, 0.08)",
    marginBottom: "18px",
  },
  statusBanner: {
    background:
      "linear-gradient(135deg, rgba(239,246,255,0.95), rgba(245,243,255,0.95))",
    border: "1px solid #BFDBFE",
    borderRadius: "22px",
    padding: "18px 20px",
    boxShadow: "0 14px 38px rgba(37, 99, 235, 0.10)",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
  },
  statusTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: "1.2",
    fontWeight: 900,
    color: "#0F172A",
    letterSpacing: "-0.03em",
  },
  statusFlow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(110px, 1fr))",
    gap: "10px",
    minWidth: "520px",
  },
  mobileStatusFlow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    width: "100%",
  },
  statusStep: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    color: "#334155",
    borderRadius: "999px",
    padding: "11px 14px",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },
  statusStepActive: {
    border: "1px solid #2563EB",
    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
    color: "#FFFFFF",
    borderRadius: "999px",
    padding: "11px 14px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(37, 99, 235, 0.22)",
  },
  simpleProjectControls: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "14px",
    alignItems: "end",
  },
  savedProjectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },
  savedProjectCard: {
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  savedProjectCardActive: {
    border: "1px solid #2563EB",
    background: "#EFF6FF",
  },
  savedProjectLoadButton: {
    border: "0",
    background: "transparent",
    padding: 0,
    textAlign: "left",
    cursor: "pointer",
    width: "100%",
  },
  versionControlRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "14px",
    alignItems: "end",
  },
  versionList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  versionRow: {
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
    cursor: "pointer",
  },
  versionRowActive: {
    border: "1px solid #2563EB",
    background: "#EFF6FF",
  },
  versionMetaGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  versionMeta: {
    borderRadius: "999px",
    border: "1px solid #CBD5E1",
    background: "#F8FAFC",
    color: "#334155",
    padding: "5px 9px",
    fontSize: "12px",
    fontWeight: 800,
  },
  platformDecisionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  platformFitOption: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "16px",
    padding: "14px",
  },

};
