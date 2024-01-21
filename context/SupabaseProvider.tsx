import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useRouter, useSegments } from "expo-router";
import { makeRedirectUri } from 'expo-auth-session'
import { supabase } from "../supabase";

type SupabaseContextProps = {
  user: User | null;
  session: Session | null;
  initialized?: boolean;
  signInWithLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type SupabaseProviderProps = {
  children: React.ReactNode;
};

export const SupabaseContext = createContext<SupabaseContextProps>({
  user: null,
  session: null,
  initialized: false,
  signInWithLink: async () => {},
  signOut: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  const segments = useSegments()[0];
  const router = useRouter();

  const signInWithLink = async (email: string) => {
    const redirectTo = makeRedirectUri(); //TODO PAU IMPORTANT Leave empty for development but HARDCODE elteutikt.netlify.com (or whatever the prod domain is). Also, we need to add the domain to the list of allowed domains in supabase (in the auth section>URL Configuration>Redirect URLs)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo
      }
    });
    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session ? session.user : null);
      setInitialized(true);

      //if user not in db users table (not auth.users!) then insert it
      if (event === "SIGNED_IN" && session && session.user) {
        supabase.from('users').select().eq('id', session.user.id)
        .then(({ data: users, error }) => {
          if (error || users.length > 0) return;
          supabase.from('users').insert({
            id: session.user.id
          });
        });
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (!session && segments !== "(auth)") {
      router.replace("/welcome");
    }
    //this should be commented out so that we can go to /something (/event/:id) and not be redirected to / (tab 1 index)
    // else if (session && segments !== "(app)") {
    //   router.replace("/");
    // }
  }, [initialized, session, segments]);

  return (
    <SupabaseContext.Provider
      value={{
        user,
        session,
        initialized,
        signInWithLink,
        signOut
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};