import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RegisterError {
  email?: string;
  username?: string;
  password?: string;
  general?: string;
}

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterError>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: RegisterError = {};
    
    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit faire au moins 3 caractères';
    }

    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit faire au moins 6 caractères';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.password = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Envoi de la requête avec les données:', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      console.log('Réponse du serveur:', { status: response.status, data });

      if (!response.ok) {
        console.error('Erreur serveur:', data);
        throw new Error(data.message || data.details || 'Erreur lors de l\'inscription');
      }

      // Gérer l'authentification avec useAuth
      await login(data.token, data.user);

      // Attendre que l'état d'authentification soit mis à jour
      setTimeout(() => {
        navigate('/questions', { replace: true });
      }, 100);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la connexion au serveur';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Impossible de se connecter au serveur. Veuillez vérifier que :\n' +
          '1. Le serveur backend est en cours d\'exécution (npm run dev dans le dossier server)\n' +
          '2. MongoDB est en cours d\'exécution\n' +
          '3. L\'URL du serveur est correcte (http://localhost:3000)';
      }

      setErrors({
        general: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-900 to-black px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl border border-gray-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Créer un compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Ou{' '}
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        {errors.general && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.username ? 'border-red-500' : 'border-gray-700'
                } bg-gray-800/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Nom d'utilisateur"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-500' : 'border-gray-700'
                } bg-gray-800/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Adresse email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-500' : 'border-gray-700'
                } bg-gray-800/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-500' : 'border-gray-700'
                } bg-gray-800/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
