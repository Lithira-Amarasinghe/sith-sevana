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
  applicant: ["application", "today", "calendar", "messages", "cprofile"],
  staff: ["staff-home", "staff-counsellors", "staff-payments", "staff-support", "staff-settings"],
};

const parentTab: Record<Role, Partial<Record<ScreenId, ScreenId>>> = {
  client: {
    counsellor: "counsellors",
    book: "counsellors",
    pay: "counsellors",
    session: "sessions",
    lobby: "sessions",
    chat: "messages",
    documents: "profile",
    wallet: "profile",
  },
  counsellor: {
    client: "clients",
    chat: "messages",
    lobby: "today",
    session: "today",
  },
  staff: {
    "application-review": "staff-counsellors",
    questions: "staff-counsellors",
    slip: "staff-payments",
    complaint: "staff-support",
  },
  applicant: {},
};

export function tabFor(role: Role, id: ScreenId): ScreenId {
  return parentTab[role][id] ?? (tabs[role].includes(id) ? id : homeFor[role]);
}

type Nav = {
  stack: Route[];
  route: Route;
  push: (route: Route) => void;
  pop: () => void;
  open: (route: Route) => void;
  role: Role | null;
  setRole: (role: Role | null) => void;
  showTabs: boolean;
  activeTab: ScreenId | null;
};

const Ctx = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [stack, setStack] = useState<Route[]>([{ id: "welcome" }]);

  const api = useMemo<Nav>(() => {
    const route = stack[stack.length - 1] ?? { id: "welcome" };
    const immersive = route.id === "welcome" || route.id === "register" || route.id === "lobby";
    const showTabs = role != null && !immersive;
    const activeTab = role ? tabFor(role, route.id) : null;
    const withParent = (next: Route): Route[] => {
      if (!role) return [next];
      const parent = tabFor(role, next.id);
      if (parent === next.id) return [next];
      return [{ id: parent }, next];
    };
    return {
      stack,
      route,
      role,
      showTabs,
      activeTab,
      push: (next) => setStack((current) => [...current, next]),
      pop: () =>
        setStack((current) => {
          if (current.length > 1) return current.slice(0, -1);
          if (!role) return current;
          const leaf = current[current.length - 1];
          if (!leaf) return current;
          const parent = tabFor(role, leaf.id);
          return parent === leaf.id ? current : [{ id: parent }];
        }),
      open: (next) => setStack(withParent(next)),
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
    application: "Apply",
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
