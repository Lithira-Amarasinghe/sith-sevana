import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Role, Route, ScreenId } from "./types";

const homeFor: Record<Role, ScreenId> = {
  client: "home",
  counsellor: "today",
  applicant: "application",
  staff: "staff-home",
};

const tabs: Record<Role, ScreenId[]> = {
  client: ["home", "counsellors", "sessions", "messages", "profile"],
  counsellor: ["today", "calendar", "messages", "clients", "cprofile"],
  applicant: [],
  staff: ["staff-home", "staff-counsellors", "staff-payments", "staff-support", "staff-settings"],
};

type Nav = {
  stack: Route[];
  route: Route;
  push: (route: Route) => void;
  pop: () => void;
  open: (route: Route) => void;
  role: Role | null;
  setRole: (role: Role | null) => void;
  showTabs: boolean;
};

const Ctx = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [stack, setStack] = useState<Route[]>([{ id: "welcome" }]);

  const api = useMemo<Nav>(() => {
    const route = stack[stack.length - 1] ?? { id: "welcome" };
    const showTabs = role != null && tabs[role].includes(route.id);
    return {
      stack,
      route,
      role,
      showTabs,
      push: (next) => setStack((current) => [...current, next]),
      pop: () => setStack((current) => (current.length > 1 ? current.slice(0, -1) : current)),
      open: (next) => setStack([next]),
      setRole: (next) => {
        setRoleState(next);
        setStack(next ? [{ id: homeFor[next] }] : [{ id: "welcome" }]);
      },
    };
  }, [role, stack]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useNav() {
  const nav = useContext(Ctx);
  if (!nav) throw new Error("Nav missing");
  return nav;
}

export function tabItems(role: Role) {
  const labels: Record<ScreenId, string> = {
    welcome: "Welcome",
    register: "Register",
    home: "Home",
    counsellors: "Counsellors",
    counsellor: "Counsellor",
    book: "Book",
    pay: "Pay",
    sessions: "Sessions",
    session: "Session",
    lobby: "Call",
    messages: "Messages",
    chat: "Chat",
    profile: "Profile",
    documents: "Documents",
    wallet: "Payments",
    today: "Today",
    calendar: "Hours",
    clients: "Clients",
    client: "Client",
    cprofile: "Profile",
    application: "Application",
    "staff-home": "Home",
    "staff-counsellors": "Counsellors",
    "application-review": "Review",
    questions: "Form",
    "staff-payments": "Payments",
    slip: "Slip",
    "staff-support": "Support",
    complaint: "Complaint",
    "staff-settings": "Rules",
  };
  return tabs[role].map((id) => ({ id, label: labels[id] }));
}

export function jumpRoute(id: ScreenId): Route {
  switch (id) {
    case "counsellor":
    case "book":
      return { id, counsellorId: "nadeesha" };
    case "session":
    case "lobby":
      return { id, bookingId: "b-live" };
    case "chat":
      return { id, threadId: "thread-sanduni-nadeesha" };
    case "application-review":
      return { id, applicationId: "app-thilini" };
    case "slip":
      return { id, bookingId: "b-isuru" };
    case "complaint":
      return { id, complaintId: "c-dilani" };
    case "client":
      return { id, counsellorId: "sanduni" };
    default:
      return { id };
  }
}
