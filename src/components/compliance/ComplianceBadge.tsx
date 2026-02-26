import { CheckCircle, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

type Status = 'compliant' | 'needs_attention' | 'violation' | 'inconclusive' | 'pending';

const CONFIG: Record<Status, { label: string; icon: React.ReactNode; className: string }> = {
  compliant: {
    label: 'Compliant',
    icon: <CheckCircle size={18} />,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  needs_attention: {
    label: 'Needs Attention',
    icon: <AlertCircle size={18} />,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  violation: {
    label: 'Violation Detected',
    icon: <XCircle size={18} />,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  inconclusive: {
    label: 'Inconclusive',
    icon: <HelpCircle size={18} />,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  pending: {
    label: 'Analyzing...',
    icon: <HelpCircle size={18} />,
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

export function ComplianceBadge({ status }: { status: Status }) {
  const config = CONFIG[status] ?? CONFIG.inconclusive;
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border font-medium text-sm ${config.className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
