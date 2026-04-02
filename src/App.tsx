// Importing Packages
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Importing Router
import { ProtectedRoute, PublicRoute } from "./Router/ProtectedRoute";

// Importing Pages
import Login from "./Pages/LoginPage";
import Register from "./Pages/RegisterPage";
import Dashboard from "./Pages/DashboardPage";


export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position='top-right'
        toastOptions={{
          style: {
            background: "#FFFFFF",
            color: "#0F172A",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "12px",
            fontSize: "0.875rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          },
          success: { iconTheme: { primary: "#10B981", secondary: "#FFFFFF" } },
          error: { iconTheme: { primary: "#EF4444", secondary: "#FFFFFF" } },
        }}
      />
      <Routes>
        {/* Non Auth */}
        <Route element={<PublicRoute />}>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
        </Route>

        {/* Auth */}
        <Route element={<ProtectedRoute />}>
          <Route path='/dashboard' element={<Dashboard />} />
        </Route>

        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    </BrowserRouter>
  );
}
