
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  name: string;
  phone_number: string;
}

interface ContactsListProps {
  onSelectContact: (contact: Contact) => void;
}

export const ContactsList = ({ onSelectContact }: ContactsListProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const loadContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('last_used', { ascending: false });

    if (error) {
      toast({
        title: "Error loading contacts",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setContacts(data || []);
  };

  const saveContact = async () => {
    if (!newName || !newPhone) {
      toast({
        title: "Missing information",
        description: "Please provide both name and phone number",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert([{ name: newName, phone_number: newPhone }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error saving contact",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setContacts([...contacts, data]);
    setNewName("");
    setNewPhone("");
    setIsOpen(false);
    toast({
      title: "Contact saved!",
      description: `${newName} has been added to your contacts`,
      className: "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none",
    });
  };

  useState(() => {
    loadContacts();
  }, []);

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Contacts</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                placeholder="Phone Number"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <Button onClick={saveContact} className="w-full">
                Save Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {contacts.map((contact) => (
          <Button
            key={contact.id}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onSelectContact(contact)}
          >
            <User className="w-4 h-4 mr-2" />
            <span className="font-medium">{contact.name}</span>
            <span className="ml-2 text-muted-foreground">{contact.phone_number}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
