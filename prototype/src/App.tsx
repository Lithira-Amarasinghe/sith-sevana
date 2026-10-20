import { notes, principles, screenIndex } from "./notes";
import { jumpRoute, tabItems, useNav } from "./nav";
import { WelcomeScreen, RegisterScreen } from "./screens/auth";
import { clientScreen } from "./screens/client";
import { counsellorScreen } from "./screens/counsellor";
import { staffScreen } from "./screens/staff";
import { useStore } from "./store";
import type { IconName } from "./ui";
import type { Role, ScreenId } from "./types";

function roleFor(id: ScreenId): Role | null {
  if (id === "welcome" || id === "register") return null;
  if (id === "application") return "applicant";
  if (id.startsWith("staff") || id === "application-review" || id === "questions" || id === "slip" || id === "complaint") return "staff";
  if (id === "today" || id === "calendar" || id === "clients" || id === "client" || id === "cprofile") return "counsellor";
  return "client";
}
import { Icon } from "./ui";
import { useState } from "react";

const tabIcon: Partial<Record<ScreenId, IconName>> = {
  home: "home",
  counsellors: "people",
  sessions: "calendar",
  messages: "chat",
  profile: "user",
  today: "home",
  calendar: "calendar",
  clients: "people",
  cprofile: "user",
  "staff-home": "home",
  "staff-counsellors": "people",
  "staff-payments": "card",
  "staff-support": "shield",
  "staff-settings": "settings",
  application: "file",
};

export function App() {
  const nav = useNav();
  const { data, enter, reset } = useStore();
  const [notesOpen, setNotesOpen] = useState(false);
  const note = notes[nav.route.id];

  function preview(role: Role) {
    enter(role);
    nav.setRole(role);
  }

  return (
    <div className="review">
      <header className="review-bar">
        <div>
          <p className="mark">Sith Sevana</p>
          <p>Design prototype · sample data · for the requirements conversation</p>
        </div>
        <div className="roles">
          {(["client", "counsellor", "applicant", "staff"] as Role[]).map((role) => (
            <button key={role} className={nav.role === role ? "on" : ""} onClick={() => preview(role)}>
              {role}
            </button>
          ))}
        </div>
        <div className="review-actions">
          <button onClick={() => setNotesOpen(true)}>Questions</button>
          <button
            onClick={() => {
              reset();
              nav.setRole(null);
            }}
          >
            Reset
          </button>
        </div>
      </header>
      <aside className="index">
        {screenIndex.map((group) => (
          <div key={group.group}>
            <h2>{group.group}</h2>
            {group.items.map((item) => (
              <button
              key={item.id}
              className={nav.route.id === item.id ? "on" : ""}
              onClick={() => {
                const next = roleFor(item.id);
                if (next) enter(next);
                nav.setRole(next);
                nav.open(jumpRoute(item.id));
              }}
            >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>
      <main className="stage">
        <div className="device">
          <div className="device-screen">
            <Current />
            {nav.showTabs && nav.role && (
              <nav className="tabbar">
                {tabItems(nav.role).map((tab) => (
                  <button key={tab.id} className={nav.activeTab === tab.id ? "tab on" : "tab"} onClick={() => nav.open({ id: tab.id })}>
                    <span>
                      <Icon name={tabIcon[tab.id] ?? "leaf"} size={20} />
                    </span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            )}
            {data.toast && <div className="toast">{data.toast}</div>}
          </div>
        </div>
      </main>
      <aside className={notesOpen ? "notes open" : "notes"}>
        <button className="notes-close" onClick={() => setNotesOpen(false)}>
          Close
        </button>
        <p className="eyebrow">For Sith Sevana</p>
        <h2>{note.title}</h2>
        <p>{note.intent}</p>
        <ul>
          {note.ask.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3>How this preview should feel</h3>
        <ul>
          {principles.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function Current() {
  const { route, role } = useNav();
  if (route.id === "welcome") return <WelcomeScreen />;
  if (route.id === "register") return <RegisterScreen />;
  if (role === "staff") return staffScreen(route.id, route);
  if (role === "applicant") {
    if (route.id === "application") return counsellorScreen("application");
    return counsellorScreen("locked");
  }
  if (role === "counsellor") {
    const own = counsellorScreen(route.id, route.counsellorId);
    if (own) return own;
  }
  return clientScreen(route.id, route);
}
