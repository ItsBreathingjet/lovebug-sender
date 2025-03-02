
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HeartPulse } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Try to get verification status from URL on initial load
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("verification") === "true") {
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      
      toast({
        title: "Email verification successful!",
        description: "Your email has been verified. You can now log in.",
        className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (showVerification) {
      const checkVerificationStatus = async () => {
        if (!pendingEmail) return;
        
        try {
          const { data, error } = await supabase.auth.getUser();
          
          if (data?.user && !error) {
            if (data.user.email_confirmed_at) {
              toast({
                title: "Email verified!",
                description: "Your email has been verified. Welcome to LoveBug!",
                className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
              });
              setShowVerification(false);
              navigate("/");
              return;
            }
          }
          
          setTimeout(checkVerificationStatus, 3000);
        } catch (error) {
          console.error("Error checking verification status:", error);
          setTimeout(checkVerificationStatus, 3000);
        }
      };
      
      checkVerificationStatus();
    }
  }, [showVerification, pendingEmail, toast, navigate]);

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
      // Use the current origin for the redirect URL, ensuring it's consistent
      const currentOrigin = window.location.origin;
      const redirectTo = `${currentOrigin}/auth?verification=true`;
      console.log("Sign-up with redirect URL:", redirectTo);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName || username,
          },
          emailRedirectTo: redirectTo,
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
        setPendingEmail(email);
        setShowVerification(true);
        setVerifying(true);
        
        // Double-check if the email has already been confirmed (rare but possible)
        if (data.user.email_confirmed_at) {
          toast({
            title: "Account already verified",
            description: "Your email is already verified. You can now log in.",
            className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
          });
          setShowVerification(false);
          navigate("/");
        } else {
          toast({
            title: "Verification email sent",
            description: "Please check your email (including spam folder) for a verification link. It may take a few minutes to arrive.",
            className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
          });
        }
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
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          console.log("User not verified:", data.user);
          toast({
            title: "Email not verified",
            description: "Please verify your email before logging in.",
            variant: "destructive",
          });
          setPendingEmail(email);
          setShowVerification(true);
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

  const resendVerificationEmail = async () => {
    if (!pendingEmail) return;
    
    setLoading(true);
    try {
      const currentOrigin = window.location.origin;
      const redirectTo = `${currentOrigin}/auth?verification=true`;
      console.log("Resending with redirect URL:", redirectTo);
      
      const { data, error } = await supabase.auth.resend({
        email: pendingEmail,
        type: 'signup',
        options: {
          emailRedirectTo: redirectTo,
        }
      });

      if (error) {
        console.error("Resend verification error:", error);
        toast({
          title: "Failed to resend email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log("Verification email resent:", data);
        toast({
          title: "Verification email resent",
          description: "Please check your email (including spam folder) for a verification link. It may take a few minutes to arrive.",
          className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
        });
        setVerifying(true);
      }
    } catch (error) {
      console.error("Unexpected resend verification error:", error);
      toast({
        title: "An error occurred",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-white to-pink-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <LoveBugLogo />
            <CardTitle className="text-3xl font-bold text-red-500">Verify your email</CardTitle>
            <p className="text-muted-foreground">
              We've sent a verification link to <strong>{pendingEmail}</strong>. Please check your email and click the link to verify your account.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Don't forget to check your spam or junk folder if you don't see it in your inbox.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 text-center">
            {verifying ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mb-4"></div>
                <p className="text-muted-foreground">Waiting for verification...</p>
                <p className="text-xs text-muted-foreground mt-2">
                  (This will automatically update when you click the verification link in your email)
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Haven't received the email? Check your spam folder or click the button below to resend the verification email.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resendVerificationEmail}
              disabled={loading || verifying}
              className="w-full mt-2"
            >
              {loading ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => setShowVerification(false)}
              className="mt-2"
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
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
