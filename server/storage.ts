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
    
    // Debug info after setup
    console.log(`[DEBUG] Storage initialized with ${this.users.size} users and ${this.streams.size} streams`);
    console.log('[DEBUG] Users:', Array.from(this.users.values()).map(u => ({ id: u.id, username: u.username })));
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
    
    // Free sample videos from https://gist.github.com/jsturgis/3b19447b304616f18657 and other sources
    // Matched categories with appropriate video content
    const videoSources = {
      gaming: [
        // Gaming videos (animated content that looks like gaming)
        "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Animated creatures in a forest (looks like Minecraft)
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Sci-fi animation (looks like a game)
        "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" // Fantasy animation (looks like an RPG)
      ],
      music: [
        // Music/performance related content
        "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", // Orchestral elements
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", // Performance elements
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" // Ambient content
      ],
      food: [
        // Cooking/Food related content - using colorful videos that could pass as cooking tutorials
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // Bright, colorful content
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", // Close-up shots similar to cooking
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" // Variety of scenes that could be food related
      ]
    };
    
    // Create Gaming streams
    this.createStream({
      userId: 1, // gamingChannel user
      title: "Epic Minecraft Building Challenge",
      description: "Join us for an amazing Minecraft building competition with awesome prizes!",
      thumbnailUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
      category: "Gaming",
      tags: ["gaming", "minecraft", "building"],
      isLive: true,
      viewerCount: 1567,
      videoUrl: videoSources.gaming[0],
    });
    
    this.createStream({
      userId: 1,
      title: "Fortnite Pro Tournament Finals",
      description: "Watch the exciting finale of our Fortnite tournament with the top players!",
      thumbnailUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
      category: "Gaming",
      tags: ["gaming", "fortnite", "tournament"],
      isLive: true,
      viewerCount: 4328,
      videoUrl: videoSources.gaming[1],
    });
    
    this.createStream({
      userId: 1,
      title: "League of Legends Gameplay - New Champion",
      description: "First look at the newest champion to join League of Legends!",
      thumbnailUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
      category: "Gaming",
      tags: ["gaming", "lol", "leagueoflegends"],
      isLive: true,
      viewerCount: 2891,
      videoUrl: videoSources.gaming[2],
    });
    
    // Music streams
    this.createStream({
      userId: 2, // musicChannel user
      title: "Live Piano Concert - Classical Favorites",
      description: "Enjoy an evening of beautiful classical piano pieces performed live.",
      thumbnailUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
      category: "Music",
      tags: ["music", "piano", "classical"],
      isLive: true,
      viewerCount: 1248,
      videoUrl: videoSources.music[0],
    });
    
    this.createStream({
      userId: 2,
      title: "Summer Beats Festival - Live DJ Set",
      description: "Hot summer tunes to get you in the party mood! Live DJ set with special guests.",
      thumbnailUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg",
      category: "Music",
      tags: ["music", "dj", "festival"],
      isLive: true,
      viewerCount: 3715,
      videoUrl: videoSources.music[1],
    });
    
    this.createStream({
      userId: 2,
      title: "Acoustic Guitar Sessions - Live",
      description: "Relaxing acoustic guitar covers of your favorite songs.",
      thumbnailUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg",
      category: "Music",
      tags: ["music", "guitar", "acoustic"],
      isLive: true,
      viewerCount: 956,
      videoUrl: videoSources.music[2],
    });
    
    // Food streams
    this.createStream({
      userId: 3, // foodNetwork user
      title: "Italian Pasta Masterclass - Cook with Me",
      description: "Learn how to make authentic Italian pasta from scratch with a professional chef.",
      thumbnailUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg",
      category: "Food",
      tags: ["food", "cooking", "italian"],
      isLive: true,
      viewerCount: 876,
      videoUrl: videoSources.food[0],
    });
    
    this.createStream({
      userId: 3,
      title: "Baking Championship - Finals",
      description: "Watch our top bakers compete for the grand prize in this exciting finale!",
      thumbnailUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg",
      category: "Food",
      tags: ["food", "baking", "competition"],
      isLive: true,
      viewerCount: 2184,
      videoUrl: videoSources.food[1],
    });
    
    this.createStream({
      userId: 3,
      title: "Street Food Tour - Asia Edition",
      description: "Join us as we explore the amazing street food scene across Asia!",
      thumbnailUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
      category: "Food",
      tags: ["food", "street", "asia"],
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
