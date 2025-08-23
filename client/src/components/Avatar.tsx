import React from 'react';
import { API_BASE_URL } from '../constants/api';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number | string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 40, className = '' }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const style: React.CSSProperties = {};
  if (typeof size === 'number') {
    style.width = size;
    style.height = size;
  }

  if (src) {
    // If the server returned a relative uploads path (e.g. /uploads/avatars/..),
    // prefix it with the API base so the browser requests from the backend.
    const imageSrc = src.startsWith('/') ? `${API_BASE_URL}${src}` : src;
    return (
      <img
        src={imageSrc}
        alt={name || 'avatar'}
        className={`rounded-full object-cover ${className}`}
        style={style}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gray-400 text-white font-medium flex items-center justify-center ${className}`}
      style={style}
      aria-hidden
    >
      <span>{initial}</span>
    </div>
  );
};

export default Avatar;
