/* eslint-disable react-refresh/only-export-components -- Shared context module exports its provider and hook; edits use a full reload. */
import {
  useRef,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  createApi,
  type ApiEnvelope,
  type SessionUser,
} from "../../../contracts/session";
export const api = createApi("shop");
interface State {
  user: SessionUser | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  accept: (user: SessionUser) => void;
  logout: () => Promise<void>;
}
const Context = createContext<State | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const generation = useRef(0);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const version = ++generation.current;
    try {
      const result = await api.auth<ApiEnvelope<SessionUser>>("/me");
      if (version !== generation.current) return;
      setUser(result.data);
      setError("");
    } catch (e) {
      if (version !== generation.current) return;
      if (e instanceof ApiError && [401, 403].includes(e.status)) setUser(null);
      setError(
        e instanceof ApiError && [401, 403].includes(e.status)
          ? ""
          : "Cannot connect to the server. Please retry.",
      );
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const clear = () => {
      void refresh();
    };
    const focus = () => {
      void refresh();
    };
    window.addEventListener("optical:unauthenticated", clear);
    window.addEventListener("focus", focus);
    return () => {
      window.removeEventListener("optical:unauthenticated", clear);
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  const logout = async () => {
    await api.auth("/logout", {});
    generation.current++;
    setUser(null);
  };
  return (
    <Context.Provider
      value={{
        user,
        loading,
        error,
        refresh,
        accept: (next) => {
          generation.current++;
          setUser(next);
          setLoading(false);
          setError("");
        },
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("SessionProvider required");
  return value;
}
