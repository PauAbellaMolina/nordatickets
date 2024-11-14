import { useGlobalSearchParams } from "expo-router";
import Welcome from "../../components/auth/Welcome";
import Signup from "../../components/auth/Signup";
import Login from "../../components/auth/Login";

export default function WelcomeScreen() {
  const { action } = useGlobalSearchParams();
  
  const renderAuthComponent = () => {
    switch(action) {
      case 'signup':
        return <Signup />;
      case 'login':
        return <Login />;
      default:
        return <Welcome />;
    }
  };

  return renderAuthComponent();
}
