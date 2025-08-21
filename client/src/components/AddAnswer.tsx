import { useState } from 'react';
import MarkdownEditor from './MarkdownEditor';

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
      const response = await fetch('http://localhost:5000/api/answers', {
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Your Answer</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Your Answer'}
          </button>
        </div>
      </form>
    </div>
  );
}
