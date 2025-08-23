import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import { useAuth } from '../hooks/useAuth';
import { fetchWithAuth } from '../utils/api';

interface Tag {
  name: string;
}

type Domain = 'JavaScript' | 'Python' | 'Java' | 'C++' | 'React' | 'Node.js' | 'Database' | 'DevOps' | 'Mobile' | 'Web' | 'Security' | 'Other';

const DOMAINS: Domain[] = [
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'React',
  'Node.js',
  'Database',
  'DevOps',
  'Mobile',
  'Web',
  'Security',
  'Other'
];

export default function AskQuestion() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [domain, setDomain] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.some(tag => tag.name === trimmedTag)) {
      setTags([...tags, { name: trimmedTag }]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag.name !== tagToRemove));
  };

  const { token, isAuthenticated } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('You must be logged in to ask a question');
      navigate('/login');
      return;
    }

    if (!title.trim()) {
      setError('Title is required and must be at least 15 characters long');
      return;
    }

    if (!content.trim()) {
      setError('Question content is required');
      return;
    }

    if (tags.length === 0) {
      setError('Please add at least one tag to your question');
      return;
    }

    if (!domain) {
      setError('Please select a domain for your question');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await fetchWithAuth('/api/questions', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          domain: domain || 'Other',
          tags: tags.map(tag => tag.name),
        }),
      });

      // fetchWithAuth returns parsed JSON on success
      navigate(`/questions/${data.id}`);
    } catch (error) {
      console.error('Error creating question:', error);
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          setError('Session expired. Please login again.');
          navigate('/login');
        } else {
          setError(error.message);
        }
      } else {
        setError('An error occurred while creating the question');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Ask a Question</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your programming question?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={15}
          />
        </div>

        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
            Domain
          </label>
          <select
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a domain</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="question-content" className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <MarkdownEditor
            id="question-content"
            value={content}
            onChange={setContent}
            placeholder="Describe your problem in detail..."
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div id="tags" className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag.name}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.name)}
                    className="text-blue-600 hover:text-blue-800"
                    aria-label={`Remove tag ${tag.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                id="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag (press Enter)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Tag input"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Your Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
