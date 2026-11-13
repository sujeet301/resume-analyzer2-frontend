import React, { createContext, useContext, useState } from "react";

const USERS = "resumeai_users";
const SESSION = "resumeai_session";
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const readUsers = () => { try { return JSON.parse(localStorage.getItem(USERS)) || {}; } catch { return {}; } };
const writeUsers = (u) => localStorage.setItem(USERS, JSON.stringify(u));

async function sha256(text) {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return btoa(unescape(encodeURIComponent(text))); // fallback on non-secure origins
}
const randomSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => b.toString(16).padStart(2, "0")).join("");
const publicUser = (u) => ({ name: u.name, email: u.email });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem(SESSION);
    const u = email && readUsers()[email];
    return u ? publicUser(u) : null;
  });

  const signup = async ({ name, email, password }) => {
    email = email.trim().toLowerCase();
    name = name.trim();
    if (!name) throw new Error("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Please enter a valid email address.");
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    const users = readUsers();
    if (users[email]) throw new Error("An account with this email already exists. Please sign in.");
    const salt = randomSalt();
    users[email] = { name, email, salt, hash: await sha256(salt + password), created: Date.now() };
    writeUsers(users);
    localStorage.setItem(SESSION, email);
    setUser(publicUser(users[email]));
  };

  const login = async ({ email, password }) => {
    email = email.trim().toLowerCase();
    const u = readUsers()[email];
    if (!u || (await sha256(u.salt + password)) !== u.hash) throw new Error("Incorrect email or password.");
    localStorage.setItem(SESSION, email);
    setUser(publicUser(u));
  };

  const logout = () => { localStorage.removeItem(SESSION); setUser(null); };

  return <Ctx.Provider value={{ user, signup, login, logout }}>{children}</Ctx.Provider>;
}
