import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface QuestionCardProps {
  title: string;
  content: string;
  votes: number;
  answers: number;
  tags: string[];
  author: string;
  timeAgo: string;
}

const QuestionCard = ({ title, content, votes: initialVotes, answers, tags, author, timeAgo }: QuestionCardProps) => {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const handleVote = (type: 'up' | 'down') => {
    if (userVote === type) {
      setVotes(v => v + (type === 'up' ? -1 : 1));
      setUserVote(null);
    } else {
      setVotes(v => v + (type === 'up' ? 1 : -1) + (userVote ? (userVote === 'up' ? -1 : 1) : 0));
      setUserVote(type);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-4 hover:border-blue-200 transition-all duration-300">
      <div className="flex items-start space-x-6">
        {/* Votes */}
        <div className="flex flex-col items-center space-y-1">
          <button 
            onClick={() => handleVote('up')}
            className={`vote-button ${userVote === 'up' ? 'text-green-500' : 'text-gray-400'} hover:text-green-600 transition-colors p-1 rounded focus:outline-none`}
            aria-label="Vote pour"
          >
            ▲
          </button>
          <span className={`text-lg font-semibold ${userVote ? (userVote === 'up' ? 'text-green-500' : 'text-red-500') : 'text-gray-700'}`}>
            {votes}
          </span>
          <button 
            onClick={() => handleVote('down')}
            className={`vote-button ${userVote === 'down' ? 'text-red-500' : 'text-gray-400'} hover:text-red-600 transition-colors p-1 rounded focus:outline-none`}
            aria-label="Vote contre"
          >
            ▼
          </button>
        </div>

        {/* Question Content */}
        <div className="flex-1">
          <Link to="#" className="block">
            <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 mb-3 transition-colors">
              {title}
            </h3>
          </Link>
          <div className="text-gray-600 mb-4 prose prose-sm max-w-none">
            <ReactMarkdown>{content.length > 200 ? `${content.substring(0, 200)}...` : content}</ReactMarkdown>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="tag hover:bg-yellow-100 cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{answers} réponses</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>Posée il y a {timeAgo} par</span>
              <a href="#" className="text-blue-400 hover:text-blue-300 ml-1 font-medium">{author}</a>
            </div>
            <div className="flex items-center text-sm">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-900/30 text-purple-300">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                </svg>
                {answers} {answers === 1 ? 'réponse' : 'réponses'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
