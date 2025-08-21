import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="flex border-b border-gray-300">
        <button
          type="button"
          onClick={() => setIsPreview(false)}
          className={`px-4 py-2 ${
            !isPreview ? 'bg-gray-100 border-b-2 border-blue-500' : ''
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setIsPreview(true)}
          className={`px-4 py-2 ${
            isPreview ? 'bg-gray-100 border-b-2 border-blue-500' : ''
          }`}
        >
          Preview
        </button>
      </div>

      <div className="p-4">
        {isPreview ? (
          <div className="prose max-w-none min-h-[200px]">
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-gray-400">Nothing to preview</p>
            )}
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-[200px] focus:outline-none resize-y"
            rows={8}
          />
        )}
      </div>

      {!isPreview && (
        <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
          Markdown is supported
        </div>
      )}
    </div>
  );
}
