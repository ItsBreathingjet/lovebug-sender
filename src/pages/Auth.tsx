
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HeartPulse } from "lucide-react";

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
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate the form data
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
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setPendingEmail(email);
        setShowVerification(true);
        toast({
          title: "Verification email sent",
          description: "Please check your email for a verification code.",
          className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: verificationCode,
        type: 'signup',
      });

      if (error) {
        toast({
          title: "Verification failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification successful",
          description: "Your account has been verified. Welcome to LoveBug!",
          className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
        });
        setShowVerification(false);
        // Verification successful - user is now signed in
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      console.error("Verification error:", error);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign in successful",
          description: "Welcome back to LoveBug!",
          className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    if (!pendingEmail) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resend({
        email: pendingEmail,
        type: 'signup',
      });

      if (error) {
        toast({
          title: "Failed to resend code",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification email resent",
          description: "Please check your email for a new verification code.",
          className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      console.error("Resend verification error:", error);
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
              We've sent a verification code to {pendingEmail}. Please check your email and enter the code below.
            </p>
          </CardHeader>
          <form onSubmit={handleVerification}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Verification Code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resendVerificationCode}
                disabled={loading}
                className="w-full mt-2"
              >
                Resend Verification Code
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
          </form>
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
