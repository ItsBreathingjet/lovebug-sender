
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
      <div className="w-full min-h-screen flex items-center justify-center p-4">
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
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Send a LoveBug</CardTitle>
          <p className="text-muted-foreground">Brighten their day with an AI-generated message</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Button onClick={handleSendLoveBug} size="lg" className="w-full">
            <Send className="mr-2 h-4 w-4" />
            Send LoveBug
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
