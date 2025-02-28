
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEmailVerification = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleEmailVerification = async () => {
      const searchParams = new URLSearchParams(location.search);
      const isVerification = searchParams.get('verification') === 'true';
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (isVerification && token && type) {
        try {
          // Clear URL params first to prevent reprocessing on page refresh
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Attempt to verify with the token
          const { data, error } = await supabase.auth.verifyOtp({
            token,
            type: 'signup',
          });

          if (error) {
            toast({
              title: 'Verification failed',
              description: error.message,
              variant: 'destructive',
            });
            // Redirect to auth page if verification fails
            navigate('/auth');
          } else {
            toast({
              title: 'Verification successful',
              description: 'Your account has been verified. Welcome to LoveBug!',
              className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
            });
            // If already on home page, no need to redirect
            if (location.pathname !== '/') {
              navigate('/');
            }
          }
        } catch (error) {
          console.error('Verification error:', error);
          toast({
            title: 'An error occurred',
            description: 'Something went wrong during verification.',
            variant: 'destructive',
          });
          navigate('/auth');
        }
      }
    };

    handleEmailVerification();
  }, [location]);
};
