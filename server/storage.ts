import { 
  users, type User, type InsertUser,
  streams, type Stream, type InsertStream,
  chatMessages, type ChatMessage, type InsertChatMessage,
  donations, type Donation, type InsertDonation,
  type ClientUser, type ClientStream, type ClientChatMessage 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): User; // Sync for setupDemoData
  
  // Stream operations
  getStream(id: number): Promise<Stream | undefined>;
  getStreamsByCategory(category: string): Promise<Stream[]>;
  getAllStreams(): Promise<Stream[]>;
  getFollowedStreams(userId: number): Promise<Stream[]>; // New method for followed streams
  createStream(stream: InsertStream): Stream; // Sync for setupDemoData
  updateStream(id: number, stream: Partial<InsertStream>): Promise<Stream | undefined>;
  updateViewerCount(id: number, count: number): Promise<Stream | undefined>;
  
  // Chat operations
  getChatMessages(streamId: number, limit?: number): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Donation operations
  getDonations(streamId: number): Promise<Donation[]>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  
  // Combined operations
  getStreamWithUser(id: number): Promise<{ stream: Stream; user: User } | undefined>;
  getClientChatMessages(streamId: number, limit?: number): Promise<ClientChatMessage[]>;
  getRecommendedStreams(limit?: number): Promise<ClientStream[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private streams: Map<number, Stream>;
  private chatMessages: Map<number, ChatMessage>;
  private donations: Map<number, Donation>;
  private currentUserId: number;
  private currentStreamId: number;
  private currentChatMessageId: number;
  private currentDonationId: number;

  constructor() {
    console.log('[DEBUG] Initializing MemStorage');
    this.users = new Map();
    this.streams = new Map();
    this.chatMessages = new Map();
    this.donations = new Map();
    this.currentUserId = 1;
    this.currentStreamId = 1;
    this.currentChatMessageId = 1;
    this.currentDonationId = 1;
    
    // Setup users and streams
    this.setupCategoryUsers();
    this.setupSampleStreams();
    this.setupSampleChatMessages();
    
    // Debug info after setup
    console.log(`[DEBUG] Storage initialized with ${this.users.size} users and ${this.streams.size} streams`);
    console.log('[DEBUG] Users:', Array.from(this.users.values()).map(u => ({ id: u.id, username: u.username })));
  }
  
  private setupSampleChatMessages() {
    console.log("[SETUP] Creating sample chat messages");
    
    const messageContents = [
      "Hello everyone! Just joined the stream!",
      "This is so cool!",
      "Can't believe I caught this live!",
      "Wow, I'm learning so much!",
      "Anyone else from Australia?",
      "First time here, this stream is awesome!",
      "What's everyone's favorite part so far?",
      "LOL that was hilarious 😂",
      "This streamer is the best",
      "Can we get a shoutout?",
      "The quality of this stream is amazing",
      "I can't wait to see what happens next",
      "Dropping a follow for sure",
      "How often do you stream?",
      "This is exactly what I needed today"
    ];
    
    // Add some chat messages to each stream
    for (let streamId = 1; streamId <= this.streams.size; streamId++) {
      // Normal chat messages (10-15 per stream)
      const messageCount = Math.floor(Math.random() * 6) + 10; // 10-15 messages
      
      for (let i = 0; i < messageCount; i++) {
        // Randomly select a viewer user or stream owner
        const userId = Math.random() < 0.7 ? 
          (Math.random() < 0.5 ? 4 : 5) : // 70% chance of being viewer1 or viewer2 
          this.streams.get(streamId)?.userId || 1; // 30% chance of being the streamer
          
        const messageIndex = Math.floor(Math.random() * messageContents.length);
        
        this.addChatMessage({
          streamId,
          userId,
          message: messageContents[messageIndex],
          isDonation: false
        });
      }
      
      // Add 1-2 donation messages per stream
      const donationCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < donationCount; i++) {
        const userId = Math.random() < 0.5 ? 4 : 5; // viewer1 or viewer2
        const amount = Math.floor(Math.random() * 50) + 5; // $5-$55
        
        this.createDonation({
          streamId,
          userId,
          amount,
          message: "Thanks for the great content!"
        });
        
        this.addChatMessage({
          streamId,
          userId,
          message: "Thanks for the great content!",
          isDonation: true,
          donationAmount: amount
        });
      }
    }
    
    console.log("[SETUP] Created sample chat messages");
  }

  private setupCategoryUsers() {
    console.log("[SETUP] Creating category users");
    
    // Create category-specific users with real images
    this.createUser({
      username: "gamingChannel",
      password: "password123",
      displayName: "Gaming Channel",
      avatarUrl: "https://xsgames.co/randomusers/assets/avatars/male/1.jpg"
    });
    
    this.createUser({
      username: "musicChannel",
      password: "password123",
      displayName: "Music Channel",
      avatarUrl: "https://xsgames.co/randomusers/assets/avatars/female/2.jpg"
    });
    
    this.createUser({
      username: "foodNetwork", 
      password: "password123",
      displayName: "Food Network",
      avatarUrl: "https://xsgames.co/randomusers/assets/avatars/male/3.jpg"
    });
    
    // Viewers for chat and donations
    this.createUser({
      username: "viewer1",
      password: "password123",
      displayName: "Enthusiastic Viewer",
      avatarUrl: "https://xsgames.co/randomusers/assets/avatars/female/4.jpg"
    });
    
    this.createUser({
      username: "viewer2",
      password: "password123",
      displayName: "Super Fan",
      avatarUrl: "https://xsgames.co/randomusers/assets/avatars/male/5.jpg"
    });
    
    console.log(`[SETUP] Created category users and viewers`);
  }
  
  private setupSampleStreams() {
    console.log('[SETUP] Creating sample streams');
    
    // Using completely different free sample videos for each category
    // These videos are public domain or creative commons licensed
    const videoSources = {
      gaming: [
        "https://assets.mixkit.co/videos/preview/mixkit-small-gaming-device-with-a-game-played-4801-large.mp4", // Handheld gaming
        "https://assets.mixkit.co/videos/preview/mixkit-man-playing-on-gaming-device-at-home-4794-large.mp4", // Home gaming
        "https://assets.mixkit.co/videos/preview/mixkit-gamer-playing-with-headphones-and-controller-4808-large.mp4" // Headset gamer
      ],
      music: [
        "https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-a-field-of-dried-plants-4755-large.mp4", // Dancing outdoors
        "https://assets.mixkit.co/videos/preview/mixkit-young-woman-singing-in-a-recording-studio-42525-large.mp4", // Singer in studio
        "https://assets.mixkit.co/videos/preview/mixkit-man-playing-drums-musical-instrument-with-his-hands-42810-large.mp4" // Drummer
      ],
      food: [
        "https://assets.mixkit.co/videos/preview/mixkit-fresh-vegetables-on-a-wooden-table-seen-from-above-8632-large.mp4", // Fresh veggies
        "https://assets.mixkit.co/videos/preview/mixkit-chef-garnishing-a-plate-of-food-8543-large.mp4", // Chef plating
        "https://assets.mixkit.co/videos/preview/mixkit-making-a-strawberry-dessert-8526-large.mp4" // Dessert making
      ]
    };
    
    // Using open source images for reliable thumbnails that match the content
    const thumbnails = {
      gaming: [
        "https://cdn.pixabay.com/photo/2021/09/07/07/11/game-console-6603120_960_720.jpg", // Handheld gaming
        "https://cdn.pixabay.com/photo/2017/10/04/08/04/gamer-2815786_960_720.jpg", // Gaming tournament
        "https://cdn.pixabay.com/photo/2017/12/17/17/23/network-3024768_960_720.jpg"  // Gaming headset
      ],
      music: [
        "https://cdn.pixabay.com/photo/2015/05/15/14/50/concert-768722_960_720.jpg", // Dance performance
        "https://cdn.pixabay.com/photo/2016/11/19/09/57/woman-1838412_960_720.jpg", // Studio recording
        "https://cdn.pixabay.com/photo/2017/11/23/13/40/drums-2972531_960_720.jpg"  // Drummer
      ],
      food: [
        "https://cdn.pixabay.com/photo/2016/02/05/15/34/pasta-1181189_960_720.jpg", // Fresh vegetables
        "https://cdn.pixabay.com/photo/2017/01/26/02/06/platter-2009590_960_720.jpg", // Chef plating
        "https://cdn.pixabay.com/photo/2018/05/01/18/21/eclair-3366430_960_720.jpg"  // Dessert
      ]
    };
    
    // Create Gaming streams
    this.createStream({
      userId: 1, // gamingChannel user
      title: "Epic Gaming Session - Handheld Play",
      description: "Join me for an awesome gaming session with the latest portable device!",
      thumbnailUrl: thumbnails.gaming[0],
      category: "Gaming",
      tags: ["gaming", "handheld", "nintendo"],
      isLive: true,
      viewerCount: 1567,
      videoUrl: videoSources.gaming[0],
    });
    
    this.createStream({
      userId: 1,
      title: "Pro Gamer Livestream - Weekend Tournament",
      description: "Watch me compete in the weekend tournament with elite players!",
      thumbnailUrl: thumbnails.gaming[1],
      category: "Gaming",
      tags: ["gaming", "tournament", "competitive"],
      isLive: true,
      viewerCount: 4328,
      videoUrl: videoSources.gaming[1],
    });
    
    this.createStream({
      userId: 1,
      title: "Gaming With Pro Headset - Live Commentary",
      description: "Streaming with my new pro gaming headset - come join the gameplay action!",
      thumbnailUrl: thumbnails.gaming[2],
      category: "Gaming",
      tags: ["gaming", "headset", "commentary"],
      isLive: true,
      viewerCount: 2891,
      videoUrl: videoSources.gaming[2],
    });
    
    // Music streams
    this.createStream({
      userId: 2, // musicChannel user
      title: "Outdoor Dance Performance - Nature Vibes",
      description: "Watch this beautiful dance performance in a natural setting with amazing music.",
      thumbnailUrl: thumbnails.music[0],
      category: "Music",
      tags: ["music", "dance", "outdoor"],
      isLive: true,
      viewerCount: 1248,
      videoUrl: videoSources.music[0],
    });
    
    this.createStream({
      userId: 2,
      title: "Studio Recording Session - Live Vocals",
      description: "Watch a professional vocalist recording in the studio with amazing acoustics!",
      thumbnailUrl: thumbnails.music[1],
      category: "Music",
      tags: ["music", "vocals", "recording"],
      isLive: true,
      viewerCount: 3715,
      videoUrl: videoSources.music[1],
    });
    
    this.createStream({
      userId: 2,
      title: "Drum Solo Performance - Percussion Mastery",
      description: "Witness incredible drum playing skills in this live performance session.",
      thumbnailUrl: thumbnails.music[2],
      category: "Music",
      tags: ["music", "drums", "percussion"],
      isLive: true,
      viewerCount: 956,
      videoUrl: videoSources.music[2],
    });
    
    // Food streams
    this.createStream({
      userId: 3, // foodNetwork user
      title: "Fresh Vegetable Prep - Farm to Table",
      description: "Learn how to prepare fresh vegetables for amazing healthy recipes!",
      thumbnailUrl: thumbnails.food[0],
      category: "Food",
      tags: ["food", "vegetables", "prep"],
      isLive: true,
      viewerCount: 876,
      videoUrl: videoSources.food[0],
    });
    
    this.createStream({
      userId: 3,
      title: "Professional Chef Plating - Gourmet Techniques",
      description: "Watch a professional chef garnish and plate exquisite dishes with expert skill.",
      thumbnailUrl: thumbnails.food[1],
      category: "Food",
      tags: ["food", "plating", "chef"],
      isLive: true,
      viewerCount: 2184,
      videoUrl: videoSources.food[1],
    });
    
    this.createStream({
      userId: 3,
      title: "Strawberry Dessert Masterclass - Sweet Treats",
      description: "Learn how to make this beautiful strawberry dessert from scratch!",
      thumbnailUrl: thumbnails.food[2],
      category: "Food",
      tags: ["food", "dessert", "strawberry"],
      isLive: true,
      viewerCount: 1532,
      videoUrl: videoSources.food[2],
    });
    
    console.log('[SETUP] Created sample streams');
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  // Synchronous version for internal use in setupYouTubeUsers
  createUser(insertUser: InsertUser): User {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      displayName: insertUser.displayName || null,
      avatarUrl: insertUser.avatarUrl || null 
    };
    this.users.set(id, user);
    return user;
  }
  
  // Stream operations
  async getStream(id: number): Promise<Stream | undefined> {
    return this.streams.get(id);
  }
  
  async getStreamsByCategory(category: string): Promise<Stream[]> {
    // Get our local streams for this category
    return Array.from(this.streams.values()).filter(
      (stream) => stream.category === category && stream.isLive
    );
  }
  
  async getAllStreams(): Promise<Stream[]> {
    // Return all streams
    return Array.from(this.streams.values()).filter(stream => stream.isLive);
  }
  
  async getFollowedStreams(userId: number): Promise<Stream[]> {
    // For the prototype, we'll simulate "following" a random selection of streams
    const allStreams = Array.from(this.streams.values()).filter(stream => stream.isLive);
    
    // Randomly select up to 8 streams as "followed"
    return allStreams.sort(() => 0.5 - Math.random()).slice(0, Math.min(8, allStreams.length));
  }
  
  // Synchronous version for creating streams
  createStream(insertStream: InsertStream): Stream {
    const id = this.currentStreamId++;
    const startedAt = insertStream.isLive ? new Date() : null;
    const stream: Stream = { 
      ...insertStream, 
      id,
      viewerCount: Math.floor(Math.random() * 2000) + 100, // Random viewer count for demo
      startedAt,
      category: insertStream.category || null,
      description: insertStream.description || null,
      thumbnailUrl: insertStream.thumbnailUrl || null,
      tags: insertStream.tags || null,
      isLive: insertStream.isLive ?? true,
      videoUrl: insertStream.videoUrl || null
    };
    this.streams.set(id, stream);
    return stream;
  }
  
  async updateStream(id: number, updateData: Partial<InsertStream>): Promise<Stream | undefined> {
    const existingStream = this.streams.get(id);
    if (!existingStream) return undefined;
    
    const updatedStream: Stream = {
      ...existingStream,
      ...updateData,
    };
    
    this.streams.set(id, updatedStream);
    return updatedStream;
  }
  
  async updateViewerCount(id: number, count: number): Promise<Stream | undefined> {
    const existingStream = this.streams.get(id);
    if (!existingStream) return undefined;
    
    const updatedStream: Stream = {
      ...existingStream,
      viewerCount: count
    };
    
    this.streams.set(id, updatedStream);
    return updatedStream;
  }
  
  // Chat operations
  async getChatMessages(streamId: number, limit: number = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => msg.streamId === streamId)
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      })
      .slice(-limit);
  }
  
  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const timestamp = new Date();
    const message: ChatMessage = {
      id,
      message: insertMessage.message,
      userId: insertMessage.userId,
      streamId: insertMessage.streamId,
      timestamp,
      isDonation: insertMessage.isDonation ?? null,
      donationAmount: insertMessage.donationAmount ?? null
    };
    
    this.chatMessages.set(id, message);
    return message;
  }
  
  // Donation operations
  async getDonations(streamId: number): Promise<Donation[]> {
    return Array.from(this.donations.values())
      .filter(donation => donation.streamId === streamId)
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
  }
  
  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const id = this.currentDonationId++;
    const timestamp = new Date();
    const donation: Donation = {
      id,
      userId: insertDonation.userId,
      streamId: insertDonation.streamId,
      amount: insertDonation.amount,
      message: insertDonation.message ?? null,
      timestamp
    };
    
    this.donations.set(id, donation);
    return donation;
  }
  
  // Combined operations
  async getStreamWithUser(id: number): Promise<{ stream: Stream; user: User } | undefined> {
    const stream = await this.getStream(id);
    if (!stream) return undefined;
    
    const user = await this.getUser(stream.userId);
    if (!user) return undefined;
    
    return { stream, user };
  }
  
  async getClientChatMessages(streamId: number, limit: number = 50): Promise<ClientChatMessage[]> {
    const messages = await this.getChatMessages(streamId, limit);
    
    const clientMessages: ClientChatMessage[] = [];
    for (const message of messages) {
      const user = await this.getUser(message.userId);
      if (user) {
        clientMessages.push({
          id: message.id,
          streamId: message.streamId,
          userId: message.userId,
          username: user.username,
          displayName: user.displayName || undefined,
          avatarUrl: user.avatarUrl || undefined,
          message: message.message,
          timestamp: message.timestamp ? message.timestamp.toISOString() : new Date().toISOString(),
          isDonation: message.isDonation || false,
          donationAmount: message.donationAmount || undefined
        });
      }
    }
    
    return clientMessages;
  }
  
  async getRecommendedStreams(limit: number = 6): Promise<ClientStream[]> {
    const streams = await this.getAllStreams();
    const randomizedStreams = [...streams].sort(() => 0.5 - Math.random()).slice(0, limit);
    
    const clientStreams: ClientStream[] = [];
    for (const stream of randomizedStreams) {
      const user = await this.getUser(stream.userId);
      if (user) {
        clientStreams.push({
          id: stream.id,
          userId: stream.userId,
          title: stream.title,
          description: stream.description ? stream.description : undefined,
          thumbnailUrl: stream.thumbnailUrl ? stream.thumbnailUrl : undefined,
          category: stream.category ? stream.category : undefined,
          tags: stream.tags ? stream.tags : undefined,
          isLive: stream.isLive ?? true,
          viewerCount: stream.viewerCount ?? 0,
          startedAt: stream.startedAt?.toISOString(),
          videoUrl: stream.videoUrl || undefined,
          streamer: {
            id: user.id,
            username: user.username,
            displayName: user.displayName ? user.displayName : undefined,
            avatarUrl: user.avatarUrl ? user.avatarUrl : undefined
          }
        });
      }
    }
    
    return clientStreams;
  }
}

export const storage = new MemStorage();
