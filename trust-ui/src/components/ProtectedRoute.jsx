import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingSpinner } from "./LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute() {
  const { isAuthenticated, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center">
        <GlassWrap>
          <LoadingSpinner label="Validating institutional session…" />
        </GlassWrap>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function GlassWrap({ children }) {
  return (
    <div className="glass-panel w-full rounded-2xl p-8">{children}</div>
  );
}
