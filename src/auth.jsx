import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokenStore, setUnauthorizedHandler } from "./api.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const toUser = (d) => {
  const u = d?.user ?? d ?? {};
  const email = u.email ?? u.username ?? "";
  return { id: u.id ?? u._id ?? u.user_id ?? email, name: u.name ?? u.full_name ?? u.username ?? email, email };
};
const clean = (e) => (e?.detail && e.status ? e.detail : e.message);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!tokenStore.get());

  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);
  useEffect(() => { setUnauthorizedHandler(logout); }, [logout]);

  // Restore session from a saved token
  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me().then((d) => setUser(toUser(d))).catch(() => tokenStore.clear()).finally(() => setReady(true));
  }, []);

  const finish = async (tokenResponse) => {
    const token = tokenResponse?.access_token ?? tokenResponse?.token;
    if (!token) throw new Error("The server did not return an access token.");
    tokenStore.set(token);
    try { setUser(toUser(await api.me())); }
    catch (e) { tokenStore.clear(); throw e; }
  };

  const login = async ({ email, password }) => {
    try { await finish(await api.login({ email: email.trim(), password })); }
    catch (e) { throw new Error(clean(e)); }
  };

  const signup = async ({ name, email, password }) => {
    if (!name.trim()) throw new Error("Please enter your name.");
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    try {
      const d = await api.register({ name: name.trim(), email: email.trim(), password });
      // Some backends return a token on register; otherwise log in right away
      if (d?.access_token || d?.token) await finish(d);
      else await finish(await api.login({ email: email.trim(), password }));
    } catch (e) { throw new Error(clean(e)); }
  };

  return <Ctx.Provider value={{ user, ready, signup, login, logout }}>{children}</Ctx.Provider>;
}
