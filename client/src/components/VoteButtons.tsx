import { useState } from 'react';

interface VoteButtonsProps {
  questionId?: string;
  answerId?: string;
  totalVotes: number;
}

export default function VoteButtons({
  questionId,
  answerId,
  totalVotes,
}: VoteButtonsProps) {
  const [votes, setVotes] = useState(totalVotes);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [loading, setLoading] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const endpoint = questionId
        ? `http://localhost:5000/api/votes/question/${questionId}`
        : `http://localhost:5000/api/votes/answer/${answerId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ value }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      // If clicking the same vote button again, remove the vote
      if (userVote === value) {
        setVotes(votes - value);
        setUserVote(0);
      } else {
        // If changing vote, need to account for previous vote
        setVotes(votes - userVote + value);
        setUserVote(value);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`p-2 rounded hover:bg-gray-100 ${
          userVote === 1 ? 'text-orange-500' : 'text-gray-600'
        }`}
      >
        ▲
      </button>
      <span className="font-medium text-lg">{votes}</span>
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`p-2 rounded hover:bg-gray-100 ${
          userVote === -1 ? 'text-orange-500' : 'text-gray-600'
        }`}
      >
        ▼
      </button>
    </div>
  );
}
