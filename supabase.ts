import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/supabase";

export const supabase = createClient<Database>(process.env.EXPO_PUBLIC_SUPABASE_PUBLIC_API_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLIC_API_KEY, {
  auth: {
    // https://github.com/supabase/supabase-js/issues/870
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true
  },
});