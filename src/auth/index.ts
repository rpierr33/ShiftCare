import NextAuth from "next-auth";
import { authConfig } from "./config";

// Export NextAuth handlers and utilities for use across the app
// handlers: API route handlers for /api/auth/*
// auth: server-side session getter
// signIn/signOut: server actions for auth flow
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
