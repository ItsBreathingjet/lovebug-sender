
import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/App";
import { PageWrapper } from "@/components/lovebug/PageWrapper";
import { Check, X, UserPlus, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

const Connections = () => {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchPendingRequests();
    }
  }, [user]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from("connections")
        .select(`
          id,
          user_id,
          connected_user_id,
          status,
          created_at,
          profiles:connected_user_id(username, display_name, avatar_url)
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast({
        title: "Error",
        description: "Failed to load connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("connections")
        .select(`
          id,
          user_id,
          connected_user_id,
          status,
          created_at,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .eq("connected_user_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${searchTerm}%, display_name.ilike.%${searchTerm}%`)
        .neq("id", user.id)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Failed to search for users",
        variant: "destructive",
      });
    }
  };

  const sendConnectionRequest = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("connections")
        .insert([
          {
            user_id: user.id,
            connected_user_id: userId,
            status: "pending",
          },
        ]);

      if (error) throw error;

      toast({
        title: "Request sent",
        description: "Connection request sent successfully",
        className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
      });

      // Remove the user from search results
      setSearchResults(searchResults.filter((result) => result.id !== userId));
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast({
        title: "Request failed",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    }
  };

  const handleRequestAction = async (connectionId: string, status: "accepted" | "rejected") => {
    try {
      const { data, error } = await supabase
        .from("connections")
        .update({ status })
        .eq("id", connectionId);

      if (error) throw error;

      setPendingRequests(pendingRequests.filter((req) => req.id !== connectionId));
      
      if (status === "accepted") {
        // Refresh connections if request is accepted
        fetchConnections();
        toast({
          title: "Request accepted",
          description: "You are now connected",
          className: "bg-gradient-to-r from-pink-400 to-pink-500 text-white border-none",
        });
      } else {
        toast({
          title: "Request rejected",
          description: "Connection request rejected",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error ${status} connection request:`, error);
      toast({
        title: "Action failed",
        description: `Failed to ${status} the request`,
        variant: "destructive",
      });
    }
  };

  return (
    <PageWrapper>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="mr-4">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <CardTitle className="text-2xl text-pink-500">Manage Connections</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex gap-2">
              <Input
                placeholder="Search by username or display name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="outline">
                Search
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Search Results</h3>
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{result.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{result.username}</p>
                    </div>
                    <Button
                      onClick={() => sendConnectionRequest(result.id)}
                      size="sm"
                      variant="outline"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="connections" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Connections
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Requests {pendingRequests.length > 0 && (
                  <span className="ml-2 bg-pink-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="mt-4">
              {connections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No connections yet. Start connecting with others!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">{connection.profiles.display_name}</p>
                        <p className="text-sm text-muted-foreground">@{connection.profiles.username}</p>
                      </div>
                      <Link to="/">
                        <Button
                          variant="outline"
                          className="bg-gradient-to-r from-pink-400 to-pink-500 text-white hover:from-pink-500 hover:to-pink-600 border-none"
                        >
                          Send LoveBug
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="mt-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending connection requests</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">{request.profiles.display_name}</p>
                        <p className="text-sm text-muted-foreground">@{request.profiles.username}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRequestAction(request.id, "accepted")}
                          variant="outline"
                          size="sm"
                          className="text-green-500 border-green-500 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleRequestAction(request.id, "rejected")}
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default Connections;
