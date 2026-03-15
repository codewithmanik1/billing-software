import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import mjLogo from '../assets/mj_logo.png';

export const Login: React.FC = () => {
  const login = useStore(state => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      login();
      toast.success('Successfully logged in');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 flex items-center justify-center p-4 text-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gold-dark/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gold/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="glass-effect rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-dark via-gold-light to-gold-dark" />
          
          <div className="flex flex-col items-center mb-8">
            {/* Logo with gold ring glow */}
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-2xl bg-[#B8860B]/20 blur-md scale-110" />
              <img
                src={mjLogo}
                alt="More Jwellers"
                className="relative w-24 h-24 rounded-2xl object-contain shadow-2xl"
                style={{
                  background: '#FBF0E4',
                  padding: '4px',
                  border: '1px solid rgba(184,134,11,0.4)',
                }}
              />
            </div>

            {/* Shop name under logo */}
            <h1
              className="text-[#FFD700] text-2xl font-bold tracking-[0.2em] uppercase text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              More Jwellers
            </h1>
            <p className="text-[#9A9A8A] text-xs tracking-[0.25em] uppercase mt-1 text-center">
              Billing Management System
            </p>

            {/* Decorative gold divider */}
            <div className="flex items-center gap-3 mt-4 w-full max-w-[200px]">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#B8860B]/50" />
              <div className="w-1 h-1 rounded-full bg-[#B8860B]" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#B8860B]/50" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter username"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-3 text-lg font-bold tracking-wide mt-4"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Demo Credentials: admin / admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};
