
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HeartPulse, Send } from "lucide-react";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleSendLoveBug = () => {
    console.log("Sending LoveBug message...");
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-pink-50 to-white">
        <Card className="w-full max-w-md">
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
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-pink-50 to-white">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            {/* Ladybug antennae */}
            <div className="absolute -top-4 left-1/3 w-1 h-4 bg-black rotate-[-20deg] rounded-full" />
            <div className="absolute -top-4 right-1/3 w-1 h-4 bg-black rotate-[20deg] rounded-full" />
            
            {/* Ladybug body (red heart) */}
            <HeartPulse className="w-full h-full text-red-500 absolute top-0 left-0" />
            
            {/* Ladybug spots (black dots in a pattern) */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-black rounded-full" />
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-black rounded-full" />
            <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-black rounded-full" />
            <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-black rounded-full" />
            <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-black rounded-full" />
            <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-black rounded-full" />
            
            {/* Ladybug head */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-black rounded-full" />
          </div>
          <CardTitle className="text-3xl font-semibold text-red-500">Send a LoveBug</CardTitle>
          <p className="text-muted-foreground mt-2">Spread some happiness with a cute message!</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={handleSendLoveBug} 
            size="lg" 
            className="w-full bg-pink-400 hover:bg-pink-500 transition-all transform hover:scale-105 shadow-lg rounded-full font-semibold text-lg py-6 border-2 border-pink-300"
          >
            <Send className="mr-2 h-5 w-5" />
            Send LoveBug
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
