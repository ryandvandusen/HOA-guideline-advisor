export type ComplianceStatus = 'compliant' | 'needs_attention' | 'violation' | 'pending' | 'inconclusive';

export type ComplianceIssue = {
  element: string;
  status: 'compliant' | 'needs_attention' | 'violation';
  detail: string;
};

export type Submission = {
  id: string;
  photo_path: string | null;
  session_messages: string; // JSON string of ChatMessage[]
  compliance_status: ComplianceStatus;
  ai_summary: string | null;
  issues_found: string; // JSON string of ComplianceIssue[]
  guideline_slug: string | null;
  created_at: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};
