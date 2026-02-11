"use client";

import { createContext, useContext } from "react";
import { supabase } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

const SupabaseContext = createContext<SupabaseClient>(supabase);

export function useSupabase() {
  return useContext(SupabaseContext);
}

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}
