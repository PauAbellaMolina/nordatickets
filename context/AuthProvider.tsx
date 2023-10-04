import { useSegments, useRouter } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User, WalletTicketGroup, WalletTicketGroups } from "../app/types";

type AuthType = {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthType>({
  user: null,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

function useProtectedRoute(user: any) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) { // If the user is not signed in and the initial segment is not anything in the auth group.
      // Redirect to the sign-in page.
      router.replace("/login");
    } else if (user && inAuthGroup) {
      // Redirect to the main page.
      router.replace("/");
    }
  }, [user, segments]);
}

export function AuthProvider({ children }: { children: JSX.Element }): JSX.Element {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => FIREBASE_AUTH.onAuthStateChanged(value => {
      if (value) {
        console.log("User is signed in");
        const userDocRef = doc(FIRESTORE_DB, 'users', value.uid);
        getDoc(userDocRef)
        .then((doc) => {
          if (!doc.exists()) {
            setDoc(userDocRef, {
              phoneNumber: value.providerData[0].phoneNumber ?? '',
              // creditCard: null, //TODO PAU in the future
              walletFunds: 0,
              walletTicketGroups: [] //this will be an array of { eventId: string, tickets: string[] }
            });
            setUser({
              id: value.uid,
              phoneNumber: value.providerData[0].phoneNumber ?? '',
              walletFunds: 0,
              walletTicketGroups: []
            });
          } else {
            setUser({
              id: value.uid,
              phoneNumber: value.providerData[0].phoneNumber ?? '',
              walletFunds: doc.data().walletFunds,
              walletTicketGroups: doc.data().walletTicketGroups
            });
          }
        });
      } else {
       console.log("User is signed out");
      }
    }), [])

    useProtectedRoute(user);

    const authContext: AuthType = {
      user,
      setUser
    };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
}