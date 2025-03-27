
import { useState } from "react";
import { useNavigate } from "wouter";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Mic, Monitor } from "lucide-react";

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoLiveModal({ isOpen, onClose }: GoLiveModalProps) {
  const [, navigate] = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  const handleGoLive = () => {
    setIsChecking(true);
    // Simulate permission check and stream creation
    setTimeout(() => {
      onClose();
      navigate('/stream/new');
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Header>
          <Dialog.Title className="text-2xl font-bold">
            {isChecking ? "Checking permissions..." : "Go Live"}
          </Dialog.Title>
        </Dialog.Header>

        {!isChecking ? (
          <div className="space-y-4 mt-4">
            <div className="flex items-center space-x-3 text-muted-foreground">
              <Video className="h-5 w-5" />
              <span>Camera access required</span>
            </div>
            <div className="flex items-center space-x-3 text-muted-foreground">
              <Mic className="h-5 w-5" />
              <span>Microphone access required</span>
            </div>
            <div className="flex items-center space-x-3 text-muted-foreground">
              <Monitor className="h-5 w-5" />
              <span>Screen share access required</span>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleGoLive}>Start Stream</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Checking device permissions...</p>
          </div>
        )}
      </Dialog.Content>
    </Dialog>
  );
}
