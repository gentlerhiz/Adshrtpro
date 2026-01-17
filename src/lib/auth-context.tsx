"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn, setAuthToken, removeAuthToken } from "./queryClient";
import type { AuthUser } from "@shared/schema";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, telegramUsername?: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refetchUser: () => void;
  unlockLinkAnalytics: (linkId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json() as { token: string; user: AuthUser };
      
      // Store JWT token
      setAuthToken(data.token);
      
      return data.user;
    },
    onSuccess: (authUser) => {
      queryClient.setQueryData(["/api/auth/me"], authUser);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, telegramUsername }: { email: string; password: string; telegramUsername?: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", { email, password, telegramUsername });
      const data = await response.json() as { token: string; user: AuthUser };
      
      // Store JWT token
      setAuthToken(data.token);
      
      return data.user;
    },
    onSuccess: (authUser) => {
      queryClient.setQueryData(["/api/auth/me"], authUser);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Call server logout endpoint (no-op for JWT but allows server hooks)
      try {
        await apiRequest("POST", "/api/auth/logout");
      } catch (e) {
        // ignore server logout failures and still remove token locally
        console.warn("Server logout failed:", e);
      }
      // Remove JWT token locally
      removeAuthToken();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
  });

  const unlockLinkAnalytics = async (linkId: string): Promise<void> => {
    await apiRequest("POST", "/api/analytics/unlock", { linkId });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isLoggingOut: logoutMutation.isPending,
        login: async (email, password) => {
          const authUser = await loginMutation.mutateAsync({ email, password });
          return authUser;
        },
        register: async (email, password, telegramUsername) => {
          const authUser = await registerMutation.mutateAsync({ email, password, telegramUsername });
          return authUser;
        },
        logout: async () => {
          await logoutMutation.mutateAsync();
        },
        refetchUser: () => refetch(),
        unlockLinkAnalytics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
