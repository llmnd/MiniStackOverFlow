import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../utils/api';
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

interface AIResponse {
  result?: string;
  error?: string;
  details?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

type Props = Readonly<{
  open?: boolean;
  onClose?: () => void;
}>;

export default function SidebarAssistant({ open: openProp, onClose }: Props) {
  const [open, setOpen] = useState<boolean>(!!openProp);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInitial, setUserInitial] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user info from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.username) {
          setUserInitial(user.username.charAt(0).toUpperCase());
        }
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  // sync controlled prop
  useEffect(() => {
    if (typeof openProp === 'boolean') setOpen(openProp);
  }, [openProp]);

  const close = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && prompt.trim()) {
        send();
      }
    }
  };

  const send = async () => {
    if (!prompt.trim()) return;
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: prompt.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Veuillez vous connecter pour utiliser l\'assistant IA.');
      }

      console.log('Sending AI request:', { prompt: prompt.trim() });
      const res = await fetchWithAuth<AIResponse>('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      console.log('AI response:', res);

      if (!res || typeof res !== 'object') {
        throw new Error('Réponse invalide du serveur');
      }
      
      if ('error' in res || 'details' in res) {
        throw new Error(res.error || res.details || 'Erreur inconnue');
      }
      
      if (!res.result) {
        console.error('Unexpected response format:', res);
        throw new Error('Format de réponse inattendu');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: res.result,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Error: ' + (err instanceof Error ? err.message : 'Unknown error'),
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // If controlled and closed, render nothing
  if (typeof openProp === 'boolean' && !open) return null;

  // Render as a small modal/popup near the bottom right of the sidebar
  return (
    <div className="fixed right-8 bottom-8 max-w-md w-full z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
            <strong>Assistant IA</strong>
          </div>
          <button onClick={close} className="text-white/80 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 bg-gray-900">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {message.sender === 'user' ? (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-medium">
                  {userInitial || '?'}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 border border-gray-700 text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <span className="text-xs text-gray-400 block mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 animate-pulse flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-gray-900 border-t border-gray-700">
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Posez votre question..."
              className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 resize-none 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400
                transition-colors"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !prompt.trim()}
              className={`px-4 py-2 rounded-lg transition-colors flex-shrink-0 ${
                loading || !prompt.trim()
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? '...' : 'Envoyer'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Appuyez sur Entrée pour envoyer, Maj+Entrée pour un saut de ligne
          </p>
        </div>
      </div>
    </div>
  );
}
