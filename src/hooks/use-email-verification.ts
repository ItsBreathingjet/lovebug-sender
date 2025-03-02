
import { useContext } from 'react';
import { AuthContext } from '@/App';

export const useEmailVerification = () => {
  const { user, loading } = useContext(AuthContext);

  // We're not verifying emails anymore, so all users are considered "verified"
  // We'll use a different mechanism to check if they've passed the robot test
  return { 
    isVerified: true,  // All users are considered "verified" from email perspective
    isLoaded: !!user,
  };
};
