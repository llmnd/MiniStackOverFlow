import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';
import { useAuth } from '../hooks/useAuth';

interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
  };
  createdAt: string;
}

interface CommentListProps {
  answerId: string;
}

export default function CommentList({ answerId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const { user, token } = useAuth();

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/comments?answerId=${answerId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [answerId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment,
          answerId: parseInt(answerId),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      await fetchComments(); // Refresh comments
      setNewComment(''); // Clear input
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    }
  };

  if (loading) return <div>Loading comments...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="text-lg font-semibold mb-2">Comments</h3>
      
      <div className="space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2 text-sm text-gray-700">
            <span className="font-medium">{comment.author.username}:</span>
            <span>{comment.content}</span>
            <span className="text-gray-500">
              - {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      {user && (
        <form onSubmit={handleSubmitComment} className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!newComment.trim()}
            >
              Comment
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
