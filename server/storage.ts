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
  createUser(user: InsertUser): Promise<User>;
  
  // Stream operations
  getStream(id: number): Promise<Stream | undefined>;
  getStreamsByCategory(category: string): Promise<Stream[]>;
  getAllStreams(): Promise<Stream[]>;
  createStream(stream: InsertStream): Promise<Stream>;
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
    this.users = new Map();
    this.streams = new Map();
    this.chatMessages = new Map();
    this.donations = new Map();
    this.currentUserId = 1;
    this.currentStreamId = 1;
    this.currentChatMessageId = 1;
    this.currentDonationId = 1;
    
    // Setup demo data
    this.setupDemoData();
  }

  private setupDemoData() {
    // Create some users
    const user1 = this.createUser({
      username: "gamerpro99",
      password: "password123",
      displayName: "GamerPro99",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    const user2 = this.createUser({
      username: "speedmaster",
      password: "password123",
      displayName: "SpeedMaster",
      avatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    const user3 = this.createUser({
      username: "musiclover",
      password: "password123",
      displayName: "MusicLover",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    const user4 = this.createUser({
      username: "chefalex",
      password: "password123",
      displayName: "ChefAlex",
      avatarUrl: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    // Create streams for users
    const stream1 = this.createStream({
      userId: user1.id,
      title: "Pro Gaming Tournament Finals",
      description: "Watch the final matches of the Pro Gaming Tournament! Top players competing for the championship title and a $50,000 prize pool. Don't miss the exciting gameplay and expert commentary.",
      thumbnailUrl: "https://images.unsplash.com/photo-1603739903239-8b6e64c3b185?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      category: "Gaming",
      tags: ["gaming", "esports", "tournament", "finals"],
      isLive: true
    });
    
    this.createStream({
      userId: user2.id,
      title: "Speed Running World Records",
      description: "Attempting to break world records in classic games!",
      thumbnailUrl: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      category: "Gaming",
      tags: ["speedrun", "gaming", "worldrecord"],
      isLive: true
    });
    
    this.createStream({
      userId: user3.id,
      title: "Live Music Session - Taking Requests!",
      description: "Playing your favorite songs and taking requests from the chat.",
      thumbnailUrl: "https://images.unsplash.com/photo-1511882150382-421056c89033?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      category: "Music",
      tags: ["music", "live", "requests"],
      isLive: true
    });
    
    this.createStream({
      userId: user4.id,
      title: "Cooking Show - Making Pasta From Scratch",
      description: "Learn how to make delicious pasta from scratch with simple ingredients!",
      thumbnailUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      category: "Food",
      tags: ["cooking", "food", "pasta", "homemade"],
      isLive: true
    });
    
    // Create some initial chat messages
    this.addChatMessage({
      streamId: stream1.id,
      userId: 2,
      message: "This tournament is so intense! Can't believe that last play!",
      isDonation: false,
    });
    
    this.addChatMessage({
      streamId: stream1.id,
      userId: 3,
      message: "Welcome everyone to the stream! Remember to follow the chat rules.",
      isDonation: false,
    });
    
    this.addChatMessage({
      streamId: stream1.id,
      userId: 4,
      message: "Does anyone know when the next match starts?",
      isDonation: false,
    });
    
    // Add a donation message
    this.addChatMessage({
      streamId: stream1.id,
      userId: 2,
      message: "Keep up the great stream! You're awesome!",
      isDonation: true,
      donationAmount: 20,
    });
    
    this.createDonation({
      streamId: stream1.id,
      userId: 2,
      amount: 20,
      message: "Keep up the great stream! You're awesome!"
    });
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Stream operations
  async getStream(id: number): Promise<Stream | undefined> {
    return this.streams.get(id);
  }
  
  async getStreamsByCategory(category: string): Promise<Stream[]> {
    return Array.from(this.streams.values()).filter(
      (stream) => stream.category === category && stream.isLive,
    );
  }
  
  async getAllStreams(): Promise<Stream[]> {
    return Array.from(this.streams.values()).filter(stream => stream.isLive);
  }
  
  async createStream(insertStream: InsertStream): Promise<Stream> {
    const id = this.currentStreamId++;
    const startedAt = insertStream.isLive ? new Date() : undefined;
    const stream: Stream = { 
      ...insertStream, 
      id,
      viewerCount: Math.floor(Math.random() * 2000) + 100, // Random viewer count for demo
      startedAt
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
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }
  
  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const timestamp = new Date();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp
    };
    
    this.chatMessages.set(id, message);
    return message;
  }
  
  // Donation operations
  async getDonations(streamId: number): Promise<Donation[]> {
    return Array.from(this.donations.values())
      .filter(donation => donation.streamId === streamId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const id = this.currentDonationId++;
    const timestamp = new Date();
    const donation: Donation = {
      ...insertDonation,
      id,
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
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          message: message.message,
          timestamp: message.timestamp.toISOString(),
          isDonation: message.isDonation || false,
          donationAmount: message.donationAmount
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
          ...stream,
          startedAt: stream.startedAt?.toISOString(),
          streamer: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl
          }
        });
      }
    }
    
    return clientStreams;
  }
}

export const storage = new MemStorage();
