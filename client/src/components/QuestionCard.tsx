interface QuestionCardProps {
  title: string;
  content: string;
  votes: number;
  answers: number;
  tags: string[];
  author: string;
  timeAgo: string;
}

const QuestionCard = ({ title, content, votes, answers, tags, author, timeAgo }: QuestionCardProps) => {
  return (
    <div className="border-b border-gray-800 pb-6 mb-6 hover:bg-gray-800/30 transition-all duration-300 rounded-xl p-4">
      <div className="flex items-start space-x-6">
        {/* Votes */}
        <div className="flex flex-col items-center space-y-2">
          <button className="text-gray-400 hover:text-blue-400 transition-colors p-1 hover:bg-gray-800 rounded">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className="text-xl font-bold text-blue-400">{votes}</span>
          <button className="text-gray-400 hover:text-blue-400 transition-colors p-1 hover:bg-gray-800 rounded">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Question Content */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-blue-400 hover:text-blue-300 mb-3 transition-colors">
            <a href="#">{title}</a>
          </h3>
          <p className="text-gray-300 mb-4 leading-relaxed">
            {content}
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="px-3 py-1 rounded-full bg-blue-900/50 text-blue-300 hover:bg-blue-800/50 transition-colors duration-300 text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-400">
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
