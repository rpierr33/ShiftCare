// Re-export NextAuth GET and POST handlers for the catch-all auth route
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
