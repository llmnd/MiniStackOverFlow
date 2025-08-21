import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Questions from './pages/Questions';
import QuestionDetail from './pages/QuestionDetail';
import AskQuestion from './pages/AskQuestion';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/questions" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <>
                <Sidebar />
                <div className="pl-[164px]">
                  <main className="container mx-auto px-4 py-6">
                    <Routes>
                      <Route path="/questions" element={<Questions />} />
                      <Route path="/questions/:id" element={<QuestionDetail />} />
                      <Route
                        path="/questions/ask"
                        element={
                          isAuthenticated ? <AskQuestion /> : <Navigate to="/login" />
                        }
                      />
                    </Routes>
                  </main>
                </div>
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
