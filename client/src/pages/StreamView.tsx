import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import StreamPlayer from "@/components/StreamPlayer";
import StreamInfo from "@/components/StreamInfo";
import ChatSidebar from "@/components/ChatSidebar";
import DonationModal from "@/components/DonationModal";
import DonationCelebration from "@/components/DonationCelebration";
import StreamCard from "@/components/StreamCard";
import { Skeleton } from "@/components/ui/skeleton";
import { type ClientStream } from "@shared/schema";

export default function StreamView() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/stream/:id");
  const streamId = params?.id ? parseInt(params.id) : null;

  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [donationDetails, setDonationDetails] = useState<{
    amount: number;
    message: string;
  } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Redirect if no stream ID
  useEffect(() => {
    if (!streamId) {
      setLocation("/");
    }
  }, [streamId, setLocation]);

  const { data: stream, isLoading } = useQuery<ClientStream>({
    queryKey: [`/api/streams/${streamId}`],
    enabled: !!streamId,
  });

  const { data: recommendedStreams = [] } = useQuery<ClientStream[]>({
    queryKey: [`/api/streams/${streamId}/recommended`],
    enabled: !!streamId,
  });

  // Handle donation completion
  const handleDonationComplete = (amount: number, message: string) => {
    setShowDonationModal(false);
    setDonationDetails({ amount, message });
    setShowCelebration(true);

    // Hide celebration after 5 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 5000);
  };

  if (!streamId) return null;

  return (
    <div className="min-h-screen bg-dark text-light">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:space-x-6">
          <div className="w-full md:w-3/4 mb-6 md:mb-0">
            {isLoading || !stream ? (
              <>
                <Skeleton className="w-full aspect-video mb-4" />
                <Skeleton className="h-24 w-full mb-4" />
              </>
            ) : (
              <>
                <StreamPlayer 
                  stream={stream} 
                />

                <StreamInfo 
                  stream={stream}
                  isFollowing={isFollowing}
                  onToggleFollow={() => setIsFollowing(!isFollowing)}
                  onDonate={() => setShowDonationModal(true)}
                />

                <div className="mt-8">
                  <h2 className="text-lg font-bold text-light mb-4">Recommended Streams</h2>
                  {recommendedStreams.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendedStreams.map(stream => (
                        <StreamCard key={stream.id} stream={stream} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No recommended streams</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="w-full md:w-1/4">
            <ChatSidebar streamId={streamId} userId={1} />
          </div>
        </div>
      </div>

      {stream && (
        <>
          <DonationModal 
            isOpen={showDonationModal}
            onClose={() => setShowDonationModal(false)}
            streamId={streamId}
            streamer={stream.streamer}
            userId={1}
            onDonationComplete={handleDonationComplete}
          />

          {showCelebration && donationDetails && (
            <div className="fixed top-4 right-4 z-50 bg-primary text-white p-4 rounded-lg shadow-lg border-2 border-accent">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Thank you for your donation!</h2>
                <p className="font-semibold">Amount: ${donationDetails.amount}</p>
                <p className="font-medium">Message: {donationDetails.message}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}