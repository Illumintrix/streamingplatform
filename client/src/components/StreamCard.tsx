import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { type ClientStream } from "@shared/schema";

interface StreamCardProps {
  stream: ClientStream;
}

export default function StreamCard({ stream }: StreamCardProps) {
  return (
    <Link href={`/stream/${stream.id}`}>
      <Card className="bg-darkgray rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer border-none">
        <div className="relative">
          {stream.thumbnailUrl ? (
            <img 
              src={stream.thumbnailUrl} 
              alt={stream.title} 
              className="w-full h-36 object-cover"
              onError={(e) => {
                // Fallback to a placeholder if image fails to load
                e.currentTarget.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg";
              }}
            />
          ) : (
            <div className="w-full h-36 bg-zinc-800 flex items-center justify-center">
              <span className="text-zinc-400">No Thumbnail</span>
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            <span className="bg-error px-1.5 py-0.5 text-xs font-semibold rounded">
              LIVE
            </span>
            {stream.videoUrl?.includes('youtube.com') && (
              <span className="bg-red-600 px-1.5 py-0.5 text-xs font-semibold rounded">
                YOUTUBE
              </span>
            )}
          </div>
          <span className="absolute bottom-2 right-2 bg-dark bg-opacity-70 px-1.5 py-0.5 text-xs rounded">
            <User className="inline-block h-3 w-3 mr-1" /> 
            {stream.viewerCount.toLocaleString()}
          </span>
        </div>
        <CardContent className="p-3">
          <div className="flex">
            <Avatar className="w-8 h-8 mr-2">
              <AvatarImage 
                src={stream.streamer?.avatarUrl} 
                alt={stream.streamer?.displayName || stream.streamer?.username || 'Streamer'} 
              />
              <AvatarFallback>
                {stream.streamer?.username.slice(0, 2).toUpperCase() || 'ST'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-medium text-light line-clamp-1">{stream.title}</h3>
              <p className="text-xs text-gray-400">{stream.streamer?.displayName || stream.streamer?.username}</p>
              <p className="text-xs text-gray-400 mt-1">
                {stream.category} • {stream.viewerCount.toLocaleString()} viewers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
