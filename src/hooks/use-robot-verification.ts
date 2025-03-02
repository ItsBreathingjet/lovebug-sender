
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRobotVerification = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastAttemptTime, setLastAttemptTime] = useState<Date | null>(null);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if this user has passed the robot test
          const { data, error } = await supabase
            .from('profiles')
            .select('is_robot_verified')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Error checking robot verification:', error);
            setIsVerified(false);
          } else {
            setIsVerified(!!data?.is_robot_verified);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in robot verification check:', error);
        setLoading(false);
        setIsVerified(false);
      }
    };

    checkVerificationStatus();
  }, []);

  const setVerified = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update the user's profile to mark them as verified
        const { error } = await supabase
          .from('profiles')
          .update({ is_robot_verified: true })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating robot verification status:', error);
          return false;
        }
        
        setIsVerified(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting robot verification:', error);
      return false;
    }
  };

  const recordFailedAttempt = () => {
    setLastAttemptTime(new Date());
  };

  const canAttemptVerification = () => {
    if (!lastAttemptTime) return true;
    
    const now = new Date();
    const diffInSeconds = (now.getTime() - lastAttemptTime.getTime()) / 1000;
    return diffInSeconds >= 60; // 60 seconds (1 minute) cooldown
  };

  return { 
    isRobotVerified: isVerified,
    loading,
    setVerified,
    recordFailedAttempt,
    canAttemptVerification,
    lastAttemptTime
  };
};
