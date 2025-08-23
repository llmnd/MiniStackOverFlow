// URL de base de l'API
export const API_BASE_URL = 'http://localhost:3000';

// Endpoints de l'API
export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    QUESTIONS: `${API_BASE_URL}/api/questions`,
    ANSWERS: `${API_BASE_URL}/api/answers`,
    USERS: `${API_BASE_URL}/api/users`,
} as const;
