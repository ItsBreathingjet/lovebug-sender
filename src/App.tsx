
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createContext } from "react";
import { useRobotVerification } from "@/hooks/use-robot-verification";
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
  const { isRobotVerified, loading: verificationLoading } = useRobotVerification();
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  
  // If we're loading the user, show a loading indicator
  if (loading || verificationLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>;
  }
  
  // Check if this is the auth page
  const isAuthPage = location.pathname === '/auth';
  
  // User needs to be logged in and have passed the robot test to access protected routes
  const isAuthenticated = user && isRobotVerified;
  
  return (
    <Routes>
      <Route path="/auth" element={
        !isAuthenticated ? <Auth /> : <Navigate to="/" replace />
      } />
      <Route path="/" element={
        isAuthenticated ? <Index /> : <Navigate to="/auth" replace />
      } />
      <Route path="/connections" element={
        isAuthenticated ? <Connections /> : <Navigate to="/auth" replace />
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
    const fetchInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false); // Make sure to set loading to false if no user
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setLoading(false); // Make sure to set loading to false on error
      }
    };

    fetchInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false); // Make sure to set loading to false if no user
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
      } else if (error) {
        console.error("Error fetching profile:", error);
      }
      setLoading(false); // Always set loading to false when done
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
      setLoading(false); // Always set loading to false on error
    }
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
