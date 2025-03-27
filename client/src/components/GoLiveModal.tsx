
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Video, Mic, Monitor } from "lucide-react";

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoLiveModal({ isOpen, onClose }: GoLiveModalProps) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  const handleGoLive = () => {
    setIsChecking(true);
    // Simulate permission check
    setTimeout(() => {
      // Create a new stream and redirect to it
      navigate('/stream/1'); // Using stream 1 for demo, you'd create a new one
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
        <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-background p-6 shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold mb-4">
            {isChecking ? "Checking permissions..." : "Go Live"}
          </h2>
          
          {!isChecking ? (
            <div className="space-y-4">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Checking permissions...</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
