import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { NavProvider } from "./nav";
import { StoreProvider } from "./store";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <NavProvider>
        <App />
      </NavProvider>
    </StoreProvider>
  </StrictMode>,
);
