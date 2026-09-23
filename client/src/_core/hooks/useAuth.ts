import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { startLogin } from "@/const";
import { auth } from "../../firebase"; // Importante: ajuste este caminho para apontar para o seu arquivo firebase.ts recém-criado

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};

  // Estados locais para substituir o React Query/tRPC
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Observador em tempo real do Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (authError) => {
        setError(authError);
        setLoading(false);
      }
    );

    // Limpa o observador quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  // Função de Logout adaptada para o Firebase
  const logout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      // Limpeza de cache local e de sessão (mantendo a lógica original)
      try {
        sessionStorage.removeItem("manus-cookie");
        localStorage.removeItem("manus-runtime-user-info");
      } catch {}
      setIsLoggingOut(false);
    }
  }, []);

  // Memoriza o estado para evitar re-renderizações desnecessárias
  const state = useMemo(() => {
    if (user) {
      localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
    } else {
      localStorage.removeItem("manus-runtime-user-info");
    }

    return {
      user,
      loading: loading || isLoggingOut,
      error,
      isAuthenticated: Boolean(user),
    };
  }, [user, loading, isLoggingOut, error]);

  // Efeito de redirecionamento mantido idêntico ao original
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading || isLoggingOut) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin();
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    isLoggingOut,
    loading,
    state.user,
  ]);

  return {
    ...state,
    // O Firebase sincroniza automaticamente, então o refresh é apenas um fallback
    refresh: () => setLoading(true), 
    logout,
  };
}