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
      {/* Match the layout from the screenshot */}
      <div className="flex flex-col">
        <div className="flex items-center mb-2">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mr-3 overflow-hidden">
            {stream.streamer?.avatarUrl ? (
              <img 
                src={stream.streamer.avatarUrl} 
                alt={stream.streamer.displayName || stream.streamer.username || 'Streamer'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Use a backup image if this one fails
                  e.currentTarget.src = "https://xsgames.co/randomusers/assets/avatars/male/1.jpg";
                }}
              />
            ) : (
              <span className="text-lg font-bold">
                {stream.streamer?.username.slice(0, 2).toUpperCase() || 'ST'}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-light">{stream.title}</h1>
            <div className="flex flex-row items-center gap-2">
              <span className="text-gray-300 font-medium">
                {stream.streamer?.displayName || stream.streamer?.username}
              </span>
              <span className="mt-0.5 bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-md">{stream.category}</span>
              <span className="text-sm text-gray-400">{formatStreamTime(stream.startedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons in a row as shown in the screenshot */}
      <div className="flex items-center gap-2 my-4">
        <Button
          onClick={onToggleFollow}
          className={`px-6 py-1.5 rounded-md font-medium flex items-center transition-colors ${
            isFollowing 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-primary hover:bg-purple-700 text-white'
          }`}
        >
          <Heart className="h-4 w-4 mr-2" />
          {isFollowing ? 'Following' : 'Follow'}
        </Button>

        <Button
          onClick={onDonate}
          variant="secondary"
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-1.5 rounded-md font-medium flex items-center"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Donate
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="bg-gray-800 hover:bg-gray-700 text-white rounded-md h-9 w-9"
          onClick={() => alert('More options menu would appear here')}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      <div className="border-t border-gray-800 pt-4">
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