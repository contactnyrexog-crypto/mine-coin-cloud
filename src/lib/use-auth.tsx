import { useEffect, useState } from "react";
import { getSession, isAdmin, type SessionUser } from "@/lib/local-db";

/**
 * Session state for the local account store. Reads are deferred to an effect so
 * server-rendered markup and the first client render agree.
 */
export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const s = getSession();
      setUser(s);
      setAdmin(s ? isAdmin(s.id) : false);
      setLoading(false);
    };
    sync();
    window.addEventListener("nethost:auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nethost:auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, isAdmin: admin, loading };
}
