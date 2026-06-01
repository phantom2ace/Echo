'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return null;
  }

  const username = user.user_metadata?.username || (user.email ? user.email.split('@')[0] : 'User');

  return (
    <div className="flex flex-col gap-3 w-full border-t border-stone/10 pt-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-rust to-sage rounded-full text-earth font-black shadow-md select-none shrink-0">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-stone/90 truncate capitalize leading-tight">{username}</span>
          <span className="text-xs text-stone/40 truncate leading-none mt-1">{user.email}</span>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full text-center py-2 text-xs font-semibold text-stone/80 hover:text-rust bg-stone/5 hover:bg-stone/10 rounded-lg transition-all duration-150 border border-stone/5 hover:border-rust/20 cursor-pointer"
      >
        Sign Out
      </button>
    </div>
  );
}
