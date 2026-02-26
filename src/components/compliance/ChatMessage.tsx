import { Bot, User } from 'lucide-react';

type Props = {
  role: 'user' | 'assistant';
  content: string;
};

export function ChatMessage({ role, content }: Props) {
  const isAssistant = role === 'assistant';
  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAssistant ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {isAssistant ? <Bot size={16} /> : <User size={16} />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isAssistant
            ? 'bg-blue-50 text-gray-800 rounded-tl-sm'
            : 'bg-gray-800 text-white rounded-tr-sm'
        }`}
      >
        {content}
      </div>
    </div>
  );
}
