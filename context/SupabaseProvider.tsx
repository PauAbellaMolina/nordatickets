import { createContext, useContext, useEffect, useState } from "react";
import { Session, SignInWithPasswordlessCredentials, User } from "@supabase/supabase-js";
import { useRouter, useSegments } from "expo-router";
import { supabase } from "../supabase";
import { I18n } from 'i18n-js';
import { AvailableLocales, dict } from "../assets/translations/translation";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SupabaseContextProps = {
  user: User | null;
  session: Session | null;
  initialized?: boolean;
  i18n: I18n | null;
  setLanguage: (locale: AvailableLocales) => void;
  signInWithOTP: (options: SignInWithPasswordlessCredentials) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type SupabaseProviderProps = {
  children: React.ReactNode;
};

export const SupabaseContext = createContext<SupabaseContextProps>({
  user: null,
  session: null,
  initialized: false,
  i18n: null,
  setLanguage: (locale: AvailableLocales) => {},
  signInWithOTP: async () => {},
  verifyOTP: async () => {},
  signOut: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [i18n, setI18n] = useState<I18n | null>(null);

  const segments = useSegments()[0];
  const router = useRouter();

  const signInWithOTP = async (options: SignInWithPasswordlessCredentials) => {
    const { error } = await supabase.auth.signInWithOtp(options);
    if (error) {
      throw error;
    }
  };

  const verifyOTP = async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    });
    if (error) {
      throw error;
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const storeLocaleCookie = async (locale: AvailableLocales) => {
    if (!locale) return;
    i18n.locale = locale;
    try {
      await AsyncStorage.setItem('locale', locale);
    } catch (e) { }
  };

  const setLanguage = (locale: AvailableLocales) => {
    storeLocaleCookie(locale);
  };

  const getLocaleFromCookie = async () => {
    const i18n = new I18n(dict);
    try {
      const value = await AsyncStorage.getItem('locale');
      if (value !== null) {
        i18n.locale = value as AvailableLocales;
        setI18n(i18n);
      } else {
        i18n.locale = AvailableLocales.CA;
        setI18n(i18n);
      }
    } catch (e) {
      i18n.locale = AvailableLocales.CA;
      setI18n(i18n);
    }
  };

  useEffect(() => {
    getLocaleFromCookie();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session ? session.user : null);
      setInitialized(true);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (!session && segments !== "(auth)") {
      router.replace("/welcome");
    } else if (session && segments === "(auth)") {
      router.replace("/");
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
        i18n,
        setLanguage,
        signInWithOTP,
        verifyOTP,
        signOut
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};