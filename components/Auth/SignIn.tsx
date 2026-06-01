'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanIdentifier = identifier.toLowerCase().trim();
      let loginEmail = cleanIdentifier;

      // Check if it is a username (doesn't contain '@')
      if (!cleanIdentifier.includes('@')) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', cleanIdentifier)
          .maybeSingle();

        if (profileError || !data) {
          throw new Error('No account found with that username');
        }
        loginEmail = data.email;
      }

      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-earth">
      <div className="w-full max-w-md p-8 bg-stone/3 rounded-2xl shadow-xl border border-stone/10 shadow-[#24251a]/50">
        <h2 className="text-2xl font-black text-center mb-6 tracking-tight text-stone">Sign In</h2>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone/50 mb-1.5">Email or Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="e.g. johndoe or john@example.com"
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rust hover:bg-rust/95 text-earth py-2.5 rounded-lg font-bold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 text-sm shadow-md shadow-rust/10 mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
