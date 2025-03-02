
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HeartPulse } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRobotVerification } from "@/hooks/use-robot-verification";
import { Slider } from "@/components/ui/slider";

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

const PuzzleVerification = ({ onVerified }: { onVerified: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const puzzlePieceRef = useRef<HTMLDivElement>(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [targetPosition, setTargetPosition] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setVerified, recordFailedAttempt, canAttemptVerification, lastAttemptTime } = useRobotVerification();
  const { toast } = useToast();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cooldownInterval, setCooldownInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const randomPosition = Math.floor(Math.random() * 60) + 20;
    setTargetPosition(randomPosition);
    
    drawPuzzleCanvas();
    
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

  const drawPuzzleCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(0, 0, width, height);
    
    const pieceWidth = width * 0.15;
    const pieceHeight = height * 0.8;
    const pieceX = width * (targetPosition / 100) - (pieceWidth / 2);
    const pieceY = height * 0.1;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pieceX, pieceY, pieceWidth, pieceHeight);
    
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
  };

  const updatePuzzlePiecePosition = (value: number) => {
    if (!puzzlePieceRef.current || !canvasRef.current) return;
    
    const canvasWidth = canvasRef.current.width;
    const pieceWidth = canvasWidth * 0.15;
    const offsetX = (value / 100) * canvasWidth - (pieceWidth / 2);
    
    puzzlePieceRef.current.style.left = `${offsetX}px`;
  };

  const handleSliderChange = (value: number[]) => {
    const position = value[0];
    setSliderValue(position);
    updatePuzzlePiecePosition(position);
  };

  const handleVerify = async () => {
    if (!canAttemptVerification()) {
      setError(`Please wait ${cooldownRemaining} seconds before trying again.`);
      return;
    }

    setError("");
    
    const difference = Math.abs(sliderValue - targetPosition);
    
    if (difference <= 3) {
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
    } else {
      recordFailedAttempt();
      setError("Verification failed. Please try again in 60 seconds.");
      toast({
        title: "Verification failed",
        description: "The puzzle piece wasn't placed correctly. Please try again after the cooldown period.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <LoveBugLogo />
        <CardTitle className="text-3xl font-bold text-red-500">Are you a robot?</CardTitle>
        <p className="text-muted-foreground">
          Slide the puzzle piece into the empty space to verify you're human.
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="relative w-full h-[150px] bg-gray-100 rounded-md overflow-hidden">
          <canvas ref={canvasRef} width="300" height="150" className="w-full h-full" />
          <div 
            ref={puzzlePieceRef} 
            className="absolute top-[15px] bg-pink-500 rounded-sm transition-all duration-100"
            style={{ 
              width: '15%', 
              height: '80%', 
              left: '0px'
            }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Slide to position the puzzle piece:</p>
          <Slider 
            value={[sliderValue]} 
            onValueChange={handleSliderChange} 
            max={100} 
            step={1}
            disabled={loading || cooldownRemaining > 0}
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        
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
          disabled={loading || cooldownRemaining > 0}
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
        <PuzzleVerification onVerified={handleRobotVerificationComplete} />
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
