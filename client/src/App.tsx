import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Questions from './pages/Questions';
import QuestionDetail from './pages/QuestionDetail';
import AskQuestion from './pages/AskQuestion';
import Profile from './pages/Profile';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <Navbar />
        <div className="flex h-[calc(100vh-64px)]">
          <Sidebar />
          <div className="flex-1 overflow-y-auto pl-64">
            <div className="container mx-auto px-4 py-6 transition-colors duration-200">
              <Routes>
                <Route path="/" element={<Questions />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/questions" element={<Questions />} />
                <Route 
                  path="/questions/ask" 
                  element={isAuthenticated ? <AskQuestion /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/ask" 
                  element={isAuthenticated ? <AskQuestion /> : <Navigate to="/login" />} 
                />
                <Route path="/questions/:id" element={<QuestionDetail />} />
                <Route path="/users" element={<Users />} />
                <Route path="/user/:id" element={<UserProfile />} />
                <Route 
                  path="/profile" 
                  element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
                />
                <Route path="/profilex" element={<Navigate to="/profile" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;