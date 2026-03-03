import { useState, useEffect } from "react";
import { SessionProvider } from "@/viewModel/SessionContext";
import ModeSelectionPage from "@/pages/ModeSelectionPage";
import SessionPage from "@/pages/SessionPage";
import SetupPage from "@/pages/SetupPage";
import SequenceBuilderPage from "@/pages/SequenceBuilderPage";
import PrivacyPage from "@/pages/PrivacyPage";
import AboutPage from "@/pages/AboutPage";

type Route = "/" | "/session" | "/setup" | "/builder" | "/privacy" | "/about";

function Router() {
  const [route, setRoute] = useState<Route>("/");
  const [streakRefresh, setStreakRefresh] = useState(0);

  useEffect(() => {
    const parse = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#/session"))  { setRoute("/session");  return; }
      if (hash.startsWith("#/setup"))    { setRoute("/setup");    return; }
      if (hash.startsWith("#/builder"))  { setRoute("/builder");  return; }
      if (hash.startsWith("#/privacy"))  { setRoute("/privacy");  return; }
      if (hash.startsWith("#/about"))    { setRoute("/about");    return; }
      setRoute("/");
      setStreakRefresh(n => n + 1);
    };
    parse();
    window.addEventListener("hashchange", parse);
    return () => window.removeEventListener("hashchange", parse);
  }, []);

  switch (route) {
    case "/session": return <SessionPage />;
    case "/setup":   return <SetupPage />;
    case "/builder": return <SequenceBuilderPage />;
    case "/privacy": return <PrivacyPage />;
    case "/about":   return <AboutPage />;
    default:         return <ModeSelectionPage streakRefresh={streakRefresh} />;
  }
}

function App() {
  return (
    <SessionProvider>
      <Router />
    </SessionProvider>
  );
}

export default App;
