import { useState, useEffect, ChangeEvent } from 'react';
import Avatar from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { fetchWithAuth } from '../utils/api';
import QuestionCard from '../components/QuestionCard';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string | null;
  avatar?: string | null;
  bio?: string | null;
  createdAt: string;
  questions: any[];
  answers: any[];
  reputation: number;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');

  useEffect(() => {
    // Wait until auth user is available to fetch the profile
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await fetchWithAuth(`/api/users/profile`);

        // Server uses `avatar` field; normalize to `avatarUrl` used in this component
        const record = data as Record<string, unknown>;
        const normalized = {
          ...(record as any),
          avatarUrl: typeof record.avatar === 'string' ? record.avatar : (typeof record.avatarUrl === 'string' ? record.avatarUrl : null),
          questions: Array.isArray((record as any).questions) ? (record as any).questions : [],
          answers: Array.isArray((record as any).answers) ? (record as any).answers : [],
        } as UserProfile;

        setProfile(normalized);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);
      const data = await fetchWithAuth('/api/users/avatar', {
        method: 'POST',
        body: formData,
      });

      // server returns { avatarUrl } or { avatar }
      const record = data as Record<string, unknown>;
      const avatarUrl = (typeof record.avatar === 'string' ? record.avatar : (typeof record.avatarUrl === 'string' ? record.avatarUrl : null));

      setProfile(prev => {
        const updated = prev ? { ...prev, avatarUrl } : null;
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.avatar = avatarUrl;
            localStorage.setItem('user', JSON.stringify(parsed));
          }
        } catch {
          // ignore
        }

        // reload to update header/avatar from auth hook
        window.location.reload();
        return updated;
      });
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Profile editing (username, email, bio)
  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      const payload = { username: profile.username, email: profile.email, bio: profile.bio };
      const data = await fetchWithAuth('/api/users/profile', { method: 'PUT', body: JSON.stringify(payload) });
      setProfile(data as UserProfile);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-4">
        Profile not found
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors duration-200">
        <div className="flex items-start space-x-6">
            <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              <Avatar src={profile.avatarUrl ?? null} name={profile.username} size={128} className="w-full h-full" />
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </label>
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{profile.username}</h1>
                <p className="text-gray-600 mb-4">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <button 
                  onClick={handleSaveProfile} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded transition-colors duration-200"
                >
                  Save profile
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <input 
                  value={profile.username} 
                  onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : prev)} 
                  className="px-3 py-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                />
                <input 
                  value={profile.email} 
                  onChange={(e) => setProfile(prev => prev ? { ...prev, email: e.target.value } : prev)} 
                  className="px-3 py-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                />
              </div>
              <textarea 
                value={profile.bio ?? ''} 
                onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : prev)} 
                className="w-full px-3 py-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                placeholder="A short bio about yourself" 
              />
              <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold dark:text-white">{profile.questions.length}</div>
                <div className="text-gray-600 dark:text-gray-400">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold dark:text-white">{profile.answers.length}</div>
                <div className="text-gray-600 dark:text-gray-400">Answers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold dark:text-white">{profile.reputation}</div>
                <div className="text-gray-600 dark:text-gray-400">Reputation</div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-200">
        <div className="border-b dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'questions'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Questions
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'answers'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Answers
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'questions' ? (
            profile.questions.length > 0 ? (
              <div className="space-y-6">
                {profile.questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No questions yet</p>
            )
          ) : profile.answers.length > 0 ? (
            <div className="space-y-6">
              {profile.answers.map((answer) => (
                <div key={answer.id} className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors duration-200">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Answered on {new Date(answer.createdAt).toLocaleDateString()}
                  </div>
                  <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: answer.content }} />
                  <div className="mt-2">
                    <a href={`/questions/${answer.questionId}`} className="text-blue-500 dark:text-blue-400 hover:underline">
                      View question
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No answers yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
