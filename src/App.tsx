import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import XPanel from "./pages/XPanel";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import PromptView from "./pages/PromptView";
import PromptTest from "./pages/PromptTest";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Auth />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/x-panel",
    element: <XPanel />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/prompt/:id",
    element: <PromptView />,
  },
  {
    path: "/prompt-test",
    element: <PromptTest />
  }
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
