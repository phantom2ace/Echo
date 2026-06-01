'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const cleanUsername = username.toLowerCase().trim();
      
      // Basic validation
      if (cleanUsername.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }

      // Check if username already exists in profiles table
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existing) {
        throw new Error('This username is already taken. Please choose another one.');
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername
          }
        }
      });
      
      if (error) throw error;
      setMessage('Check your email for the confirmation link!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-earth">
      <div className="w-full max-w-md p-8 bg-stone/3 rounded-2xl shadow-xl border border-stone/10 shadow-[#24251a]/50">
        <h2 className="text-2xl font-black text-center mb-6 tracking-tight text-stone">Sign Up</h2>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone/50 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="e.g. johndoe"
              className="w-full px-4 py-2.5 bg-earth border border-stone/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-rust/40 text-stone placeholder-stone/35 text-sm transition-all duration-150"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone/50 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. john@example.com"
              className="w-full px-4 py-2.5 bg-earth border border-stone/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-rust/40 text-stone placeholder-stone/35 text-sm transition-all duration-150"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone/50 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-earth border border-stone/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-rust/40 text-stone placeholder-stone/35 text-sm transition-all duration-150"
            />
          </div>
          {error && <p className="text-rust text-xs font-semibold">{error}</p>}
          {message && <p className="text-sage text-xs font-semibold">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rust hover:bg-rust/95 text-earth py-2.5 rounded-lg font-bold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 text-sm shadow-md shadow-rust/10 mt-2"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
