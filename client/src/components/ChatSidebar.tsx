import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Settings, SmilePlus, Send } from "lucide-react";
import { createSocket, closeSocket } from "@/lib/socket";
import { type ClientChatMessage } from "@shared/schema";

interface ChatSidebarProps {
  streamId: number;
  userId: number;
}

export default function ChatSidebar({ streamId, userId }: ChatSidebarProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ClientChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialMessagesRef = useRef<ClientChatMessage[]>([]);
  
  // Fetch initial chat messages
  const { data: initialMessages } = useQuery<ClientChatMessage[]>({
    queryKey: [`/api/streams/${streamId}/chat`],
  });
  
  // Set up WebSocket connection
  useEffect(() => {
    const newSocket = createSocket();
    
    newSocket.onopen = () => {
      console.log('WebSocket connected');
      // Join the chat room for this stream
      newSocket.send(JSON.stringify({ 
        type: 'join', 
        streamId 
      }));
    };
    
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'history':
          setMessages(data.messages);
          break;
          
        case 'chat':
        case 'donation':
          setMessages(prev => [...prev, data.message]);
          break;
          
        case 'error':
          console.error('WebSocket error:', data.message);
          break;
      }
    };
    
    setSocket(newSocket);
    
    return () => {
      // Leave the chat room
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.send(JSON.stringify({ type: 'leave' }));
      }
      closeSocket(newSocket);
    };
  }, [streamId]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Set initial messages when they load
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      initialMessagesRef.current = initialMessages;
    }
  }, [initialMessages]);
  
  // Simulate dynamic chat activity by adding a random message every few seconds
  useEffect(() => {
    if (!initialMessages || initialMessages.length < 2) return;
    
    // Store initial messages for reuse
    initialMessagesRef.current = initialMessages;
    
    const addRandomMessage = () => {
      if (initialMessagesRef.current.length === 0) return;
      
      // Decide whether to add a regular message or a donation (1 in 10 chance for donation)
      const shouldAddDonation = Math.random() < 0.1;
      
      if (shouldAddDonation) {
        // Add a donation message
        const randomUser = initialMessagesRef.current[Math.floor(Math.random() * initialMessagesRef.current.length)];
        
        const donationMessages = [
          "Keep up the great work!",
          "Love your streams!",
          "Amazing content as always",
          "You're the best streamer out there!",
          "This is for that awesome move earlier",
          "Thanks for the entertainment!",
          "Great stream today!",
          "Here's a little something for you",
          "I'm a huge fan!",
          "Keep the good content coming!"
        ];
        
        const donationMessage: ClientChatMessage = {
          id: Date.now(),
          streamId,
          userId: randomUser.userId,
          username: randomUser.username,
          displayName: randomUser.displayName,
          avatarUrl: randomUser.avatarUrl,
          message: donationMessages[Math.floor(Math.random() * donationMessages.length)],
          timestamp: new Date().toISOString(),
          isDonation: true,
          donationAmount: Math.floor(Math.random() * 50) + 5 // Random amount between $5-$55
        };
        
        // Add the donation to the chat
        setMessages(prev => {
          const updatedMessages = [...prev, donationMessage];
          if (updatedMessages.length > 50) {
            return updatedMessages.slice(updatedMessages.length - 50);
          }
          return updatedMessages;
        });
      } else {
        // Add a regular chat message
        const randomIndex = Math.floor(Math.random() * initialMessagesRef.current.length);
        const randomMessage = initialMessagesRef.current[randomIndex];
        
        // Create a new message based on the random one, but with a new ID and timestamp
        const newMessage: ClientChatMessage = {
          ...randomMessage,
          id: Date.now(), // Use timestamp as a unique ID
          timestamp: new Date().toISOString()
        };
        
        // Add the message to the chat
        setMessages(prev => {
          // Keep only the last 50 messages to avoid performance issues
          const updatedMessages = [...prev, newMessage];
          if (updatedMessages.length > 50) {
            return updatedMessages.slice(updatedMessages.length - 50);
          }
          return updatedMessages;
        });
      }
    };
    
    // Add a random message every 2-5 seconds for a more active chat
    const interval = setInterval(() => {
      addRandomMessage();
    }, Math.random() * 3000 + 2000); // Between 2-5 seconds
    
    return () => clearInterval(interval);
  }, [initialMessages, streamId]);
  
  const sendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !input.trim()) return;
    
    // Create a new message
    const newMessage: ClientChatMessage = {
      id: Date.now(),
      streamId,
      userId,
      username: "You",
      displayName: "You",
      message: input.trim(),
      timestamp: new Date().toISOString(),
      isDonation: false
    };
    
    // Add it to the messages
    setMessages(prev => [...prev, newMessage]);
    
    // In a real app, would also send to the server
    socket.send(JSON.stringify({
      type: 'message',
      content: input.trim(),
      userId
    }));
    
    setInput('');
  };
  
  const getMessageColor = (message: ClientChatMessage) => {
    if (message.isDonation) return 'text-gold';
    
    // Special color for the user's own messages
    if (message.username === "You") return 'text-blue-400';
    
    // Generate consistent color based on username
    const colors = ['text-primary', 'text-accent', 'text-error', 'text-purple-300', 'text-green-300', 'text-blue-300', 'text-yellow-300'];
    const index = message.username.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };
  
  // Add a donation randomly (1 in 20 chance when adding a random message)
  const simulateDonation = (chance = 20) => {
    if (Math.random() * chance < 1 && initialMessagesRef.current.length > 0) {
      const randomUser = initialMessagesRef.current[Math.floor(Math.random() * initialMessagesRef.current.length)];
      
      const donationMessages = [
        "Keep up the great work!",
        "Love your streams!",
        "Amazing content as always",
        "You're the best streamer out there!",
        "This is for that awesome move earlier"
      ];
      
      const donationMessage: ClientChatMessage = {
        id: Date.now(),
        streamId,
        userId: randomUser.userId,
        username: randomUser.username,
        displayName: randomUser.displayName,
        avatarUrl: randomUser.avatarUrl,
        message: donationMessages[Math.floor(Math.random() * donationMessages.length)],
        timestamp: new Date().toISOString(),
        isDonation: true,
        donationAmount: Math.floor(Math.random() * 50) + 5 // Random amount between $5-$55
      };
      
      setMessages(prev => [...prev, donationMessage]);
    }
  };
  
  return (
    <div className="bg-darkgray rounded-lg overflow-hidden flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="bg-secondary p-3 border-b border-lightgray">
        <h2 className="font-medium text-light flex items-center justify-between">
          <span>Stream Chat</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-light"
            onClick={() => simulateDonation(1)} // Force a donation for testing
          >
            <Settings className="h-4 w-4" />
          </Button>
        </h2>
      </div>
      
      {/* Chat Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-grow p-3 overflow-y-auto space-y-3"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`chat-message ${message.isDonation ? 'donation-animation bg-gold bg-opacity-10 p-2 rounded' : ''}`}
          >
            {message.isDonation ? (
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={message.avatarUrl} alt={message.displayName || message.username} />
                  <AvatarFallback>{message.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-gold font-bold">
                    {message.displayName || message.username} donated ${message.donationAmount}!
                  </div>
                  <p className="text-light text-sm">{message.message}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start">
                <span className={`font-medium ${getMessageColor(message)} mr-2`}>
                  {message.displayName || message.username}:
                </span>
                <span className="text-light text-sm">{message.message}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Chat Input */}
      <div className="p-3 border-t border-lightgray">
        <div className="flex items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Send a message"
            className="bg-secondary border-none rounded-l-md py-2 px-3 text-light text-sm focus:outline-none focus:ring-1 focus:ring-primary flex-grow"
          />
          <Button
            onClick={sendMessage}
            className="bg-primary hover:bg-purple-700 text-white rounded-r-md px-3 py-2 text-sm transition-colors"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span className="cursor-pointer hover:text-light">
            Emotes <SmilePlus className="inline h-3 w-3 ml-1" />
          </span>
          <span className="cursor-pointer hover:text-light">Chat Rules</span>
        </div>
      </div>
    </div>
  );
}
