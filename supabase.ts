import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_PUBLIC_API_URL,
  SUPABASE_PUBLIC_API_KEY
} from '@env';
import { Database } from "./types/supabase";

export const supabase = createClient<Database>(SUPABASE_PUBLIC_API_URL, SUPABASE_PUBLIC_API_KEY, {
  auth: {
    // https://github.com/supabase/supabase-js/issues/870
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true
  },
});