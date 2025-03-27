import { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Progress } from "@/components/ui/progress";
import { User, Volume2, VolumeX, Maximize, Pause, Play } from "lucide-react";
import { type ClientStream } from "@shared/schema";

interface StreamPlayerProps {
  stream: ClientStream;
}

export default function StreamPlayer({ stream }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    
    // Get video source based on stream
    let videoSource = stream.videoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    
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

    const player = playerRef.current;
    
    // Wait for player to be ready
    player.ready(() => {
      setDuration(player.duration());
      
      // Listen for play/pause events
      player.on('play', () => setIsPlaying(true));
      player.on('pause', () => setIsPlaying(false));
      
      // Update progress and time
      player.on('timeupdate', () => {
        const currentTime = player.currentTime();
        const duration = player.duration();
        
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
      });
    });
    
    // Clean up
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [stream.thumbnailUrl, stream.videoUrl]);
  
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
  
  const toggleMute = () => {
    if (playerRef.current) {
      const player = playerRef.current;
      if (isMuted) {
        player.muted(false);
      } else {
        player.muted(true);
      }
      setIsMuted(!isMuted);
    }
  };
  
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !playerRef.current) return;
    
    const progressBar = progressBarRef.current;
    const player = playerRef.current;
    
    // Calculate click position as percentage of progress bar width
    const rect = progressBar.getBoundingClientRect();
    const clickPositionX = e.clientX - rect.left;
    const percentClicked = (clickPositionX / rect.width) * 100;
    
    // Set new time based on percentage
    const newTime = (percentClicked / 100) * player.duration();
    player.currentTime(newTime);
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
          <span className="bg-red-500 px-2 py-1 text-xs font-semibold rounded-md mr-2">LIVE</span>
          <span className="bg-zinc-800 bg-opacity-70 px-2 py-1 text-xs rounded-md viewer-count">
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
      <div className="bg-zinc-900 p-2 flex items-center">
        <button 
          onClick={togglePlay}
          className="text-white hover:text-primary p-2 focus:outline-none"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        
        <div 
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          className="mx-2 bg-zinc-700 rounded-full h-2 flex-grow overflow-hidden cursor-pointer"
        >
          <Progress value={progress} className="h-full" />
        </div>
        
        <span className="text-white text-xs mx-2">{currentTime}</span>
        
        <button 
          onClick={toggleMute}
          className="text-white hover:text-primary p-2 focus:outline-none"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        
        <button 
          onClick={() => playerRef.current?.requestFullscreen?.()}
          className="text-white hover:text-primary p-2 focus:outline-none ml-1"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
