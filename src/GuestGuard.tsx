import { FC, ReactNode } from "react";
import { storageService } from "./client/Storaging.mjs";
import { Navigate } from "react-router-dom";
// React.FC is a type that stands for "Function Component" in React.
// This component runs before entering a page that's wrapped in this component (in routes.tsx)
// Guest Access
// --> Prevents Logged-in User from access to page (/login)
interface GuestGuardProps {
  children: ReactNode;
}
const GuestGuard: FC<GuestGuardProps> = ({ children }: GuestGuardProps) => {
  const storage = new storageService();
  let isLoggedIn = storage.getRefreshToken();
  if (!isLoggedIn) {
    // Guest --> Can access (/Login, /Signup)
    return <>{children}</>;
  }
  // Authorized --> go to landing page
  return <Navigate to="/home" />;
};

export default GuestGuard;
