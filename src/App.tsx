
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createContext } from "react";
import { useEmailVerification } from "@/hooks/use-email-verification";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Connections from "./pages/Connections";
import NotFound from "./pages/NotFound";

export const AuthContext = createContext<{
  session: any;
  user: any;
  profile: any;
  loading: boolean;
}>({
  session: null,
  user: null,
  profile: null,
  loading: true,
});

const queryClient = new QueryClient();

// We need to use a wrapper for routes to use hooks
const AppRoutes = () => {
  useEmailVerification();
  const { user } = useContext(AuthContext);
  
  return (
    <Routes>
      <Route path="/auth" element={
        !user ? <Auth /> : <Navigate to="/" replace />
      } />
      <Route path="/" element={
        user ? <Index /> : <Navigate to="/auth" replace />
      } />
      <Route path="/connections" element={
        user ? <Connections /> : <Navigate to="/auth" replace />
      } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ session, user, profile, loading }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
