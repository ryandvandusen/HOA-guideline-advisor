'use client';

export function GuidelinesPanel() {
  return (
    <div className="w-full" style={{ height: 'calc(100vh - 160px)', minHeight: '400px' }}>
      <iframe
        src="/hoa-guidelines.pdf"
        className="w-full h-full rounded-xl border border-gray-200"
        title="HOA Design Guidelines"
      />
    </div>
  );
}
