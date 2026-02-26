export type ReportStatus = 'pending' | 'investigating' | 'resolved';

export type ViolationReport = {
  id: string;
  property_address: string;
  description: string;
  photo_path: string | null;
  reporter_notes: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
};
