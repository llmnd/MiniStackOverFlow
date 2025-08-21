import { HomeIcon, TagIcon, UsersIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Accueil', icon: HomeIcon, path: '/' },
    { name: 'Questions', icon: TagIcon, path: '/questions' },
    { name: 'Tags', icon: TagIcon, path: '/tags' },
    { name: 'Utilisateurs', icon: UsersIcon, path: '/users' },
    { name: 'Entreprises', icon: BuildingOfficeIcon, path: '/companies' }
  ];

  return (
    <nav className="w-[164px] fixed h-[calc(100vh-50px)] top-[50px] left-0 border-r border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="p-4 space-y-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                isActive(item.path)
                ? 'bg-gray-800 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Sidebar;
