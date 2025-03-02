
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

// Robot verification component
const RobotVerification = ({ onVerified }: { onVerified: () => void }) => {
  const [step, setStep] = useState(1);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setVerified } = useRobotVerification();
  const { toast } = useToast();

  // A simple set of questions that are easy for humans but hard for bots
  const questions = [
    {
      question: "What do you call a baby dog?",
      answer: "puppy"
    },
    {
      question: "What color is the sky on a clear day?",
      answer: "blue"
    },
    {
      question: "How many legs does a cat have?",
      answer: "4"
    }
  ];

  const currentQuestion = questions[step - 1];

  const handleAnswerSubmit = async () => {
    if (!answer.trim()) {
      setError("Please provide an answer");
      return;
    }

    // Check if the answer is correct (case insensitive)
    if (answer.trim().toLowerCase() === currentQuestion.answer) {
      if (step < questions.length) {
        // Move to the next question
        setStep(step + 1);
        setAnswer("");
        setError("");
      } else {
        // All questions answered correctly
        setLoading(true);
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
          setLoading(false);
        }
      }
    } else {
      setError("Incorrect answer. Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <LoveBugLogo />
        <CardTitle className="text-3xl font-bold text-red-500">Are you a robot?</CardTitle>
        <p className="text-muted-foreground">
          Please answer this simple question to verify you're human.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-medium">{currentQuestion.question}</h3>
        </div>

        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAnswerSubmit();
              }
            }}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Question {step} of {questions.length}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleAnswerSubmit}
          className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Submit Answer"}
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
        // Check if user has passed the robot verification
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
          // Sign out the user since we can't verify their status
          await supabase.auth.signOut();
        } else if (!profileData.is_robot_verified) {
          // User hasn't passed the robot verification
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
          // User is verified and can log in
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
      // If verification was required for login, take them to the home page
      navigate("/");
    } else {
      // If it was after signup, just hide the verification screen
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
        <RobotVerification onVerified={handleRobotVerificationComplete} />
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
