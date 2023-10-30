import { createContext, useContext, useEffect, useState } from "react";
import { useSegments, useRouter } from "expo-router";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../firebaseConfig";
import { User } from "../app/types";
import { useWallet } from "./WalletProvider";

type AuthType = {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthType>({
  user: null,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

function useProtectedRoute(loaded: boolean, user: any) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inLoadingScreen = segments[0] === "(screens)" && segments[1] === "loadingApp";
    if (loaded) {
      if (!user && !inAuthGroup) { // If the user is not signed in and the initial segment is not anything in the auth group.
        // Redirect to the sign-in page.
        router.replace("/signup");
      } else if (user && (inAuthGroup || inLoadingScreen)) {
        // Redirect to the main page.
        router.replace("/");
      }
    } else {
      router.replace("/loadingApp");
    }
  }, [loaded, user, segments]);
}

export function AuthProvider({ children }: { children: JSX.Element }): JSX.Element {
    const [user, setUser] = useState<User | null>(null);
    const [loaded, setLoaded] = useState<boolean>(false);

    const { funds, cart, walletTicketGroups, setCart, setFunds, setWalletTicketGroups } = useWallet();

    useEffect(() => FIREBASE_AUTH.onAuthStateChanged(value => {
      if (value) {
        console.log("User is signed in. Is email verified? ", value.emailVerified);
        const userDocRef = doc(FIRESTORE_DB, 'users', value.uid);
        getDoc(userDocRef)
        .then((doc) => {
          if (!doc.exists()) {
            setDoc(userDocRef, {
              email: value.email ?? '',
              emailVerified: value.emailVerified,
              walletFunds: 0,
              walletTicketGroups: [], //this will be an array of { eventId: string, tickets: string[] }
              eventIdsFollowing: []
            });
            setUser({
              id: value.uid,
              email: value.email ?? '',
              emailVerified: value.emailVerified,
              walletFunds: 0,
              walletTicketGroups: [],
              eventIdsFollowing: []
            });
          } else {
            if (doc.data().emailVerified !== value.emailVerified) {
              updateDoc(userDocRef, {
                emailVerified: value.emailVerified
              });
            }
            setUser({
              id: value.uid,
              email: value.email ?? '',
              emailVerified: value.emailVerified,
              walletFunds: doc.data().walletFunds,
              walletTicketGroups: doc.data().walletTicketGroups,
              eventIdsFollowing: doc.data().eventIdsFollowing
            });
          }
        })
        .catch((error) => {
          console.log('PAU LOG-> error: ', error);
        })
        .finally(() => {
          setLoaded(true);
        });
      } else {
        console.log("User is signed out");
        setFunds(undefined);
        setCart(null);
        setWalletTicketGroups(null);
        setLoaded(true);
      }
    }), [])

    useProtectedRoute(loaded, user);

    const authContext: AuthType = {
      user,
      setUser
    };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
}