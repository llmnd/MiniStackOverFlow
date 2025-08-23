import { useEffect, useState } from 'react';
import VoteButtons from './VoteButtons';
import CommentList from './CommentList';
import { API_BASE_URL } from '../constants/api';
import { useAuth } from '../hooks/useAuth';

interface Answer {
  id: string;
  content: string;
  author: {
    username: string;
  };
  createdAt: string;
  votes: {
    value: number;
  }[];
  isAccepted: boolean;
}

interface AnswerListProps {
  questionId: string;
  questionAuthorId?: number;
}

export default function AnswerList({ questionId, questionAuthorId }: Readonly<AnswerListProps>) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/answers/question/${questionId}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch answers');
        }
        const data = await response.json();
        setAnswers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnswers();
  }, [questionId]);

  if (loading) {
    return <div>Loading answers...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{answers.length} Answers</h2>
      <div className="space-y-6">
        {answers.map((answer) => (
          <div
            key={answer.id}
            className={`bg-white rounded-lg shadow p-6 ${
              answer.isAccepted ? 'border-2 border-green-500' : ''
            }`}
          >
            <div className="flex gap-4">
              <VoteButtons
                answerId={answer.id}
                totalVotes={answer.votes.reduce((acc, vote) => acc + vote.value, 0)}
              />
              <div className="flex-1">
                <div className="prose max-w-none">{answer.content}</div>
                <div className="mt-4 text-gray-600 text-sm">
                  Answered by {answer.author.username} on{' '}
                  {new Date(answer.createdAt).toLocaleDateString()}
                </div>
                {answer.isAccepted && (
                  <div className="mt-2 text-green-600 font-semibold">
                    ✓ Accepted Answer
                  </div>
                )}
                {!answer.isAccepted && user?.id === questionAuthorId && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `${API_BASE_URL}/api/answers/${answer.id}/accept`,
                          {
                            method: 'PATCH',
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem('token')}`,
                            },
                          }
                        );
                        if (!response.ok) throw new Error('Failed to accept answer');
                        const updatedAnswer = await response.json();
                        setAnswers(answers.map(a => 
                          a.id === updatedAnswer.id ? { ...a, isAccepted: true } : a
                        ));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to accept answer');
                      }
                    }}
                    className="mt-2 text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Accept this answer
                  </button>
                )}
                <CommentList answerId={answer.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
