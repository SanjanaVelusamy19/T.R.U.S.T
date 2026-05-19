import { Navigate, useLocation } from "react-router-dom";
import { WorkspaceLayout } from "../layout/WorkspaceLayout.jsx";
import { LoadingSpinner } from "./LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute() {
  const { isAuthenticated, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="glass-panel w-full max-w-lg rounded-2xl p-8">
          <LoadingSpinner label="Validating institutional session…" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <WorkspaceLayout />;
}
