import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store";
import { Bot } from "lucide-react";

interface UserListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userIds?: string[]; // If provided, show only these users (e.g. channel members)
  title?: string;
}

export default function UserListDialog({ isOpen, onClose, userIds, title = "All Users" }: UserListDialogProps) {
  const { users } = useAppStore();
  
  const displayUsers = userIds 
    ? users.filter(u => userIds.includes(u.id))
    : users;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {displayUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="relative">
                  <Avatar className="w-10 h-10 border border-gray-100">
                    {user.isBot ? (
                      <div className="w-full h-full bg-[var(--color-soft-cyan)] flex items-center justify-center text-white">
                        <Bot size={20} />
                      </div>
                    ) : (
                      <AvatarImage src="https://github.com/shadcn.png" />
                    )}
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                    user.status === 'online' ? 'bg-green-500' : 
                    user.status === 'busy' ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.isBot ? 'Bot' : 'User'} • {user.status}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
