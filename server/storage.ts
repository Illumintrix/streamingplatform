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
    
    // Setup demo data
    this.setupDemoData();
    
    // Debug info after setup
    console.log(`[DEBUG] Storage initialized with ${this.users.size} users and ${this.streams.size} streams`);
    console.log('[DEBUG] Users:', Array.from(this.users.values()).map(u => ({ id: u.id, username: u.username })));
    console.log('[DEBUG] Streams:', Array.from(this.streams.values()).map(s => ({ id: s.id, title: s.title, category: s.category })));
  }

  private setupDemoData() {
    // Create users for different content categories
    const gamer1 = this.createUser({
      username: "gamerpro99",
      password: "password123",
      displayName: "GamerPro99",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    const gamer2 = this.createUser({
      username: "speedmaster",
      password: "password123",
      displayName: "SpeedMaster",
      avatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    const musician1 = this.createUser({
      username: "musiclover",
      password: "password123",
      displayName: "MusicLover",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    const musician2 = this.createUser({
      username: "jazzqueen",
      password: "password123",
      displayName: "JazzQueen",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    const chef1 = this.createUser({
      username: "chefalex",
      password: "password123",
      displayName: "ChefAlex",
      avatarUrl: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    const chef2 = this.createUser({
      username: "bakingpro",
      password: "password123",
      displayName: "BakingPro",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    // Gaming category streams
    const gamingStream1 = this.createStream({
      userId: gamer1.id,
      title: "Pro Gaming Tournament Finals",
      description: "Watch the final matches of the Pro Gaming Tournament! Top players competing for the championship title and a $50,000 prize pool. Don't miss the exciting gameplay and expert commentary.",
      thumbnailUrl: "https://images.unsplash.com/photo-1603739903239-8b6e64c3b185?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      category: "Gaming",
      tags: ["gaming", "esports", "tournament", "finals"],
      isLive: true
    });
    
    const gamingStream2 = this.createStream({
      userId: gamer2.id,
      title: "Speed Running World Records",
      description: "Attempting to break world records in classic games! Watch as I try to beat the current world record for Super Mario 64 speedrun.",
      thumbnailUrl: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      category: "Gaming",
      tags: ["speedrun", "gaming", "worldrecord", "mario"],
      isLive: true
    });
    
    this.createStream({
      userId: gamer1.id,
      title: "Open World Adventure - Exploring New Realms",
      description: "Let's explore this brand new open world game together! We'll be discovering hidden areas, fighting bosses, and completing side quests.",
      thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      category: "Gaming",
      tags: ["openworld", "rpg", "adventure", "gaming"],
      isLive: true
    });
    
    // Music category streams
    const musicStream1 = this.createStream({
      userId: musician1.id,
      title: "Live Music Session - Taking Requests!",
      description: "Playing your favorite songs and taking requests from the chat. Drop your song suggestions in the chat!",
      thumbnailUrl: "https://images.unsplash.com/photo-1511882150382-421056c89033?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      category: "Music",
      tags: ["music", "live", "requests", "piano"],
      isLive: true
    });
    
    this.createStream({
      userId: musician2.id,
      title: "Jazz Night - Smooth Beats & Relaxing Tunes",
      description: "Join me for a night of smooth jazz and relaxing beats. Perfect music to unwind after a long day.",
      thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      category: "Music",
      tags: ["jazz", "relaxing", "music", "livemusic"],
      isLive: true
    });
    
    // Food category streams
    const foodStream1 = this.createStream({
      userId: chef1.id,
      title: "Cooking Show - Making Pasta From Scratch",
      description: "Learn how to make delicious pasta from scratch with simple ingredients! Today we're making homemade fettuccine with a creamy mushroom sauce.",
      thumbnailUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      category: "Food",
      tags: ["cooking", "food", "pasta", "homemade"],
      isLive: true
    });
    
    this.createStream({
      userId: chef2.id,
      title: "Baking Masterclass - Perfect Sourdough Bread",
      description: "I'll show you how to make the perfect sourdough bread with a crispy crust and soft interior. We'll go through every step from starter to finished loaf.",
      thumbnailUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      category: "Food",
      tags: ["baking", "bread", "sourdough", "food"],
      isLive: true
    });
    
    // Create chat messages for gaming stream
    this.addChatMessage({
      streamId: gamingStream1.id,
      userId: gamer2.id,
      message: "This tournament is so intense! Can't believe that last play!",
      isDonation: false,
    });
    
    this.addChatMessage({
      streamId: gamingStream1.id,
      userId: musician1.id,
      message: "Welcome everyone to the stream! Remember to follow the chat rules.",
      isDonation: false,
    });
    
    this.addChatMessage({
      streamId: gamingStream1.id,
      userId: chef1.id,
      message: "Does anyone know when the next match starts?",
      isDonation: false,
    });
    
    // Add donation messages for gaming stream
    this.addChatMessage({
      streamId: gamingStream1.id,
      userId: gamer2.id,
      message: "Keep up the great stream! You're awesome!",
      isDonation: true,
      donationAmount: 20,
    });
    
    this.createDonation({
      streamId: gamingStream1.id,
      userId: gamer2.id,
      amount: 20,
      message: "Keep up the great stream! You're awesome!"
    });
    
    // Create chat messages for music stream
    this.addChatMessage({
      streamId: musicStream1.id,
      userId: chef2.id,
      message: "Your music is amazing! Could you play some jazz next?",
      isDonation: false,
    });
    
    this.addChatMessage({
      streamId: musicStream1.id,
      userId: gamer1.id,
      message: "I'm really enjoying this stream while working. So relaxing!",
      isDonation: false,
    });
    
    // Add donation messages for music stream
    this.addChatMessage({
      streamId: musicStream1.id,
      userId: musician2.id,
      message: "Love your talent! Keep the great music coming!",
      isDonation: true,
      donationAmount: 15,
    });
    
    this.createDonation({
      streamId: musicStream1.id,
      userId: musician2.id,
      amount: 15,
      message: "Love your talent! Keep the great music coming!"
    });
    
    // Create chat messages for food stream
    this.addChatMessage({
      streamId: foodStream1.id,
      userId: musician1.id,
      message: "That pasta looks delicious! I'm getting hungry!",
      isDonation: false,
    });
    
    this.addChatMessage({
      streamId: foodStream1.id,
      userId: gamer1.id,
      message: "What type of flour works best for pasta?",
      isDonation: false,
    });
    
    // Add donation messages for food stream
    this.addChatMessage({
      streamId: foodStream1.id,
      userId: chef2.id,
      message: "Thanks for the cooking tips! Made a donation to support your channel.",
      isDonation: true,
      donationAmount: 25,
    });
    
    this.createDonation({
      streamId: foodStream1.id,
      userId: chef2.id,
      amount: 25,
      message: "Thanks for the cooking tips! Made a donation to support your channel."
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

  // Synchronous version for internal use in setupDemoData
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
    return Array.from(this.streams.values()).filter(
      (stream) => stream.category === category && stream.isLive,
    );
  }
  
  async getAllStreams(): Promise<Stream[]> {
    return Array.from(this.streams.values()).filter(stream => stream.isLive);
  }
  
  // Synchronous version for internal use in setupDemoData
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
      isLive: insertStream.isLive ?? true
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
