import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { LoanEligibilityPage } from "./pages/LoanEligibilityPage.jsx";
import { LoanResultPage } from "./pages/LoanResultPage.jsx";
import { SecurityPage } from "./pages/SecurityPage.jsx";
import { TrustScorePage } from "./pages/TrustScorePage.jsx";
import { TwinPage } from "./pages/TwinPage.jsx";
import { MonitoringPage } from "./pages/MonitoringPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/loan" element={<LoanEligibilityPage />} />
          <Route path="/loan/result" element={<LoanResultPage />} />
          <Route path="/trust" element={<TrustScorePage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/twin" element={<TwinPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
