import { 
  users, type User, type InsertUser,
  streams, type Stream, type InsertStream,
  chatMessages, type ChatMessage, type InsertChatMessage,
  donations, type Donation, type InsertDonation,
  type ClientUser, type ClientStream, type ClientChatMessage 
} from "@shared/schema";
import { searchVideosByCategory, youtubeVideosToStreams } from "./youtube";

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
    
    // Setup YouTube only data
    this.setupYouTubeUsers();
    
    // Debug info after setup
    console.log(`[DEBUG] Storage initialized with ${this.users.size} users and ${this.streams.size} streams`);
    console.log('[DEBUG] Users:', Array.from(this.users.values()).map(u => ({ id: u.id, username: u.username })));
  }

  private setupYouTubeUsers() {
    console.log("[SETUP] Creating YouTube category users");
    
    // Create YouTube category-specific users
    this.createUser({
      username: "youtubeGaming",
      password: "password123",
      displayName: "YouTube Gaming",
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg"
    });
    
    this.createUser({
      username: "youtubeMusic",
      password: "password123",
      displayName: "YouTube Music",
      avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
    });
    
    this.createUser({
      username: "youtubeFood", 
      password: "password123",
      displayName: "YouTube Food",
      avatarUrl: "https://randomuser.me/api/portraits/men/41.jpg"
    });
    
    // Viewers for chat and donations
    this.createUser({
      username: "viewer1",
      password: "password123",
      displayName: "Enthusiastic Viewer",
      avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg"
    });
    
    this.createUser({
      username: "viewer2",
      password: "password123",
      displayName: "Super Fan",
      avatarUrl: "https://randomuser.me/api/portraits/men/22.jpg"
    });
    
    console.log(`[SETUP] Created YouTube category users and viewers`);
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
    // First get our local streams for this category
    const localStreams = Array.from(this.streams.values()).filter(
      (stream) => stream.category === category && stream.isLive,
    );

    try {
      console.log(`[DEBUG] Fetching YouTube videos for category: ${category}`);
      
      // Get the appropriate YouTube user ID based on category
      let userId = 1; // Default user
      const youtubeUsers = Array.from(this.users.values()).filter(u => 
        u.username.startsWith('youtube') && u.username.toLowerCase().includes(category.toLowerCase())
      );
      if (youtubeUsers.length > 0) {
        userId = youtubeUsers[0].id;
      }
      
      // Fetch videos from YouTube
      const youtubeVideos = await searchVideosByCategory(category, 12);
      if (youtubeVideos.length > 0) {
        // Convert YouTube videos to stream objects, starting IDs from a high number to avoid conflicts
        // Use timestamp and random values to ensure unique IDs across requests
        const randomOffset = Math.floor(Math.random() * 100);
        const timeOffset = Date.now() % 1000;
        const startId = 1000 + randomOffset + timeOffset;
        const youtubeStreams = youtubeVideosToStreams(youtubeVideos, category, startId, userId);
        
        // Store these streams in our local storage for future reference
        youtubeStreams.forEach(stream => {
          this.streams.set(stream.id, stream);
        });
        
        // Return only YouTube streams
        return youtubeStreams;
      }
    } catch (error) {
      console.error(`[ERROR] Failed to fetch YouTube videos for category ${category}:`, error);
    }
    
    // Return local streams if YouTube fetch fails
    return localStreams;
  }
  
  async getAllStreams(): Promise<Stream[]> {
    // Get existing YouTube streams from storage
    const existingStreams = Array.from(this.streams.values()).filter(stream => 
      stream.isLive && stream.videoUrl && stream.videoUrl.includes('youtube.com')
    );
    
    try {
      // Fetch featured YouTube videos for each category
      const categories = ['Gaming', 'Music', 'Food'];
      const youtubeStreams: Stream[] = [];
      
      for (const category of categories) {
        console.log(`[DEBUG] Fetching YouTube videos for home page: ${category}`);
        
        // Get the appropriate YouTube user ID based on category
        let userId = 1; // Default user
        const youtubeUsers = Array.from(this.users.values()).filter(u => 
          u.username.startsWith('youtube') && u.username.toLowerCase().includes(category.toLowerCase())
        );
        if (youtubeUsers.length > 0) {
          userId = youtubeUsers[0].id;
        }
        
        const videos = await searchVideosByCategory(category, 5);
        if (videos.length > 0) {
          // Use a different ID range for each category to avoid conflicts
          const categoryOffset = categories.indexOf(category) * 1000;
          // Generate a random offset to ensure we don't have duplicate IDs
          const randomOffset = Math.floor(Math.random() * 100);
          const startId = 2000 + categoryOffset + randomOffset + Date.now() % 1000;
          const categoryStreams = youtubeVideosToStreams(videos, category, startId, userId);
          
          // Store these streams and add to result list
          categoryStreams.forEach(stream => {
            this.streams.set(stream.id, stream);
            youtubeStreams.push(stream);
          });
        }
      }
      
      // If we have at least 6 YouTube videos, return just those
      if (youtubeStreams.length >= 6) {
        return youtubeStreams;
      }
      
      // Otherwise, return combined existing and new streams
      return [...existingStreams, ...youtubeStreams];
    } catch (error) {
      console.error('[ERROR] Failed to fetch YouTube videos for home page:', error);
      return existingStreams.length > 0 ? existingStreams : [];
    }
  }
  
  async getFollowedStreams(userId: number): Promise<Stream[]> {
    // For the prototype, we'll simulate "following" a random selection of YouTube streams
    try {
      // Get existing YouTube streams from cache first
      const existingStreams = Array.from(this.streams.values()).filter(stream => 
        stream.isLive && stream.videoUrl && stream.videoUrl.includes('youtube.com')
      );
      
      // If we have enough streams, return a random selection
      if (existingStreams.length >= 8) {
        // Return random 8 streams as "followed"
        return existingStreams.sort(() => 0.5 - Math.random()).slice(0, 8);
      }
      
      // Otherwise fetch new streams from YouTube
      const streamsByCategory = await this.getAllStreams();
      
      // Randomly select 8 streams
      return streamsByCategory.sort(() => 0.5 - Math.random()).slice(0, 8);
    } catch (error) {
      console.error('[ERROR] Failed to get followed streams:', error);
      return [];
    }
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
