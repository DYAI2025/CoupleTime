import { useState, useCallback, useEffect } from "react";

type Route = "/" | "/session" | "/builder";

interface LocationState {
  mode?: unknown;
  isNew?: boolean;
}

export function useRouter() {
  const [path, setPath] = useState<Route>(
    (window.location.pathname as Route) || "/"
  );
  const [state, setState] = useState<LocationState>({});

  useEffect(() => {
    const handlePopState = () => {
      setPath((window.location.pathname as Route) || "/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((to: Route, options?: { state?: LocationState }) => {
    if (options?.state) {
      setState(options.state);
    }
    window.history.pushState({}, "", to);
    setPath(to);
  }, []);

  const useLocation = useCallback(() => {
    return { pathname: path, state };
  }, [path, state]);

  return { navigate, useLocation, path };
}

// Simple Navigate component
export function Navigate({ to, replace }: { to: Route; replace?: boolean }) {
  useEffect(() => {
    if (replace) {
      window.history.replaceState({}, "", to);
    } else {
      window.history.pushState({}, "", to);
    }
    window.location.href = to;
  }, [to, replace]);

  return null;
}
