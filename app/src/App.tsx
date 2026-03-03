import { useState, useEffect } from "react";
import { SessionProvider } from "@/viewModel/SessionContext";
import ModeSelectionPage from "@/pages/ModeSelectionPage";
import SessionPage from "@/pages/SessionPage";
import SequenceBuilderPage from "@/pages/SequenceBuilderPage";
import PrivacyPage from "@/pages/PrivacyPage";
import AboutPage from "@/pages/AboutPage";

type Route = "/" | "/session" | "/builder" | "/privacy" | "/about";

function Router() {
  const [route, setRoute] = useState<Route>("/");
  const [streakRefresh, setStreakRefresh] = useState(0);

  useEffect(() => {
    const parseRoute = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#/session")) {
        setRoute("/session");
      } else if (hash.startsWith("#/builder")) {
        setRoute("/builder");
      } else if (hash.startsWith("#/privacy")) {
        setRoute("/privacy");
      } else if (hash.startsWith("#/about")) {
        setRoute("/about");
      } else {
        setRoute("/");
        // Refresh streak dashboard whenever returning to home
        setStreakRefresh((n) => n + 1);
      }
    };

    parseRoute();
    window.addEventListener("hashchange", parseRoute);
    return () => window.removeEventListener("hashchange", parseRoute);
  }, []);

  switch (route) {
    case "/session":
      return <SessionPage />;
    case "/builder":
      return <SequenceBuilderPage />;
    case "/privacy":
      return <PrivacyPage />;
    case "/about":
      return <AboutPage />;
    default:
      return <ModeSelectionPage streakRefresh={streakRefresh} />;
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
