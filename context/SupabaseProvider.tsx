import { createContext, useContext, useEffect, useState } from "react";
import { Session, SignInWithPasswordlessCredentials, User } from "@supabase/supabase-js";
import { useGlobalSearchParams, useRouter, useSegments } from "expo-router";
import { supabase } from "../supabase";
import { I18n } from 'i18n-js';
import { AvailableLocales, dict } from "../assets/translations/translation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, ColorSchemeName } from "react-native";

type SupabaseContextProps = {
  user: User | null;
  session: Session | null;
  initialized?: boolean;
  theme: ColorSchemeName;
  i18n: I18n | null;
  followingEventsChanged?: boolean;
  swapFollowingEventsChanged: () => void;
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
  theme: Appearance.getColorScheme() ?? 'light',
  i18n: null,
  followingEventsChanged: false,
  swapFollowingEventsChanged: () => {},
  setLanguage: (locale: AvailableLocales) => {},
  signInWithOTP: async () => {},
  verifyOTP: async () => {},
  signOut: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [realSession, setRealSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [theme, setTheme] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? 'light');
  const [i18n, setI18n] = useState<I18n | null>(null);
  const [auxFollowingEventsChanged, setAuxFollowingEventsChanged] = useState<boolean>(false);

  const params = useGlobalSearchParams();
  const segments = useSegments();
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

  const swapFollowingEventsChanged = () => {
    setAuxFollowingEventsChanged(!auxFollowingEventsChanged);
  };

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });

    return () => subscription.remove();
   }, []);

  useEffect(() => {
    getLocaleFromCookie();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (!session) {
        setRealSession(null)
        setUser(null);
      }
      setInitialized(true);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => { //TODO PAU this seems to work, but test deeply and make sure theres no security issues
    if (!realSession && session) {
      setRealSession(session)
      setUser(session.user);
    }
    if (session && session?.access_token !== realSession?.access_token) {
      setRealSession(session)
      setUser(session.user);
    }
  }, [session, realSession]);

  useEffect(() => {
    if (!initialized) return;
    
    //TODO PAU this seems to work, but test deeply and make sure theres no security issues
    const cleanParamsId = params.id && typeof params.id === "string" ? params.id : null;
    const cleanParamsEventId = params.event && typeof params.event === "string" ? params.event : null;

    if (!session && segments[0] !== "(auth)") {
      router.replace("/welcome");
      if (segments[0] === "(screens)" && segments[1] === "event" && segments[2] === "[id]") {
        if (!cleanParamsId) return;
        router.setParams({ event: cleanParamsId });
      }
    } else if (session && segments[0] === "(auth)") {
      if (cleanParamsEventId) {
        router.replace("/");
        router.navigate(`/event/${cleanParamsEventId}`);
      } else {
        router.replace("/");
      }
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
        theme,
        i18n,
        followingEventsChanged: auxFollowingEventsChanged,
        swapFollowingEventsChanged,
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