import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore, Channel } from "@/lib/store";

interface ChannelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  channelId?: string;
}

export default function ChannelDialog({ isOpen, onClose, mode, channelId }: ChannelDialogProps) {
  const { users, channels, addChannel, updateChannel } = useAppStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && channelId) {
        const channel = channels.find(c => c.id === channelId);
        if (channel) {
          setName(channel.name);
          setDescription(channel.description);
          setSelectedMembers(channel.members);
        }
      } else {
        setName("");
        setDescription("");
        setSelectedMembers(["me"]); // Always include self
      }
    }
  }, [isOpen, mode, channelId, channels]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    if (mode === "create") {
      const newChannel: Channel = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description.trim(),
        members: selectedMembers,
        unread: 0,
        type: "public"
      };
      addChannel(newChannel);
    } else if (mode === "edit" && channelId) {
      updateChannel(channelId, {
        description: description.trim(),
        members: selectedMembers
      });
    }
    onClose();
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Channel" : "Edit Channel Details"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={mode === "edit"} // Name cannot be changed after creation as per requirement
              placeholder="e.g. project-beta"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Topic / Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
            />
          </div>
          <div className="grid gap-2">
            <Label>Members</Label>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              <div className="space-y-2">
                {users.filter(u => u.isBot).map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`user-${user.id}`} 
                      checked={selectedMembers.includes(user.id)}
                      onCheckedChange={() => toggleMember(user.id)}
                    />
                    <Label htmlFor={`user-${user.id}`} className="cursor-pointer flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {user.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>{mode === "create" ? "Create" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
