
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
      // Check for email confirmation token in URL
      // Supabase adds these params when redirecting from email verification
      const searchParams = new URLSearchParams(location.search);
      
      // Case 1: Handle redirect from email verification link
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      
      // Case 2: Handle redirect from our custom verification endpoint
      const isVerification = searchParams.get('verification') === 'true';
      const token = searchParams.get('token') || token_hash;

      // Handle email verification if applicable tokens are present
      if ((token_hash && type === 'email') || (isVerification && token && type)) {
        try {
          // Clear URL params to prevent reprocessing on refresh
          window.history.replaceState({}, document.title, window.location.pathname);
          
          console.log("Attempting to verify with token:", token, "type:", type);
          
          // Use the appropriate verification method based on token type
          let verifyResult;
          
          if (token_hash && type === 'email') {
            // This is Supabase's default email verification flow
            verifyResult = await supabase.auth.verifyOtp({
              token_hash,
              type: 'email',
            });
          } else {
            // This is our custom verification flow
            verifyResult = await supabase.auth.verifyOtp({
              token: token || '',
              type: 'signup',
              email: '' // Required by type but token contains the email
            });
          }
          
          const { data, error } = verifyResult;
          
          if (error) {
            console.error('Verification error:', error);
            toast({
              title: 'Verification failed',
              description: error.message,
              variant: 'destructive',
            });
            // Redirect to auth page if verification fails
            navigate('/auth');
          } else {
            console.log('Verification successful:', data);
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
  }, [location, navigate, toast]);
};
