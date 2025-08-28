import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "./components/ui/sonner";

const App = () => {
  return (
    <>
      <AppRoutes />
      {/* Toast container to render toasts globally */}
      <Toaster />
    </>
  );
};

export default App;
