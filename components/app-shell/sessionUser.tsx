"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Role } from "@/lib/access";

/**
 * The signed-in person, for any part of the shell that needs them.
 *
 * <p>The private layout asks the backend once per page load and hands the
 * answer to `AppShell`, which puts it here. The sidebar's user box, the
 * navbar and Account settings read it from here instead of having it passed
 * through every component between them.
 */
export type SessionUser = {
  fullName: string;
  email: string;
  initials: string;
  role: Role;
};

const SessionUserContext = createContext<SessionUser | null>(null);

export function SessionUserProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  return <SessionUserContext.Provider value={user}>{children}</SessionUserContext.Provider>;
}

export function useSessionUser(): SessionUser {
  const user = useContext(SessionUserContext);
  if (!user) throw new Error("useSessionUser must be used inside the app shell.");
  return user;
}
