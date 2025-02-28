
import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import { HeartPulse, Users, LogOut } from "lucide-react";

export const Navbar = () => {
  const { user, profile, signOut } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error during sign out:", error);
      toast({
        title: "Error signing out",
        description: "An error occurred while signing out",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-sm">
      <Link to="/" className="flex items-center gap-2">
        <HeartPulse className="h-6 w-6 text-pink-500" />
        <span className="text-xl font-bold text-pink-500">LoveBug</span>
      </Link>
      
      <div className="flex items-center gap-4">
        {profile && (
          <div className="hidden md:block">
            <span className="text-sm font-medium">
              {profile.display_name || profile.username}
            </span>
          </div>
        )}
        
        <Link to="/connections">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Connections</span>
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleSignOut}
          className="text-gray-500 hover:text-gray-700"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline ml-1">Sign Out</span>
        </Button>
      </div>
    </nav>
  );
};
