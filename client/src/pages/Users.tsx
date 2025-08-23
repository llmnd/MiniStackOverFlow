import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../constants/api';
import { Link } from 'react-router-dom';

export default function Users() {
  const [users, setUsers] = useState<Array<{ id: number; username: string; avatar: string | null; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div className="p-6">Loading users...</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Community users</h1>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <ul className="space-y-3">
          {users.map(u => (
            <li key={u.id} className="flex items-center gap-4 p-2 rounded hover:bg-gray-50">
              <img src={u.avatar ? `${API_BASE_URL}${u.avatar}` : '/default-avatar.png'} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <Link to={`/user/${u.id}`} className="font-medium text-blue-600 hover:underline">{u.username}</Link>
                <div className="text-sm text-gray-500">Member since {new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
