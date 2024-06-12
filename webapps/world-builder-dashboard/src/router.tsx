import { createBrowserRouter } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundry";

//Layouts
import AuthLayout from "@/layouts/AuthLayout/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout/DashboardLayout";

//Pages
import LoginPage from "@/pages/LoginPage/LoginPage";
import SignUpPage from "@/pages/SignUpPage/SignUpPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import BridgePage from "@/pages/BridgePage/BridgePage";

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    path: "/",
    children: [
      {
        path: "/signUp",
        element: <SignUpPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: "/",
        element: <LoginPage />,
        errorElement: <ErrorBoundary />,
      },
    ],
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: "/bridge/*",
        element: <BridgePage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
