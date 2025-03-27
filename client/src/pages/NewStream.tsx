
import { useEffect, useState } from "react";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Video } from "lucide-react";

export default function NewStream() {
  const [, navigate] = useNavigate();
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    // Simulate stream setup
    const timer = setTimeout(() => {
      setIsStarting(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-6">
        {isStarting ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Starting Stream...</h2>
            <p className="text-muted-foreground">Setting up your broadcast</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Stream Setup</h2>
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="bg-zinc-900 rounded-lg aspect-video mb-6 flex items-center justify-center">
              <Video className="h-12 w-12 text-muted-foreground" />
            </div>

            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => navigate("/")}>
                Cancel
              </Button>
              <Button onClick={() => navigate("/stream/1")}>
                Go Live Now
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
