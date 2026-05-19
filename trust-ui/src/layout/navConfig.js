import {
  Activity,
  Brain,
  Coins,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Orbit,
  Radar,
  ScanEye,
  Settings,
  User,
  Wallet,
} from "lucide-react";

export const NAV_MODULES = [
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: "command center home" },
      { path: "/trust", label: "Trust Intelligence", icon: Radar, keywords: "score analytics index" },
      { path: "/advisor", label: "AI Advisor", icon: Brain, keywords: "recommendations insights" },
      { path: "/twin", label: "Digital Twin", icon: Orbit, keywords: "forecast scenario simulation" },
    ],
  },
  {
    id: "security",
    label: "Security",
    items: [
      { path: "/security", label: "Fraud Detection", icon: ScanEye, keywords: "fraud risk behavioral" },
      { path: "/monitoring", label: "Monitoring", icon: Activity, keywords: "uptime health metrics" },
    ],
  },
  {
    id: "finance",
    label: "Financial Services",
    items: [
      { path: "/loan", label: "Loans", icon: Wallet, keywords: "eligibility credit desk" },
      { path: "/gold-loan", label: "Gold Loans", icon: Coins, keywords: "collateral gold" },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { path: "/api-health", label: "API Health", icon: HeartPulse, keywords: "gateway latency services" },
      { path: "/logs", label: "Logs", icon: FileText, keywords: "audit events activity" },
      { path: "/settings", label: "Settings", icon: Settings, keywords: "preferences configuration" },
      { path: "/profile", label: "Profile", icon: User, keywords: "account operator identity" },
    ],
  },
];

export const COMMAND_QUICK_ACTIONS = [
  { id: "run-trust", label: "Run live trust scoring", path: "/trust", keywords: "calculate score" },
  { id: "loan-desk", label: "Open loan desk", path: "/loan", keywords: "eligibility apply" },
  { id: "gold-desk", label: "Open gold loan desk", path: "/gold-loan", keywords: "collateral" },
  { id: "ecosystem-health", label: "Live infrastructure monitor", path: "/api-health", keywords: "gateway status" },
  { id: "event-logs", label: "Ecosystem event timeline", path: "/logs", keywords: "audit gateway fraud" },
  { id: "control-center", label: "Ecosystem control center", path: "/settings", keywords: "configuration theme" },
];

export function flattenNavItems() {
  return NAV_MODULES.flatMap((mod) =>
    mod.items.map((item) => ({ ...item, module: mod.label, moduleId: mod.id })),
  );
}

export function findNavByPath(pathname) {
  return flattenNavItems().find((item) => item.path === pathname);
}
