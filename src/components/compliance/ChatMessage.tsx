import { Bot, User } from 'lucide-react';

type Props = {
  role: 'user' | 'assistant';
  content: string;
};

/** Parse inline markdown: **bold**, *italic* */
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/** Render a block of lines as either a list or a paragraph */
function renderBlock(lines: string[], key: number, isFirst: boolean) {
  const listLines = lines.filter((l) => /^[-•]\s+/.test(l));
  const numberedLines = lines.filter((l) => /^\d+\.\s+/.test(l));

  if (listLines.length === lines.length) {
    return (
      <ul key={key} className={`list-disc pl-5 space-y-0.5 ${isFirst ? '' : 'mt-2'}`}>
        {lines.map((line, i) => (
          <li key={i}>{parseInline(line.replace(/^[-•]\s+/, ''))}</li>
        ))}
      </ul>
    );
  }

  if (numberedLines.length === lines.length) {
    return (
      <ol key={key} className={`list-decimal pl-5 space-y-0.5 ${isFirst ? '' : 'mt-2'}`}>
        {lines.map((line, i) => (
          <li key={i}>{parseInline(line.replace(/^\d+\.\s+/, ''))}</li>
        ))}
      </ol>
    );
  }

  return (
    <p key={key} className={isFirst ? '' : 'mt-2'}>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {parseInline(line)}
        </span>
      ))}
    </p>
  );
}

function MarkdownContent({ text }: { text: string }) {
  // Split on double newlines to get blocks, then render each
  const rawBlocks = text.split(/\n{2,}/);
  return (
    <>
      {rawBlocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim() !== '');
        if (lines.length === 0) return null;
        return renderBlock(lines, i, i === 0);
      })}
    </>
  );
}

export function ChatMessage({ role, content }: Props) {
  const isAssistant = role === 'assistant';
  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAssistant ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {isAssistant ? <Bot size={16} /> : <User size={16} />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAssistant
            ? 'bg-brand-50 text-gray-800 rounded-tl-sm'
            : 'bg-gray-800 text-white rounded-tr-sm'
        }`}
      >
        {isAssistant ? <MarkdownContent text={content} /> : content}
      </div>
    </div>
  );
}
