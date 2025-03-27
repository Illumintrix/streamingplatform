import { useRef, useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { User, Volume2, Maximize, Pause, Play, ExternalLink } from "lucide-react";
import { type ClientStream } from "@shared/schema";

interface StreamPlayerProps {
  stream: ClientStream;
}

export default function StreamPlayer({ stream }: StreamPlayerProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [playerReady, setPlayerReady] = useState(false);
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  
  // Initialize YouTube Player API
  useEffect(() => {
    // Load YouTube API if not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      // Define the onYouTubeIframeAPIReady function
      (window as any).onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      setPlayerReady(true);
    }
  }, []);
  
  // Get YouTube Video ID from URL
  useEffect(() => {
    if (stream.videoUrl) {
      let videoId: string | null = null;

      try {
        // Handle multiple YouTube URL formats
        if (stream.videoUrl.includes('youtube.com/watch')) {
          // Regular youtube.com/watch?v=VIDEO_ID format
          videoId = new URL(stream.videoUrl).searchParams.get('v');
        } else if (stream.videoUrl.includes('youtu.be/')) {
          // Short youtu.be/VIDEO_ID format
          const urlParts = stream.videoUrl.split('youtu.be/');
          if (urlParts.length > 1) {
            videoId = urlParts[1].split('?')[0];
          }
        } else if (stream.videoUrl.includes('youtube.com/embed/')) {
          // Embed format youtube.com/embed/VIDEO_ID
          const urlParts = stream.videoUrl.split('youtube.com/embed/');
          if (urlParts.length > 1) {
            videoId = urlParts[1].split('?')[0];
          }
        }

        // If we got a videoId, use it
        if (videoId) {
          console.log("Found YouTube video ID:", videoId);
          setYoutubeVideoId(videoId);
        } else {
          console.warn("Could not extract YouTube video ID from URL:", stream.videoUrl);
        }
      } catch (error) {
        console.error("Error parsing YouTube URL:", stream.videoUrl, error);
      }
    }
  }, [stream.videoUrl]);
  
  // Initialize YouTube player when both API and videoId are ready
  useEffect(() => {
    if (playerReady && youtubeVideoId && playerContainerRef.current) {
      // Clear any existing content
      if (playerContainerRef.current.firstChild) {
        playerContainerRef.current.innerHTML = '';
      }
      
      // Create a div to hold the YouTube player
      const playerDiv = document.createElement('div');
      playerDiv.id = `youtube-player-${youtubeVideoId}`;
      playerContainerRef.current.appendChild(playerDiv);
      
      // Initialize the YouTube player
      const player = new (window as any).YT.Player(playerDiv.id, {
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: any) => {
            setYoutubePlayer(event.target);
            setIsPlaying(true);
          },
          onStateChange: (event: any) => {
            // Update play/pause state based on player state
            if (event.data === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          }
        }
      });
      
      // Store the iframe reference for styling
      setYoutubePlayer(player);
      
      // Find and style the iframe created by YouTube API
      setTimeout(() => {
        const iframe = playerDiv.querySelector('iframe');
        if (iframe) {
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.position = 'absolute';
          iframe.style.top = '0';
          iframe.style.left = '0';
          iframeRef.current = iframe;
        }
      }, 100);
    }
    
    return () => {
      if (youtubePlayer) {
        youtubePlayer.destroy();
      }
    };
  }, [playerReady, youtubeVideoId]);
  
  // Update progress and time for the YouTube player
  useEffect(() => {
    if (!youtubePlayer) return;
    
    const updateProgress = () => {
      try {
        if (youtubePlayer.getCurrentTime && youtubePlayer.getDuration) {
          const currentSecs = youtubePlayer.getCurrentTime();
          const duration = youtubePlayer.getDuration();
          
          if (duration > 0) {
            const progressPercent = (currentSecs / duration) * 100;
            setProgress(progressPercent);
            
            // Format time as HH:MM:SS
            const hours = Math.floor(currentSecs / 3600);
            const minutes = Math.floor((currentSecs % 3600) / 60);
            const seconds = Math.floor(currentSecs % 60);
            setCurrentTime(
              `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
          }
        }
      } catch (error) {
        console.error("Error updating progress", error);
      }
    };
    
    const progressInterval = setInterval(updateProgress, 1000);
    
    return () => {
      clearInterval(progressInterval);
    };
  }, [youtubePlayer]);
  
  // Toggle play/pause
  const togglePlay = () => {
    if (!youtubePlayer) return;
    
    try {
      if (isPlaying) {
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
      }
      // State will be updated by the onStateChange event
    } catch (error) {
      console.error("Error toggling play state", error);
    }
  };
  
  // Handle progress bar click to seek
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!youtubePlayer) return;
    
    try {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentClicked = (clickX / rect.width) * 100;
      const duration = youtubePlayer.getDuration();
      const seekTime = (percentClicked / 100) * duration;
      
      youtubePlayer.seekTo(seekTime, true);
    } catch (error) {
      console.error("Error seeking video", error);
    }
  };
  
  // Go to YouTube button
  const openYouTubeVideo = () => {
    if (stream.videoUrl) {
      window.open(stream.videoUrl, '_blank');
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
      <div className="aspect-16-9">
        {/* YouTube player container */}
        <div ref={playerContainerRef} className="w-full h-full"></div>
        
        {/* Overlay elements */}
        <div className="absolute top-3 left-3 flex items-center z-10">
          <span className="bg-red-600 px-2 py-1 text-xs font-semibold rounded-md mr-2">LIVE</span>
          <span className="bg-black bg-opacity-70 px-2 py-1 text-xs rounded-md viewer-count">
            <User className="inline-block h-3 w-3 mr-1" />
            <span>{viewerCount.toLocaleString()}</span>
          </span>
          <span className="bg-blue-600 px-2 py-1 text-xs font-semibold rounded-md ml-2">YOUTUBE</span>
        </div>
        
        <div className="absolute top-3 right-3 z-10">
          <button 
            onClick={openYouTubeVideo}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs font-semibold rounded-md flex items-center"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Watch on YouTube
          </button>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 z-10">
          <div className="flex items-center">
            <img 
              src={stream.streamer?.avatarUrl || 'https://ui-avatars.com/api/?name=YouTube&background=random'} 
              alt={stream.streamer?.displayName || 'YouTube Channel'} 
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h2 className="text-lg font-bold text-white">{stream.title}</h2>
              <p className="text-sm text-gray-300">{stream.streamer?.displayName || 'YouTube Channel'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Video Controls */}
      <div className="bg-black bg-opacity-90 p-2 flex items-center">
        <button 
          onClick={togglePlay}
          className="text-white hover:text-primary p-2 focus:outline-none"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        
        <div 
          className="mx-2 bg-gray-700 rounded-full h-2 flex-grow overflow-hidden cursor-pointer"
          onClick={handleProgressBarClick}
        >
          <Progress value={progress} className="h-full" />
        </div>
        
        <span className="text-white text-xs mx-2">{currentTime}</span>
        
        <button className="text-white hover:text-primary p-2 focus:outline-none">
          <Volume2 className="h-4 w-4" />
        </button>
        
        <button className="text-white hover:text-primary p-2 focus:outline-none ml-1" onClick={openYouTubeVideo}>
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
