
import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartPulse, Send, Bell, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageWrapper } from "@/components/lovebug/PageWrapper";
import { Navbar } from "@/components/lovebug/Navbar";
import { AuthContext } from "@/App";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Capacitor } from "@capacitor/core";

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

interface Connection {
  id: string;
  connected_user_id: string;
  profile?: {
    id: string;
    username: string;
    display_name: string;
  };
}

const Index = () => {
  const { user } = useContext(AuthContext);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const { toast } = useToast();
  const { permission, requestPermission, subscribe, sendNotification } = usePushNotifications();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    try {
      // First get the connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (connectionsError) throw connectionsError;
      
      // Then fetch profile data for each connection
      const connectionsWithProfiles = await Promise.all((connectionsData || []).map(async (connection) => {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .eq("id", connection.connected_user_id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return {
            ...connection,
            profile: {
              id: connection.connected_user_id,
              username: "Unknown",
              display_name: "Unknown User"
            }
          };
        }
        
        return {
          ...connection,
          profile: profileData
        };
      }));

      setConnections(connectionsWithProfiles);
      
      // If there are connections, select the first one by default
      if (connectionsWithProfiles.length > 0) {
        setSelectedConnection(connectionsWithProfiles[0].connected_user_id);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast({
        title: "Error",
        description: "Failed to load connections",
        variant: "destructive",
      });
    }
  };

  const handleEnableNotifications = async () => {
    const newPermission = await requestPermission();
    if (newPermission === 'granted') {
      const subscription = await subscribe();
      if (subscription) {
        toast({
          title: "Notifications enabled! 🔔",
          description: "You'll receive notifications when your LoveBugs are sent!",
          className: "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none",
        });
      }
    }
  };

  const handleSendLoveBug = async () => {
    if (!selectedConnection) {
      toast({
        title: "Select a connection",
        description: "Please select a connection to send your LoveBug!",
        variant: "destructive",
      });
      return;
    }

    setIsButtonClicked(true);
    setIsSending(true);

    try {
      // Generate personalized message with the selected connection
      const { data: generatedData, error: generationError } = await supabase.functions.invoke(
        'generate-lovebug', 
        { 
          body: { recipientId: selectedConnection } 
        }
      );
      
      if (generationError) throw generationError;

      const message = generatedData.message;

      // Find the selected connection's display name
      const selectedUser = connections.find(c => c.connected_user_id === selectedConnection);
      const recipientName = selectedUser?.profile?.display_name || 'your connection';

      // Save the message in the database
      const { error: dbError } = await supabase
        .from('messages')
        .insert([{ 
          sender_id: user.id, 
          recipient_id: selectedConnection, 
          message,
          phone_number: "deprecated" // Keeping for backward compatibility
        }]);

      if (dbError) throw dbError;

      // Send a push notification if enabled
      if (permission === 'granted') {
        await sendNotification(`LoveBug sent to ${recipientName}! 💌`);
      }

      toast({
        title: "LoveBug Sent! 💝",
        description: `Your AI-generated message of love has been sent to ${recipientName}! 🐞✨`,
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

  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="transform transition-all duration-300 hover:shadow-lg">
            <CardHeader className="text-center">
              <LoveBugLogo />
              <CardTitle className="text-3xl font-semibold text-red-500">Send a LoveBug</CardTitle>
              <p className="text-muted-foreground mt-2">Spread some AI-generated love to your connections!</p>
              {permission !== 'granted' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEnableNotifications}
                  className="mt-4"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable {isNative ? 'Native' : 'Web'} Notifications
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {connections.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">You don't have any connections yet!</p>
                  <Button 
                    variant="outline" 
                    className="bg-gradient-to-r from-pink-400 to-pink-500 text-white hover:from-pink-500 hover:to-pink-600 border-none"
                    onClick={() => window.location.href = '/connections'}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add Connections
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Choose a Connection</label>
                    <Select 
                      value={selectedConnection} 
                      onValueChange={setSelectedConnection}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a connection" />
                      </SelectTrigger>
                      <SelectContent>
                        {connections.map((connection) => (
                          <SelectItem 
                            key={connection.connected_user_id} 
                            value={connection.connected_user_id}
                          >
                            {connection.profile?.display_name || connection.profile?.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleSendLoveBug} 
                    size="lg"
                    disabled={isSending || !selectedConnection}
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
                </>
              )}
            </CardContent>
          </Card>

          <ReceivedLoveBugs userId={user?.id} />
        </div>
      </PageWrapper>
    </>
  );
};

// Component for received LoveBugs
const ReceivedLoveBugs = ({ userId }: { userId: string }) => {
  const [receivedLoveBugs, setReceivedLoveBugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchReceivedLoveBugs();
    }
  }, [userId]);

  const fetchReceivedLoveBugs = async () => {
    setLoading(true);
    try {
      // First get the messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select("id, message, created_at, sender_id")
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (messagesError) throw messagesError;
      
      // Then get the profile information for each sender
      const messagesWithProfiles = await Promise.all((messagesData || []).map(async (message) => {
        if (!message.sender_id) {
          return {
            ...message,
            profiles: {
              username: "Anonymous",
              display_name: "Anonymous"
            }
          };
        }
        
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("id", message.sender_id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return {
            ...message,
            profiles: {
              username: "Unknown",
              display_name: "Unknown User"
            }
          };
        }
        
        return {
          ...message,
          profiles: profileData
        };
      }));
      
      setReceivedLoveBugs(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching received LoveBugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="transform transition-all duration-300 hover:shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-red-500">Received LoveBugs</CardTitle>
        <p className="text-muted-foreground mt-2">Messages of love sent to you</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : receivedLoveBugs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No LoveBugs received yet</p>
            <p className="text-sm mt-2">Connect with others to start receiving messages!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {receivedLoveBugs.map((loveBug) => (
              <div key={loveBug.id} className="p-4 rounded-lg border bg-pink-50 hover:bg-pink-100 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-pink-600">
                    From: {loveBug.profiles?.display_name || loveBug.profiles?.username || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(loveBug.created_at)}</span>
                </div>
                <p className="text-gray-700">{loveBug.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Index;
