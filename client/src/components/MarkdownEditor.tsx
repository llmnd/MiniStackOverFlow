import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  id,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 transition-colors duration-200">
      <div className="flex border-b border-gray-300 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setIsPreview(false)}
          className={`px-4 py-2 text-gray-700 dark:text-gray-300 transition-colors duration-200 ${
            !isPreview ? 'bg-gray-100 dark:bg-gray-700 border-b-2 border-blue-500 dark:border-blue-400' : ''
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setIsPreview(true)}
          className={`px-4 py-2 text-gray-700 dark:text-gray-300 transition-colors duration-200 ${
            isPreview ? 'bg-gray-100 dark:bg-gray-700 border-b-2 border-blue-500 dark:border-blue-400' : ''
          }`}
        >
          Preview
        </button>
      </div>

      <div className="p-4">
        {isPreview ? (
          <div className="prose dark:prose-invert max-w-none min-h-[200px]">
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 dark:text-gray-500">Nothing to preview</p>
            )}
          </div>
        ) : (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-[200px] focus:outline-none resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            rows={8}
          />
        )}
      </div>

      {!isPreview && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
          Markdown is supported
        </div>
      )}
    </div>
  );
}
