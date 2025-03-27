import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, DollarSign, MoreHorizontal } from "lucide-react";
import { type ClientStream } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface StreamInfoProps {
  stream: ClientStream;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onDonate: () => void;
}

export default function StreamInfo({ 
  stream, 
  isFollowing, 
  onToggleFollow, 
  onDonate 
}: StreamInfoProps) {
  const formatStreamTime = (startedAt: string | undefined) => {
    if (!startedAt) return "Just started";
    try {
      return `Started ${formatDistanceToNow(new Date(startedAt), { addSuffix: true })}`;
    } catch (e) {
      return "Live now";
    }
  };
  
  return (
    <div className="mt-4">
      {/* Streamer info with avatar - similar to the one in your screenshot */}
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mr-3 overflow-hidden">
          {stream.streamer?.avatarUrl ? (
            <img 
              src={stream.streamer.avatarUrl} 
              alt={stream.streamer.displayName || stream.streamer.username || 'Streamer'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-lg font-bold">
              {stream.streamer?.username.slice(0, 2).toUpperCase() || 'ST'}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-light">{stream.title}</h1>
          <div className="flex items-center">
            <span className="text-gray-300 font-medium">
              {stream.streamer?.displayName || stream.streamer?.username}
            </span>
            <Badge className="bg-secondary text-xs rounded-md ml-2 mr-2">{stream.category}</Badge>
            <span className="text-sm text-gray-400">{formatStreamTime(stream.startedAt)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 mb-6">
        <Button
          onClick={onToggleFollow}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
            isFollowing 
              ? 'bg-error hover:bg-red-600 text-white' 
              : 'bg-primary hover:bg-purple-700 text-white'
          }`}
        >
          <Heart className="h-4 w-4 mr-2" />
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
        
        <Button
          onClick={onDonate}
          className="bg-accent hover:bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Donate
        </Button>
        
        <div className="relative">
          <Button
            variant="secondary"
            size="icon"
            className="hover:bg-lightgray text-light"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="bg-darkgray rounded-lg p-4">
        <h3 className="text-light font-medium mb-2">About the Stream</h3>
        <p className="text-gray-300 text-sm">
          {stream.description || 'No description provided.'}
        </p>
        
        {stream.tags && stream.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stream.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="px-2 py-1 text-xs rounded-md">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
