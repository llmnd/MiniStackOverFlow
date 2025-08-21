import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import Sidebar from '../components/Sidebar';

interface Question {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
  };
  createdAt: string;
  _count: {
    answers: number;
    votes: number;
  };
  tags: {
    tag: {
      name: string;
    };
  }[];
}

export default function Questions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/questions');
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">All Questions</h1>
          <Link
            to="/questions/ask"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Ask Question
          </Link>
        </div>

        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      </main>
    </div>
  );
}
