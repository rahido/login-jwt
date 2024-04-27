import { RouteObject } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import SignUpPage from "./pages/SignUpPage";
import AuthGuard from "./AuthGuard";
import GuestGuard from "./GuestGuard";

const routes: RouteObject[] = [
  {
    path: "home",
    element: (
      <AuthGuard>
        <HomePage />
      </AuthGuard>
    ),
  },
  {
    path: "login",
    element: (
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    ),
  },
  {
    path: "signup",
    element: (
      <GuestGuard>
        <SignUpPage />
      </GuestGuard>
    ),
  },
  {
    path: "*",
    element: <LandingPage />,
    children: [{ index: true, element: <LandingPage /> }],
  },
];

export default routes;
