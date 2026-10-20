import { useState } from "react";
import { ageOn } from "../logic";
import { useNav } from "../nav";
import { useStore } from "../store";
import { Botanical, Button, Field, Icon } from "../ui";

const samples = [
  ["Sanduni", "Client", "sanduni@sithsevana.test"],
  ["Nadeesha", "Counsellor", "nadeesha@sithsevana.test"],
  ["Thilini", "Applicant", "thilini@sithsevana.test"],
  ["Malini", "Staff", "malini@sithsevana.test"],
] as const;

export function WelcomeScreen() {
  const { setRole, push } = useNav();
  const { signIn } = useStore();
  const [email, setEmail] = useState("sanduni@sithsevana.test");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);

  function submit(nextEmail = email, nextPassword = password) {
    const message = signIn(nextEmail, nextPassword);
    if (message) {
      setError(message);
      return;
    }
    const role =
      nextEmail.startsWith("nadeesha") ? "counsellor" : nextEmail.startsWith("thilini") ? "applicant" : nextEmail.startsWith("malini") ? "staff" : "client";
    setRole(role);
  }

  return (
    <div className="screen-scroll welcome">
      <section className="hero">
        <Botanical />
        <p className="eyebrow">Counselling · private</p>
        <h1>Sith Sevana</h1>
        <p>A quiet place to talk, when you are ready.</p>
      </section>
      <section className="sheet-card">
        <ul className="promises">
          <li>
            <Icon name="shield" size={18} />
            <span>Only you and your counsellor join the session.</span>
          </li>
          <li>
            <Icon name="lock" size={18} />
            <span>Staff cannot open your messages or files.</span>
          </li>
          <li>
            <Icon name="leaf" size={18} />
            <span>You choose the person, the time, and what to share.</span>
          </li>
        </ul>
        <p className="fine">Open a sample person. Any password of 4 or more characters also works below.</p>
        <div className="sample-row">
          {samples.map(([name, role, address]) => (
            <button key={address} className="sample" onClick={() => submit(address, "demo")}>
              <strong>{name}</strong>
              <span>{role}</span>
            </button>
          ))}
        </div>
        <Field label="Email" value={email} autoComplete="off" onChange={(event) => setEmail(event.target.value)} />
        <Field label="Password" type="password" value={password} autoComplete="off" onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="error">{error}</p>}
        <Button onClick={() => submit()}>Sign in</Button>
        <Button tone="ghost" onClick={() => push({ id: "register" })}>
          Create an account
        </Button>
        <p className="fine">Adults, 18 and over. English in this version.</p>
      </section>
    </div>
  );
}

export function RegisterScreen() {
  const { pop, setRole } = useNav();
  const { register } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const years = ageOn(dob);
    if (years == null) {
      setError("Enter your date of birth.");
      return;
    }
    if (years < 18) {
      setError("Sith Sevana is for adults in this version. If you need help now, call 1926.");
      return;
    }
    const message = register({ name, email, dob, consent });
    if (message) {
      setError(message);
      return;
    }
    setRole("client");
  }

  return (
    <div className="screen-scroll pad">
      <button className="back" onClick={pop}>
        <Icon name="back" size={18} /> Back
      </button>
      <h1 className="display">Create your account</h1>
      <p className="lede">A new account is a client account. Counsellor access starts with an application, after staff approval.</p>
      <Field label="Your name" value={name} onChange={(event) => setName(event.target.value)} />
      <Field label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Field label="Date of birth" type="date" value={dob} onChange={(event) => setDob(event.target.value)} />
      <label className="check">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        <span>I accept the terms and privacy notice. I understand sessions are not recorded, and this is not an emergency service.</span>
      </label>
      {error && <p className="error">{error}</p>}
      <Button onClick={submit}>Continue</Button>
    </div>
  );
}
