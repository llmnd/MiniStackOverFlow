import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import QuestionCard from './components/QuestionCard'

const Home = () => {
  const sampleQuestions = [
    {
      title: "Comment configurer Tailwind CSS avec React et TypeScript ?",
      content: "J'essaie de configurer Tailwind CSS dans mon projet React/TypeScript mais je rencontre des erreurs...",
      votes: 42,
      answers: 3,
      tags: ["react", "tailwind", "typescript"],
      author: "John Doe",
      timeAgo: "2 heures"
    },
    {
      title: "Problème avec les hooks React dans un composant TypeScript",
      content: "Je n'arrive pas à typer correctement mon useState avec TypeScript. J'ai essayé plusieurs approches...",
      votes: 15,
      answers: 5,
      tags: ["react", "typescript", "hooks"],
      author: "Jane Smith",
      timeAgo: "3 heures"
    }
  ];

  return (
    <div className="pl-[164px]">
      <main className="container mx-auto px-4 py-6">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Questions récentes</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="btn-secondary bg-gray-800/50 hover:bg-gray-700/50 text-blue-400 px-4 py-2 rounded-lg">Plus récentes</button>
              <button className="btn-secondary bg-gray-800/50 hover:bg-gray-700/50 text-blue-400 px-4 py-2 rounded-lg">Plus votées</button>
              <button className="btn-secondary bg-gray-800/50 hover:bg-gray-700/50 text-blue-400 px-4 py-2 rounded-lg">Sans réponses</button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {sampleQuestions.map((question, index) => (
              <QuestionCard key={index} {...question} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <>
                <Sidebar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  {/* Add more routes here */}
                </Routes>
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
