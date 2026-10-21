import { useLayoutEffect, useRef, useState } from "react";
import { notes, principles, screenIndex } from "./notes";
import { jumpRoute, tabItems, useNav } from "./nav";
import { WelcomeScreen, RegisterScreen } from "./screens/auth";
import { clientScreen } from "./screens/client";
import { counsellorScreen } from "./screens/counsellor";
import { staffScreen } from "./screens/staff";
import { useStore } from "./store";
import { Icon, type IconName } from "./ui";
import type { Role, ScreenId } from "./types";

const PHONES = [
  { id: "s26", label: "Galaxy S26", width: 360, height: 780, detail: "Latest Samsung · 6.3 in · CSS viewport" },
  { id: "compact", label: "Compact", width: 320, height: 694, detail: "Small width · large display size" },
  { id: "iphone", label: "iPhone 16", width: 393, height: 852, detail: "Common phone" },
  { id: "large", label: "Large", width: 430, height: 932, detail: "Large phone" },
] as const;

const BEZEL = 10;

function roleFor(id: ScreenId): Role | null {
  if (id === "welcome" || id === "register") return null;
  if (id === "application") return "applicant";
  if (id.startsWith("staff") || id === "application-review" || id === "questions" || id === "slip" || id === "complaint") return "staff";
  if (id === "today" || id === "calendar" || id === "clients" || id === "client" || id === "cprofile") return "counsellor";
  return "client";
}
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
  const [phoneId, setPhoneId] = useState<(typeof PHONES)[number]["id"]>("s26");
  const stageRef = useRef<HTMLElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const phone = PHONES.find((item) => item.id === phoneId) ?? PHONES[0];
  const outerW = phone.width + BEZEL * 2;
  const outerH = phone.height + BEZEL * 2;
  const note = notes[nav.route.id];

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const chrome = chromeRef.current?.offsetHeight ?? 0;
      const availW = stage.clientWidth - 24;
      const availH = stage.clientHeight - chrome - 16;
      if (availW < 80 || availH < 80) return;
      setScale(Math.min(1, availW / outerW, availH / outerH));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [outerW, outerH]);

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
      <main className="stage" ref={stageRef}>
        <div className="device-chrome" ref={chromeRef}>
          <div className="device-picker" role="group" aria-label="Phone size">
            {PHONES.map((item) => (
              <button key={item.id} className={item.id === phone.id ? "on" : ""} onClick={() => setPhoneId(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <p className="device-caption">
            {phone.width} × {phone.height} · {phone.detail}
          </p>
        </div>
        <div className="device-slot" style={{ width: outerW * scale, height: outerH * scale }}>
          <div className="device" style={{ width: outerW, height: outerH, transform: `scale(${scale})` }}>
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
