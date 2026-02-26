import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

type Issue = {
  element: string;
  status: string;
  detail: string;
};

const STATUS_CONFIG = {
  compliant: {
    icon: <CheckCircle size={15} className="text-green-600 flex-shrink-0 mt-0.5" />,
    labelClass: 'text-green-700',
  },
  needs_attention: {
    icon: <AlertCircle size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />,
    labelClass: 'text-yellow-700',
  },
  violation: {
    icon: <XCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />,
    labelClass: 'text-red-700',
  },
};

export function IssuesList({ issues }: { issues: Issue[] }) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Assessment Details
      </h3>
      {issues.map((issue, i) => {
        const config = STATUS_CONFIG[issue.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.needs_attention;
        return (
          <div key={i} className="bg-white rounded border border-gray-100 p-3 flex gap-2">
            {config.icon}
            <div className="min-w-0">
              <p className={`text-xs font-semibold ${config.labelClass}`}>{issue.element}</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{issue.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
