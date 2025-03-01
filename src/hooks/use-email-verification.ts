
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
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const handleEmailVerification = async () => {
      // Check for verification parameter in URL
      const searchParams = new URLSearchParams(location.search);
      const isVerification = searchParams.get('verification') === 'true';
      
      if (isVerification) {
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

    handleEmailVerification();
  }, [location.search, navigate, toast, location.pathname]);

  // If we have a user and they've confirmed their email, they are verified
  return { 
    isVerified: user ? !!user.email_confirmed_at : false,
    isLoaded: !!user
  };
};
