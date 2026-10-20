import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";

export type IconName =
  | "home"
  | "people"
  | "calendar"
  | "chat"
  | "user"
  | "leaf"
  | "shield"
  | "phone"
  | "clock"
  | "star"
  | "back"
  | "search"
  | "file"
  | "card"
  | "check"
  | "video"
  | "mic"
  | "lock"
  | "settings"
  | "plus"
  | "close";

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const path: Record<IconName, ReactNode> = {
    home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />,
    people: (
      <>
        <path d="M16 20v-1.2A3.8 3.8 0 0 0 12.2 15H7.8A3.8 3.8 0 0 0 4 18.8V20" />
        <circle cx="10" cy="8" r="3" />
        <path d="M20 20v-1.1A3.2 3.2 0 0 0 17.2 16" />
        <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3.5V7M16 3.5V7M4 10h16" />
      </>
    ),
    chat: <path d="M6 16.5 4 20l4.2-1.4A8 8 0 1 0 6 16.5z" />,
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19.2a7 7 0 0 1 14 0" />
      </>
    ),
    leaf: <path d="M5 19s1-8 7-11 8-2 8-2-1 8-6 11-9 2-9 2zM9 14c2-1 4-3 5-6" />,
    shield: <path d="M12 3 19 6v6c0 4.5-3 6.8-7 8-4-1.2-7-3.5-7-8V6z" />,
    phone: <path d="M8 4h3l1 4-2 1a12 12 0 0 0 5 5l1-2 4 1v3c0 1-1 2-2 2A15 15 0 0 1 6 6c0-1 1-2 2-2z" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </>
    ),
    star: <path d="m12 4 2 5 5 .4-4 3.3 1.3 5L12 15.6 7.7 17.7 9 12.7 5 9.4 10 9z" />,
    back: <path d="M15 5 8 12l7 7" />,
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    file: (
      <>
        <path d="M7 3.5h7l5 5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
        <path d="M14 3.5V9h5" />
      </>
    ),
    card: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    check: <path d="m5 12 5 5L20 7" />,
    video: (
      <>
        <rect x="3" y="7" width="12" height="10" rx="2" />
        <path d="m15 11 6-3v8l-6-3z" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V8a4 4 0 0 1 8 0v2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5v2.2M12 18.3V20.5M4.8 6.8l1.6 1.6M17.6 15.6l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.8 17.2l1.6-1.6M17.6 8.4l1.6-1.6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg {...common}>{path[name]}</svg>;
}

export function Avatar({ name, hue, size = 48 }: { name: string; hue: number; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(150deg, hsl(${hue} 38% 38%), hsl(${hue + 18} 32% 24%))`,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Button({
  children,
  tone = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "quiet" | "ghost" | "danger" }) {
  return (
    <button className={`btn ${tone}${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} {...props} />
    </label>
  );
}

export function Area({ label, ...props }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <textarea id={id} rows={4} {...props} />
    </label>
  );
}

export function Pill({ children, tone = "sage" }: { children: ReactNode; tone?: "sage" | "amber" | "green" | "ink" | "rose" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="stars" aria-label={`${value} of 5`}>
      {value.toFixed(1)}
      <Icon name="star" size={14} />
    </span>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <Icon name="leaf" size={28} />
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

export function Botanical() {
  return (
    <svg className="botanical" viewBox="0 0 280 180" aria-hidden>
      <path d="M40 150c30-50 70-70 110-78 18 28 22 58 10 92" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M150 72c28-8 58-6 86 8-30 6-52 22-64 48" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M86 112c18-6 28-18 34-34" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="168" cy="58" rx="16" ry="8" transform="rotate(-25 168 58)" fill="none" stroke="currentColor" />
      <circle cx="206" cy="46" r="3" fill="currentColor" />
    </svg>
  );
}
