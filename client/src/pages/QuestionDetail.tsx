import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AnswerList from '../components/AnswerList';
import VoteButtons from '../components/VoteButtons';
import AddAnswer from '../components/AddAnswer';

interface Question {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
  };
  createdAt: string;
  votes: {
    value: number;
  }[];
  tags: {
    tag: {
      name: string;
    };
  }[];
}

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/questions/${id}`);
        if (!response.ok) {
          throw new Error('Question not found');
        }
        const data = await response.json();
        setQuestion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuestion();
    }
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (error || !question) {
    return <div className="flex justify-center p-8 text-red-500">{error || 'Question not found'}</div>;
  }

  const totalVotes = question.votes.reduce((acc, vote) => acc + vote.value, 0);

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <Link to="/questions" className="text-blue-500 hover:underline mb-4 block">
          ← Back to Questions
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex gap-4">
          <VoteButtons
            questionId={question.id}
            totalVotes={totalVotes}
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{question.title}</h1>
            <div className="prose max-w-none mb-4">{question.content}</div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags.map(({ tag }) => (
                <span
                  key={tag.name}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                >
                  {tag.name}
                </span>
              ))}
            </div>

            <div className="text-gray-600 text-sm">
              Asked by {question.author.username} on{' '}
              {new Date(question.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <AnswerList questionId={question.id} />
      </div>

      <div className="mt-8">
        <AddAnswer questionId={question.id} />
      </div>
    </div>
  );
}
