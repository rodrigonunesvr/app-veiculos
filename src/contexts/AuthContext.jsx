import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // evita erro quando não existir linha

      if (error) console.error('Error fetching profile:', error);
      setProfile(data ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data?.session ?? null;
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user?.id) fetchProfile(s.user.id);
      else setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user?.id) fetchProfile(s.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = async () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signOut,
        isAdmin: profile?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
