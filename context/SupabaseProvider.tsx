import { createContext, useContext, useEffect, useState } from "react";
import { Session, SignInWithPasswordlessCredentials, User } from "@supabase/supabase-js";
import { useRouter, useSegments } from "expo-router";
import { supabase } from "../supabase";
import { I18n } from 'i18n-js';
import { AvailableLocales, dict } from "../assets/translations/translation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, ColorSchemeName } from "react-native";
import { authEmailsTranslations } from "../assets/translations/email";

type SupabaseContextProps = {
  user: User | null;
  session: Session | null;
  initialized?: boolean;
  theme: ColorSchemeName;
  i18n: I18n | null;
  followingEvents: number[];
  setLanguage: (locale: AvailableLocales) => void;
  storeFollowingEventsCookie: (followingEvents: number[], redirectHome?: boolean, updateLocalFollowingEvents?: boolean) => void;
  storeFollowingEventsUserData: (followingEvents: number[], redirectHome?: boolean, updateLocalFollowingEvents?: boolean) => void;
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
  followingEvents: [],
  setLanguage: (locale: AvailableLocales) => {},
  storeFollowingEventsCookie: (followingEvents: number[], redirectHome?: boolean, updateLocalFollowingEvents?: boolean) => {},
  storeFollowingEventsUserData: (followingEvents: number[], redirectHome?: boolean, updateLocalFollowingEvents?: boolean) => {}, 
  signInWithOTP: async () => {},
  verifyOTP: async () => {},
  signOut: async () => {}
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [realSession, setRealSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [theme, setTheme] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? 'light');
  const [i18n, setI18n] = useState<I18n | null>(null);
  const [followingEvents, setFollowingEvents] = useState<number[]>(undefined);

  const segments = useSegments();
  const router = useRouter();

  const signInWithOTP = async (options: SignInWithPasswordlessCredentials) => {
    const { error } = await supabase.auth.signInWithOtp(options);
    if (error) {
      throw error;
    }
  };

  const verifyOTP = async (email: string, code: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    });
    if (error) {
      throw error;
    }
    storeLocaleUserMetadata(i18n?.locale as AvailableLocales);
    storeFollowingEventsUserData(followingEvents, false, true, data.user.id);
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };


  const storeLocaleCookie = async (locale: AvailableLocales) => {
    try {
      await AsyncStorage.setItem('locale', locale);
    } catch (e) { }
  };

  const storeLocaleUserMetadata = async (locale: AvailableLocales) => {
    const emailData = authEmailsTranslations[locale];
    if (!locale || !emailData) return;
    try {
      await supabase.auth.updateUser({
        data: {lang: locale, emailData: emailData}
      });
    } catch (e) { }
  };

  const setLanguage = (locale: AvailableLocales) => {
    if (!locale) return;
    i18n.locale = locale;
    storeLocaleCookie(locale);
    storeLocaleUserMetadata(locale);
  };


  const storeFollowingEventsCookie = async (followingEvents: number[], redirectHome?: boolean, updateLocalFollowingEvents?: boolean) => {
    try {
      await AsyncStorage.setItem('followingEvents', JSON.stringify(followingEvents));
      if (updateLocalFollowingEvents) setFollowingEvents(followingEvents);
      if (redirectHome) router.navigate('/');
    } catch (e) { }
  };
  
  const storeFollowingEventsUserData = async (followingEvents: number[], redirectHome?: boolean, updateLocalFollowingEvents?: boolean, hardcodedUserId?: string) => {
    try {
      await supabase.from('users')
      .update({
        event_ids_following: followingEvents
      })
      .eq('id', hardcodedUserId || user?.id).select()
      .then(({ data, error }) => {
        if (error) throw error;
        if (redirectHome) router.navigate('/');
        if (updateLocalFollowingEvents) setFollowingEvents(followingEvents);
      });
    } catch (e) { }
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
        try {
          await AsyncStorage.setItem('locale', AvailableLocales.CA);
        } catch (e) { }
        setI18n(i18n);
      }
    } catch (e) {
      i18n.locale = AvailableLocales.CA;
      setI18n(i18n);
    }
  };

  const getFollowingEventsFromCookie = async () => {
    try {
      const value = await AsyncStorage.getItem('followingEvents');
      if (value !== null) {
        setFollowingEvents(JSON.parse(value).map(Number));
      } else {
        setFollowingEvents([]);
      }
    } catch (e) { }
  };

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });

    return () => subscription.remove();
   }, []);

  useEffect(() => {
    getLocaleFromCookie();
    getFollowingEventsFromCookie();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (!session) {
        setRealSession(null)
        setUser(null);
      }
      if (event === 'USER_UPDATED' && session) {
        setUser(session.user);
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
    if (realSession && session && session?.access_token !== realSession?.access_token) { //TODO PAU check if checking the realSession is needed at the beginning of the if
      setRealSession(session)
      setUser(session.user);
    }
  }, [session, realSession]);

  useEffect(() => { //redirects to auth wall and "deeplink" after auth
    if (!initialized) return;
    
    //INFO PAU: old way of enforcing auth wall always if not signed in (and keeping the params so user was redirected to the scanned event page after auth)
    // const cleanParamsId = params.id && typeof params.id === "string" ? params.id : null;
    // const cleanParamsEventId = params.event && typeof params.event === "string" ? params.event : null;
    // if (!session && segments[0] !== "(auth)") {
    //   router.replace("/welcome");
    //   if (segments[0] === "(screens)" && segments[1] === "event" && segments[2] === "[id]") {
    //     if (!cleanParamsId) return;
    //     router.setParams({ event: cleanParamsId });
    //   }
    // } else 
    if (session && segments[0] === "(auth)") {
      // if (cleanParamsEventId) {
      //   router.replace("/");
      //   router.navigate(`/event/${cleanParamsEventId}`);
      // } else {
        router.replace("/");
      // }
    } else if (session && segments[0] !== "(auth)" && !session.user.user_metadata?.birthdate) {
      router.navigate('/profile/birthdate');
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
        followingEvents,
        storeFollowingEventsCookie,
        storeFollowingEventsUserData,
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