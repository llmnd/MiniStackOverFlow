import { useState } from 'react';
import MarkdownEditor from './MarkdownEditor';
import { API_BASE_URL } from '../constants/api';

interface AddAnswerProps {
  questionId: string;
}

export default function AddAnswer({ questionId }: AddAnswerProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Answer content is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
    const response = await fetch(`${API_BASE_URL}/api/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content,
          questionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post answer');
      }

      // Clear form and reload page to show new answer
      setContent('');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Your Answer</h2>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Write your answer here..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
          >
            {submitting ? 'Posting...' : 'Post Your Answer'}
          </button>
        </div>
      </form>
    </div>
  );
}
