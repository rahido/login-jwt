import { FC, ReactNode } from "react";
import { storageService } from "./client/Storaging.mjs";
import { Navigate } from "react-router-dom";
// React.FC is a type that stands for "Function Component" in React. It is a generic type that allows you to specify the props that a function component will accept
// This component runs before entering a page that's wrapped in this component (in routes.tsx)
// Authorized access
// --> Prevent Guest User from access to page (/home)
interface AuthGuardProps {
  children: ReactNode;
}
const AuthGuard: FC<AuthGuardProps> = ({ children }: AuthGuardProps) => {
  const storage = new storageService();
  let isLoggedIn = storage.getRefreshToken();
  if (isLoggedIn) {
    // Authorized --> Can access (/home)
    return <> {children} </>;
  }
  // Guest --> go to /login
  return <Navigate to="/login" />;
};
export default AuthGuard;
