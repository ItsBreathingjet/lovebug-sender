
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
  signOut: () => Promise<void>;
}>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

const queryClient = new QueryClient();

// We need to use a wrapper for routes to use hooks
const AppRoutes = () => {
  useEmailVerification();
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  
  // If still loading, show nothing (or could add a loading spinner)
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
    </div>;
  }
  
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
        console.log("Auth state changed:", _event, session?.user?.id);
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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
      } else {
        console.error("Error fetching profile:", error);
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      }
    } catch (error) {
      console.error("Exception during sign out:", error);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
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
