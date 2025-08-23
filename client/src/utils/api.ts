import { API_BASE_URL } from '../constants/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

export const fetchWithAuth = async <T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const token = localStorage.getItem('token');
  
  // If body is FormData, don't set Content-Type so the browser can set the boundary
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    console.log('Fetching:', `${API_BASE_URL}${endpoint}`, { headers });
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expiré ou invalide
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // Try to parse json error body safely
      let errorText = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorText = (errorData && (errorData.error || errorData.message || errorData.details)) || JSON.stringify(errorData);
      } catch {
        try {
          errorText = await response.text();
        } catch {
          errorText = `HTTP ${response.status} ${response.statusText}`;
        }
      }
      throw new Error(typeof errorText === 'string' ? errorText : 'Une erreur est survenue');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Une erreur réseau est survenue');
  }
};