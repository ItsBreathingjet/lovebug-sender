
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HeartPulse } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRobotVerification } from "@/hooks/use-robot-verification";

const LoveBugLogo = () => (
  <div className="relative w-24 h-24 mx-auto mb-4">
    <div className="absolute -top-4 left-1/3 w-1 h-4 bg-black rotate-[-20deg] rounded-full" />
    <div className="absolute -top-4 right-1/3 w-1 h-4 bg-black rotate-[20deg] rounded-full" />
    <HeartPulse className="w-full h-full text-red-500 absolute top-0 left-0" />
    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-black rounded-full" />
    <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-black rounded-full" />
    <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-black rounded-full" />
    <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-black rounded-full" />
    <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-black rounded-full" />
    <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-black rounded-full" />
    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-black rounded-full" />
  </div>
);

const SimpleCaptcha = ({ onVerified }: { onVerified: () => void }) => {
  const [captchaText, setCaptchaText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setVerified, recordFailedAttempt, canAttemptVerification, lastAttemptTime } = useRobotVerification();
  const { toast } = useToast();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cooldownInterval, setCooldownInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    generateCaptcha();
    
    return () => {
      if (cooldownInterval) clearInterval(cooldownInterval);
    };
  }, []);

  useEffect(() => {
    if (lastAttemptTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const diffInSeconds = 60 - Math.floor((now.getTime() - lastAttemptTime.getTime()) / 1000);
        
        if (diffInSeconds <= 0) {
          setCooldownRemaining(0);
          clearInterval(interval);
        } else {
          setCooldownRemaining(diffInSeconds);
        }
      }, 1000);
      
      setCooldownInterval(interval);
      return () => clearInterval(interval);
    }
  }, [lastAttemptTime]);

  const generateCaptcha = () => {
    // Use only easily distinguishable characters
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) { // Shorter code (5 chars instead of 6)
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput("");
  };

  const handleVerify = async () => {
    if (!canAttemptVerification()) {
      setError(`Please wait ${cooldownRemaining} seconds before trying again.`);
      return;
    }

    setError("");
    
    // Make verification case-insensitive for better user experience
    if (userInput.toUpperCase() === captchaText) {
      setLoading(true);
      try {
        const success = await setVerified();
        
        if (success) {
          toast({
            title: "Verification successful",
            description: "You've proven you're not a robot!",
            className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
          });
          onVerified();
        } else {
          toast({
            title: "Verification failed",
            description: "There was an error saving your verification status.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error during verification:", error);
        toast({
          title: "Verification error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      recordFailedAttempt();
      setError("Verification failed. Please try again in 60 seconds.");
      toast({
        title: "Verification failed",
        description: "The CAPTCHA code was incorrect. Please try again after the cooldown period.",
        variant: "destructive",
      });
      generateCaptcha();
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <LoveBugLogo />
        <CardTitle className="text-3xl font-bold text-red-500">Are you a robot?</CardTitle>
        <p className="text-muted-foreground">
          Enter the text shown below to verify you're human.
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="flex justify-center">
          <div className="bg-gray-100 p-6 rounded-md relative">
            <div className="select-none text-2xl font-bold text-gray-800" 
                 style={{ 
                   fontFamily: 'monospace', 
                   letterSpacing: '0.5em',
                   padding: '0.5em'
                 }}>
              {captchaText}
            </div>
            {/* Reduced noise for better readability */}
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="absolute bg-gray-500"
                  style={{
                    height: '1px',
                    width: '100%',
                    top: `${20 + Math.random() * 60}%`,
                    transform: `rotate(${Math.random() * 10 - 5}deg)`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Enter the text above (case insensitive)"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={loading || cooldownRemaining > 0}
            className="text-center"
          />
        </div>

        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateCaptcha}
            disabled={loading || cooldownRemaining > 0}
          >
            New Code
          </Button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        
        {cooldownRemaining > 0 && (
          <div className="text-center text-amber-600">
            Please wait {cooldownRemaining} seconds before trying again.
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleVerify}
          className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600"
          disabled={loading || cooldownRemaining > 0 || !userInput}
        >
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRobotVerification, setShowRobotVerification] = useState(false);
  const [robotVerificationRequired, setRobotVerificationRequired] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isRobotVerified } = useRobotVerification();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password || !username) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName || username,
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (data?.user) {
        console.log("Sign up successful:", data);
        toast({
          title: "Sign up successful",
          description: "Now let's verify you're not a robot.",
          className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
        });
        
        setPendingUser(data.user);
        setShowRobotVerification(true);
      }
    } catch (error) {
      console.error("Unexpected sign up error:", error);
      toast({
        title: "An error occurred",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting sign in for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (data?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_robot_verified')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          toast({
            title: "Error checking verification status",
            description: "Please try again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
        } else if (!profileData.is_robot_verified) {
          console.log("User not robot-verified:", data.user);
          toast({
            title: "Verification required",
            description: "Please complete the verification before logging in.",
            variant: "destructive",
          });
          setPendingUser(data.user);
          setShowRobotVerification(true);
          setRobotVerificationRequired(true);
        } else {
          console.log("Sign in successful:", data.user);
          toast({
            title: "Sign in successful",
            description: "Welcome back to LoveBug!",
            className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
          });
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      toast({
        title: "An error occurred",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRobotVerificationComplete = () => {
    if (robotVerificationRequired) {
      navigate("/");
    } else {
      setShowRobotVerification(false);
      toast({
        title: "Verification complete",
        description: "You can now log in to your account.",
        className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
      });
    }
  };

  if (showRobotVerification) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-white to-pink-50">
        <SimpleCaptcha onVerified={handleRobotVerificationComplete} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-white to-pink-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <LoveBugLogo />
          <CardTitle className="text-3xl font-bold text-red-500">LoveBug</CardTitle>
          <p className="text-muted-foreground">Connect and spread love in a new way!</p>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Display Name (optional)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600"
                  disabled={loading}
                >
                  {loading ? "Signing up..." : "Sign Up"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
