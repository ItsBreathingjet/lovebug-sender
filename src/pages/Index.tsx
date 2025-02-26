import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HeartPulse, Send, Heart, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const generateHeartProps = () => {
  return [...Array(12)].map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 5 + Math.random() * 5,
    delay: Math.random() * 5,
    scale: 0.5 + Math.random() * 1,
  }));
};

const FloatingHearts = () => {
  const heartProps = useMemo(() => generateHeartProps(), []);
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {heartProps.map((props, i) => (
        <Heart
          key={i}
          className={`absolute animate-float text-pink-${300 + (i % 3) * 100} opacity-50`}
          style={{
            left: props.left,
            top: props.top,
            animation: `float ${props.duration}s infinite`,
            animationDelay: `${props.delay}s`,
            transform: `scale(${props.scale})`,
          }}
        />
      ))}
    </div>
  );
};

const DecorationSparkles = () => (
  <>
    <Sparkles className="absolute top-10 left-10 text-pink-400 animate-pulse" />
    <Sparkles className="absolute bottom-10 right-10 text-pink-400 animate-pulse" />
    <Sparkles className="absolute top-10 right-10 text-pink-400 animate-pulse" />
    <Sparkles className="absolute bottom-10 left-10 text-pink-400 animate-pulse" />
  </>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-full min-h-screen flex items-center justify-center p-4 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-pink-100 via-white to-pink-50" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,182,255,0.1),rgba(255,182,255,0))]" />
    <FloatingHearts />
    <DecorationSparkles />
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleSendLoveBug = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number to send your LoveBug!",
        variant: "destructive",
      });
      return;
    }

    setIsButtonClicked(true);
    setIsSending(true);

    try {
      const { data: generatedData, error: generationError } = await supabase.functions.invoke('generate-lovebug');
      
      if (generationError) throw generationError;

      const message = generatedData.message;

      const { error: dbError } = await supabase
        .from('messages')
        .insert([{ phone_number: phoneNumber, message }]);

      if (dbError) throw dbError;

      toast({
        title: "LoveBug Sent! 💝",
        description: "Your AI-generated message of love is flying through the digital skies! 🐞✨",
        className: "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error sending LoveBug:', error);
      toast({
        title: "Error sending LoveBug",
        description: "Something went wrong. Please try again!",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setIsButtonClicked(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <PageWrapper>
        <Card className="w-full max-w-md transform transition-all duration-300 hover:shadow-lg">
          <CardHeader className="text-center">
            <HeartPulse className="w-12 h-12 mx-auto mb-4 text-pink-500" />
            <CardTitle className="text-2xl font-semibold">LoveBug</CardTitle>
            <p className="text-muted-foreground">Stay connected with your loved one</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Card className="w-full max-w-md transform transition-all duration-300 hover:shadow-lg">
        <CardHeader className="text-center">
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
          <CardTitle className="text-3xl font-semibold text-red-500">Send a LoveBug</CardTitle>
          <p className="text-muted-foreground mt-2">Spread some AI-generated love to your special someone!</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-center text-lg"
          />
          <Button 
            onClick={handleSendLoveBug} 
            size="lg"
            disabled={isSending}
            className={`
              w-full 
              bg-gradient-to-r from-pink-400 to-pink-500
              hover:from-pink-500 hover:to-pink-600
              transition-all duration-300
              transform hover:scale-105
              shadow-lg 
              rounded-full 
              font-semibold 
              text-lg 
              py-6 
              border-4 
              border-pink-300
              relative
              overflow-hidden
              ${isButtonClicked ? 'animate-bounce' : ''}
              before:content-['']
              before:absolute
              before:top-0
              before:left-0
              before:w-full
              before:h-full
              before:bg-white
              before:opacity-0
              before:transition-opacity
              hover:before:opacity-10
              active:scale-95
              active:shadow-inner
              disabled:opacity-50
              disabled:cursor-not-allowed
            `}
            style={{
              boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
            }}
          >
            <div className="relative z-10 flex items-center justify-center">
              <Send className={`mr-2 h-5 w-5 ${isSending ? 'animate-spin' : 'animate-pulse'}`} />
              {isSending ? 'Sending...' : 'Send LoveBug'}
            </div>
          </Button>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default Index;
