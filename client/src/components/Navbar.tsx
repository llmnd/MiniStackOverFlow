import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });

  const toggleDark = () => {
    try {
      const next = !dark;
      setDark(next);
      if (next) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', next ? 'dark' : 'light');
  } catch (err) { console.debug('toggleDark error', err); }
  };

  const doSearch = (q?: string) => {
    const query = (q ?? search).trim();
    if (!query) return;
    navigate(`/questions?query=${encodeURIComponent(query)}`);
  };

  return (
    <nav className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/questions" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-400 transition-all duration-300">
                Mini Stack Overflow
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={toggleDark} aria-label="Toggle dark mode" className="text-gray-300 hover:text-white px-2">
              {dark ? '🌙' : '☀️'}
            </button>
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
                placeholder="Rechercher..."
                className="w-64 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
              <button
                onClick={() => doSearch()}
                aria-label="Search"
                className="absolute right-0 top-0 h-full px-3"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <Link 
              to="/questions/ask"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
            >
              Poser une question
            </Link>
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors duration-300"
                >
                  Se connecter
                </Link>
                <Link 
                  to="/register"
                  className="text-gray-300 hover:text-white transition-colors duration-300"
                >
                  S'inscrire
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-gray-200 hover:text-white">
                  <Avatar src={user?.avatar ?? null} name={user?.username ?? null} size={32} className="w-8 h-8" />
                  <span className="hidden sm:inline">{user?.username}</span>
                </button>
                <button onClick={() => { logout(); navigate('/'); }} className="text-gray-300 hover:text-white">Déconnexion</button>
              </div>
            )}
          </div>
          {/* Menu mobile - à implémenter plus tard */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
