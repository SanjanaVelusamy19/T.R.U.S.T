import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { LoadingSpinner } from "./components/LoadingSpinner.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";

const CommandCenter = lazy(() =>
  import("./pages/CommandCenter.jsx").then((m) => ({ default: m.CommandCenter })),
);
const LoanEligibilityPage = lazy(() =>
  import("./pages/LoanEligibilityPage.jsx").then((m) => ({ default: m.LoanEligibilityPage })),
);
const LoanResultPage = lazy(() =>
  import("./pages/LoanResultPage.jsx").then((m) => ({ default: m.LoanResultPage })),
);
const TrustScorePage = lazy(() =>
  import("./pages/TrustScorePage.jsx").then((m) => ({ default: m.TrustScorePage })),
);
const SecurityPage = lazy(() =>
  import("./pages/SecurityPage.jsx").then((m) => ({ default: m.SecurityPage })),
);
const TwinPage = lazy(() => import("./pages/TwinPage.jsx").then((m) => ({ default: m.TwinPage })));
const MonitoringPage = lazy(() =>
  import("./pages/MonitoringPage.jsx").then((m) => ({ default: m.MonitoringPage })),
);
const GoldLoanPage = lazy(() =>
  import("./pages/GoldLoanPage.jsx").then((m) => ({ default: m.GoldLoanPage })),
);
const AdvisorPage = lazy(() =>
  import("./pages/AdvisorPage.jsx").then((m) => ({ default: m.AdvisorPage })),
);
const ApiHealthPage = lazy(() =>
  import("./pages/system/ApiHealthPage.jsx").then((m) => ({ default: m.ApiHealthPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/system/ProfilePage.jsx").then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import("./pages/system/SettingsPage.jsx").then((m) => ({ default: m.SettingsPage })),
);
const LogsPage = lazy(() =>
  import("./pages/system/LogsPage.jsx").then((m) => ({ default: m.LogsPage })),
);

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner label="Loading module…" />
    </div>
  );
}

function Lazy({ children }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <Lazy>
                <CommandCenter />
              </Lazy>
            }
          />
          <Route
            path="/loan"
            element={
              <Lazy>
                <LoanEligibilityPage />
              </Lazy>
            }
          />
          <Route
            path="/loan/result"
            element={
              <Lazy>
                <LoanResultPage />
              </Lazy>
            }
          />
          <Route
            path="/trust"
            element={
              <Lazy>
                <TrustScorePage />
              </Lazy>
            }
          />
          <Route
            path="/security"
            element={
              <Lazy>
                <SecurityPage />
              </Lazy>
            }
          />
          <Route
            path="/twin"
            element={
              <Lazy>
                <TwinPage />
              </Lazy>
            }
          />
          <Route
            path="/monitoring"
            element={
              <Lazy>
                <MonitoringPage />
              </Lazy>
            }
          />
          <Route
            path="/gold-loan"
            element={
              <Lazy>
                <GoldLoanPage />
              </Lazy>
            }
          />
          <Route
            path="/advisor"
            element={
              <Lazy>
                <AdvisorPage />
              </Lazy>
            }
          />
          <Route
            path="/api-health"
            element={
              <Lazy>
                <ApiHealthPage />
              </Lazy>
            }
          />
          <Route
            path="/profile"
            element={
              <Lazy>
                <ProfilePage />
              </Lazy>
            }
          />
          <Route
            path="/settings"
            element={
              <Lazy>
                <SettingsPage />
              </Lazy>
            }
          />
          <Route
            path="/logs"
            element={
              <Lazy>
                <LogsPage />
              </Lazy>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
