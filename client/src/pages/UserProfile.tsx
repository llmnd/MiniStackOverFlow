import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../constants/api';
import QuestionCard from '../components/QuestionCard';
import Avatar from '../components/Avatar';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${id}`);
        if (!res.ok) throw new Error('Failed to load user');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) return <div className="p-6 text-red-600">User not found</div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start space-x-6">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
            <Avatar src={profile.avatar ?? null} name={profile.username} size={128} className="w-full h-full" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{profile.username}</h1>
            <p className="text-gray-600 mb-4">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{profile.questions.length}</div>
                <div className="text-gray-600">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{profile.answers.length}</div>
                <div className="text-gray-600">Answers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {profile.questions.map((q: any) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}
