declare module '@env' { //no need to export the other env vars because they are not imported in a ts file unlike these two
  export const SUPABASE_PUBLIC_API_URL: string;
  export const SUPABASE_PUBLIC_API_KEY: string;
  export const FIREBASE_FUNC_GET_FORM_INFO_URL: string;
}