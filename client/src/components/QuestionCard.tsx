import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import VoteButtons from './VoteButtons';

interface QuestionCardProps {
  question: {
    id: number;
    title: string;
    content: string;
    authorId: number;
    createdAt: string;
    updatedAt: string;
    author: {
      id: number;
      username: string;
      email?: string;
      avatar?: string;
    };
    _count?: {
      answers?: number;
      votes?: number;
    };
    tags: {
      tag: {
        name: string;
      };
    }[];
    answers: Array<{
      id: number;
      content: string;
      authorId: number;
      author: {
        id: number;
        username: string;
      };
    }>;
  };
}

const QuestionCard = ({ question }: QuestionCardProps) => {
  console.log('QuestionCard rendering with:', JSON.stringify(question, null, 2));

  const navigate = useNavigate();

  const onTagClick = (tagName: string) => {
    navigate(`/questions?tag=${encodeURIComponent(tagName)}`);
  };

  // Defensive defaults for nested fields that may be missing when QuestionCard
  // is used in different contexts (e.g. Profile page where relation loading may differ).
  const authorName = question.author?.username ?? 'unknown';
  const displayCreatedAt = question.createdAt ?? new Date().toISOString();
  const answersCount = question._count?.answers ?? 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
      <div className="p-6 flex items-start space-x-6">
        {/* Votes */}
        <div className="min-w-[60px]">
          <VoteButtons
            questionId={question.id.toString()}
            totalVotes={question._count?.votes ?? 0}
          />
        </div>

        {/* Question Content */}
        <div className="flex-1 space-y-4">
          <Link to={`/questions/${question.id}`} className="block group">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {question.title}
            </h2>
          </Link>
          
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 line-clamp-2">
            <ReactMarkdown>{question.content}</ReactMarkdown>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
              {(question.tags ?? []).map(({ tag }) => (
                <button
                  key={tag?.name}
                  onClick={() => onTagClick(tag?.name ?? '')}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  {tag?.name}
                </button>
              ))}
          </div>

          {/* Author & Stats */}
          <div className="pt-4 mt-4 border-t dark:border-gray-700 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <Avatar src={question.author?.avatar ?? null} name={authorName} size={24} className="w-6 h-6" />
              <div className="text-gray-600 dark:text-gray-400">
                <span>Asked by </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{authorName}</span>
                <span className="mx-2">•</span>
                <time className="text-gray-500" dateTime={question.createdAt}>
                  {new Date(displayCreatedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </time>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span>{answersCount} answers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
