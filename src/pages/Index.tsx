
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HeartPulse, Send, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageWrapper } from "@/components/lovebug/PageWrapper";
import { ContactsList } from "@/components/lovebug/ContactsList";
import { usePushNotifications } from "@/hooks/use-push-notifications";

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

const Index = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { permission, requestPermission, subscribe, sendNotification } = usePushNotifications();

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
      // Get contact name if available
      const { data: contactData } = await supabase
        .from('contacts')
        .select('name')
        .eq('phone_number', phoneNumber)
        .single();
      
      // Generate personalized message with the contact's name
      const { data: generatedData, error: generationError } = await supabase.functions.invoke(
        'generate-lovebug', 
        { 
          body: { phoneNumber } 
        }
      );
      
      if (generationError) throw generationError;

      const message = generatedData.message;

      const { error: dbError } = await supabase
        .from('messages')
        .insert([{ phone_number: phoneNumber, message }]);

      // Update last_used timestamp for the contact if it exists
      await supabase
        .from('contacts')
        .update({ last_used: new Date().toISOString() })
        .eq('phone_number', phoneNumber);

      if (dbError) throw dbError;

      // Send a push notification if enabled
      if (permission === 'granted') {
        const contactName = contactData?.name || 'Someone';
        await sendNotification(`LoveBug sent to ${contactName}! 💌`);
      }

      toast({
        title: "LoveBug Sent! 💝",
        description: "Your AI-generated message of love is flying through the digital skies! 🐞✨",
        className: "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none",
        duration: 3000,
      });
      
      setPhoneNumber("");
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
    <PageWrapper>
      <Card className="w-full max-w-md transform transition-all duration-300 hover:shadow-lg">
        <CardHeader className="text-center">
          <LoveBugLogo />
          <CardTitle className="text-3xl font-semibold text-red-500">Send a LoveBug</CardTitle>
          <p className="text-muted-foreground mt-2">Spread some AI-generated love to your special someone!</p>
          {permission !== 'granted' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEnableNotifications}
              className="mt-4"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          )}
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
          <ContactsList 
            onSelectContact={(contact) => setPhoneNumber(contact.phone_number)} 
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default Index;
