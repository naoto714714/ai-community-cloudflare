import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { fetchChannels, createChannel, updateChannel } from "@/lib/channel-api";
import { useAppStore } from "@/lib/store";
import { ME_USER_ID } from "@/lib/constants";

interface ChannelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  channelId?: string;
}

export default function ChannelDialog({ isOpen, onClose, mode, channelId }: ChannelDialogProps) {
  const { users, channels, setChannels, setActiveChannel } = useAppStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && channelId) {
        const channel = channels.find((c) => c.name === channelId);
        if (channel) {
          setName(channel.name);
          setDescription(channel.description);
          setSelectedMembers(channel.members);
        }
      } else {
        setName("");
        setDescription("");
        setSelectedMembers([ME_USER_ID]); // Always include self
      }
    }
  }, [isOpen, mode, channelId, channels]);

  const refreshChannels = async (selectName?: string) => {
    try {
      const normalized = await fetchChannels();
      setChannels(normalized);
      if (selectName && normalized.some((c) => c.name === selectName)) {
        setActiveChannel(selectName);
      }
    } catch (error) {
      console.error("Refresh channels failed", error);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;

    const payloadMembers = Array.from(new Set([...selectedMembers, ME_USER_ID]));

    setSubmitting(true);
    try {
      if (mode === "create") {
        const created = await createChannel({
          channel_id: name.trim(),
          description: description.trim(),
          members: payloadMembers,
        });

        const newName = created?.name ?? name.trim();
        await refreshChannels(newName);
      } else if (mode === "edit" && channelId) {
        await updateChannel({
          channel_id: name.trim(),
          description: description.trim(),
          members: payloadMembers,
        });

        await refreshChannels(channelId);
      }
    } catch (error) {
      console.error("Channel submit error", error);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
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
                {users
                  .filter((u) => u.id !== ME_USER_ID)
                  .map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedMembers.includes(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <Label htmlFor={`user-${user.id}`} className="cursor-pointer flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        {user.name}
                        <span className="text-xs text-gray-400">({user.personality})</span>
                      </Label>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : mode === "create" ? "Create" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
