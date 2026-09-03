import { useCallback, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KEY = "medestoque:clinica-ativa";
let listeners: (() => void)[] = [];

function getSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(KEY);
}
function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
export function setClinicaAtiva(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(KEY, id);
  else window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export interface Sessao {
  userId: string | null;
  email: string | null;
  nome: string;
  isSuperuser: boolean;
  clinicaId: string | null;
  clinicaNome: string;
  carregando: boolean;
}

export function useSessao(): Sessao & { setClinicaAtiva: (id: string | null) => void } {
  const clinicaEscolhida = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const { data, isLoading } = useQuery({
    queryKey: ["sessao"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("nome, clinica_id, clinicas(nome)").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      return {
        userId: user.id,
        email: user.email ?? null,
        nome: (profile?.nome as string) || (user.email ?? ""),
        clinicaId: (profile?.clinica_id as string | null) ?? null,
        clinicaNome: ((profile as { clinicas?: { nome?: string } } | null)?.clinicas?.nome as string) ?? "",
        isSuperuser: (roles ?? []).some((r) => r.role === "superuser"),
      };
    },
  });

  const setter = useCallback((id: string | null) => setClinicaAtiva(id), []);

  const isSuperuser = data?.isSuperuser ?? false;
  const clinicaId = isSuperuser ? (clinicaEscolhida ?? data?.clinicaId ?? null) : (data?.clinicaId ?? null);

  return {
    userId: data?.userId ?? null,
    email: data?.email ?? null,
    nome: data?.nome ?? "",
    isSuperuser,
    clinicaId,
    clinicaNome: data?.clinicaNome ?? "",
    carregando: isLoading,
    setClinicaAtiva: setter,
  };
}
