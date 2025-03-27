import { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Progress } from "@/components/ui/progress";
import { User, Volume2, Maximize, Pause, Play } from "lucide-react";
import { type ClientStream } from "@shared/schema";

interface StreamPlayerProps {
  stream: ClientStream;
}

export default function StreamPlayer({ stream }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00:00");
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    
    // Get video source based on stream category
    let videoSource = "https://vjs.zencdn.net/v/oceans.mp4"; // Default video
    
    // Use different sample videos based on category
    if (stream.category === "Gaming") {
      videoSource = "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";
    } else if (stream.category === "Music") {
      videoSource = "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
    } else if (stream.category === "Food") {
      videoSource = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    }
    
    // Initialize Video.js player
    playerRef.current = videojs(videoElement, {
      autoplay: true,
      controls: false,
      responsive: true,
      fluid: true,
      poster: stream.thumbnailUrl,
      sources: [{
        src: videoSource,
        type: "video/mp4"
      }]
    });
    
    // Update progress and time
    const updateProgress = () => {
      if (playerRef.current) {
        const player = playerRef.current;
        const duration = player.duration();
        const currentTime = player.currentTime();
        
        if (duration > 0) {
          const progressPercent = (currentTime / duration) * 100;
          setProgress(progressPercent);
          
          // Format time as HH:MM:SS
          const hours = Math.floor(currentTime / 3600);
          const minutes = Math.floor((currentTime % 3600) / 60);
          const seconds = Math.floor(currentTime % 60);
          setCurrentTime(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
        }
      }
    };
    
    const progressInterval = setInterval(updateProgress, 1000);
    
    // Clean up
    return () => {
      clearInterval(progressInterval);
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [stream.thumbnailUrl, stream.category]);
  
  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Generate random viewer count with occasional small changes
  const [viewerCount, setViewerCount] = useState(stream.viewerCount);
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Random fluctuation between -5 and +5
      const change = Math.floor(Math.random() * 11) - 5;
      setViewerCount(prev => Math.max(1, prev + change));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-black rounded-lg overflow-hidden relative">
      <div className="aspect-w-16 aspect-h-9">
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered w-full h-full object-cover"
        />
        
        <div className="absolute top-3 left-3 flex items-center">
          <span className="bg-error px-2 py-1 text-xs font-semibold rounded-md mr-2">LIVE</span>
          <span className="bg-dark bg-opacity-70 px-2 py-1 text-xs rounded-md viewer-count">
            <User className="inline-block h-3 w-3 mr-1" />
            <span>{viewerCount.toLocaleString()}</span>
          </span>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center">
            <img 
              src={stream.streamer?.avatarUrl} 
              alt={stream.streamer?.displayName || 'Streamer'} 
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h2 className="text-lg font-bold text-white">{stream.title}</h2>
              <p className="text-sm text-gray-300">{stream.streamer?.displayName}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Video Controls */}
      <div className="bg-dark bg-opacity-90 p-2 flex items-center">
        <button 
          onClick={togglePlay}
          className="text-light hover:text-primary p-2 focus:outline-none"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        
        <div className="mx-2 bg-lightgray rounded-full h-1 flex-grow overflow-hidden">
          <Progress value={progress} className="h-full" />
        </div>
        
        <span className="text-light text-xs mx-2">{currentTime}</span>
        
        <button className="text-light hover:text-primary p-2 focus:outline-none">
          <Volume2 className="h-4 w-4" />
        </button>
        
        <button className="text-light hover:text-primary p-2 focus:outline-none ml-1">
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
