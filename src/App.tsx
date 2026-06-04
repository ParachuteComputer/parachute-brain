/**
 * Routing + the signed-in gate.
 *
 * - /oauth/callback   → always reachable (completes the OAuth dance).
 * - /connect          → the on-brand sign-in.
 * - everything else   → behind the Shell; redirected to /connect when not
 *                       signed in (and not in demo mode).
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "./data/SessionContext";
import { Shell } from "./components/Shell";
import { Connect } from "./views/Connect";
import { OAuthCallback } from "./views/OAuthCallback";
import { Today } from "./views/Today";
import { Now } from "./views/Now";
import { Work } from "./views/Work";
import { Decisions } from "./views/Decisions";
import { Strategy } from "./views/Strategy";
import { Feedback } from "./views/Feedback";
import { Meetings } from "./views/Meetings";
import { Team } from "./views/Team";
import { Weave } from "./views/Weave";
import { Detail } from "./views/Detail";

export function App() {
  const { signedIn } = useSession();

  return (
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/connect" element={<Connect />} />

      {signedIn ? (
        <Route element={<Shell />}>
          <Route index element={<Today />} />
          <Route path="now" element={<Now />} />
          <Route path="work" element={<Work />} />
          <Route path="decisions" element={<Decisions />} />
          <Route path="strategy" element={<Strategy />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="team" element={<Team />} />
          <Route path="weave" element={<Weave />} />
          <Route path="n/*" element={<Detail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/connect" replace />} />
      )}
    </Routes>
  );
}
