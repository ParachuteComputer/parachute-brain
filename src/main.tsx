import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { ThemeProvider } from "./components/ThemeContext";
import { SessionProvider } from "./data/SessionContext";
import "./styles.css";

// GitHub Pages has no server-side SPA routing: a deep link (or the OAuth
// callback) hits 404.html, which stashes the requested URL and bounces here.
// Restore it before the router reads the location.
const spaRedirect = sessionStorage.getItem("spa-redirect");
if (spaRedirect) {
  sessionStorage.removeItem("spa-redirect");
  if (spaRedirect !== window.location.href) {
    window.history.replaceState(null, "", spaRedirect);
  }
}

const basename = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <SessionProvider>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </SessionProvider>
    </ThemeProvider>
  </StrictMode>,
);
