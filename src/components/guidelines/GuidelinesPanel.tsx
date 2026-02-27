'use client';

export function GuidelinesPanel() {
  return (
    <div className="w-full" style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}>
      <iframe
        src="/api/guidelines/pdf"
        className="w-full h-full rounded-xl border border-gray-200"
        title="HOA Design Guidelines"
      />
    </div>
  );
}
