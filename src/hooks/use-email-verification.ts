
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContext } from 'react';
import { AuthContext } from '@/App';

export const useEmailVerification = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    const handleEmailVerification = async () => {
      // Check for verification parameter in URL
      const searchParams = new URLSearchParams(location.search);
      const isVerification = searchParams.get('verification') === 'true';
      
      if (isVerification) {
        console.log("Verification parameter detected in URL");
        
        // Clear URL params to prevent reprocessing on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        
        try {
          // Refresh the user session to see if verification was successful
          const { data, error } = await supabase.auth.getUser();
          
          if (error) {
            console.error('Verification check error:', error);
            toast({
              title: 'Verification check failed',
              description: error.message,
              variant: 'destructive',
            });
          } else if (data?.user?.email_confirmed_at) {
            console.log('Email verification successful:', data);
            toast({
              title: 'Verification successful',
              description: 'Your account has been verified. Welcome to LoveBug!',
              className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
            });
            
            // Navigate to home page if verification was successful and we're not already there
            if (location.pathname !== '/') {
              navigate('/');
            }
          } else {
            console.log('User found but not verified yet:', data?.user);
            
            // If we're on the auth page, we'll let that component handle verification UI
            if (location.pathname !== '/auth') {
              navigate('/auth?verification=true');
            }
          }
        } catch (error) {
          console.error('Verification check error:', error);
          toast({
            title: 'An error occurred',
            description: 'Something went wrong during verification check.',
            variant: 'destructive',
          });
        }
      }
    };

    if (!loading) {
      handleEmailVerification();
    }
  }, [location.search, navigate, toast, location.pathname, loading]);

  // If we have a user and they've confirmed their email, they are verified
  return { 
    isVerified: user ? !!user.email_confirmed_at : false,
    isLoaded: !!user
  };
};
