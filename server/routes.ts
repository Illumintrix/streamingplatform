import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { 
  insertChatMessageSchema, 
  insertDonationSchema 
} from "@shared/schema";

// Store connected clients by streamId
const streamConnections = new Map<number, Set<WebSocket>>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    let currentStreamId: number | null = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'join': {
            // User joining a stream chat
            const streamId = Number(data.streamId);
            if (isNaN(streamId)) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid stream ID' }));
              return;
            }
            
            // Leave previous stream if any
            if (currentStreamId !== null) {
              const previousConnections = streamConnections.get(currentStreamId);
              if (previousConnections) {
                previousConnections.delete(ws);
                if (previousConnections.size === 0) {
                  streamConnections.delete(currentStreamId);
                }
              }
            }
            
            // Join new stream
            currentStreamId = streamId;
            if (!streamConnections.has(streamId)) {
              streamConnections.set(streamId, new Set());
            }
            streamConnections.get(streamId)?.add(ws);
            
            // Send existing messages
            const messages = await storage.getClientChatMessages(streamId, 50);
            ws.send(JSON.stringify({ 
              type: 'history', 
              messages 
            }));
            
            break;
          }
          
          case 'message': {
            if (currentStreamId === null) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not joined to any stream' }));
              return;
            }
            
            const { content, userId } = data;
            if (!content || !userId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing message content or user ID' }));
              return;
            }
            
            try {
              const chatMessageData = insertChatMessageSchema.parse({
                streamId: currentStreamId,
                userId: Number(userId),
                message: content,
                isDonation: false
              });
              
              const savedMessage = await storage.addChatMessage(chatMessageData);
              const user = await storage.getUser(savedMessage.userId);
              
              if (!user) {
                ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
                return;
              }
              
              const clientMessage = {
                id: savedMessage.id,
                streamId: savedMessage.streamId,
                userId: savedMessage.userId,
                username: user.username,
                displayName: user.displayName ? user.displayName : undefined,
                avatarUrl: user.avatarUrl ? user.avatarUrl : undefined,
                message: savedMessage.message,
                timestamp: savedMessage.timestamp ? savedMessage.timestamp.toISOString() : new Date().toISOString(),
                isDonation: savedMessage.isDonation || false,
                donationAmount: savedMessage.donationAmount || undefined
              };
              
              // Broadcast message to all connected clients for this stream
              const connections = streamConnections.get(currentStreamId);
              if (connections) {
                const messageJSON = JSON.stringify({
                  type: 'chat',
                  message: clientMessage
                });
                
                connections.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(messageJSON);
                  }
                });
              }
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid chat message data' }));
            }
            
            break;
          }
          
          case 'leave': {
            if (currentStreamId !== null) {
              const connections = streamConnections.get(currentStreamId);
              if (connections) {
                connections.delete(ws);
                if (connections.size === 0) {
                  streamConnections.delete(currentStreamId);
                }
              }
              currentStreamId = null;
            }
            break;
          }
          
          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      // Remove client from any stream they were connected to
      if (currentStreamId !== null) {
        const connections = streamConnections.get(currentStreamId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            streamConnections.delete(currentStreamId);
          }
        }
      }
    });
  });
  
  // API Routes
  app.get('/api/streams', async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      let streams;
      
      if (category) {
        streams = await storage.getStreamsByCategory(category);
      } else {
        streams = await storage.getAllStreams();
      }
      
      console.log(`[DEBUG] Got ${streams.length} streams from storage`, 
        streams.map(s => ({ id: s.id, title: s.title, category: s.category })));
      
      // Convert to client-friendly format
      const clientStreams = [];
      for (const stream of streams) {
        const user = await storage.getUser(stream.userId);
        if (user) {
          console.log(`[DEBUG] Found user for stream: ${user.username}`);
          clientStreams.push({
            id: stream.id,
            userId: stream.userId,
            title: stream.title,
            description: stream.description ? stream.description : undefined,
            thumbnailUrl: stream.thumbnailUrl ? stream.thumbnailUrl : undefined,
            category: stream.category ? stream.category : undefined,
            tags: stream.tags ? stream.tags : undefined,
            viewerCount: stream.viewerCount ?? 0,
            isLive: stream.isLive ?? true,
            startedAt: stream.startedAt?.toISOString(),
            streamer: {
              id: user.id,
              username: user.username,
              displayName: user.displayName ? user.displayName : undefined,
              avatarUrl: user.avatarUrl ? user.avatarUrl : undefined
            }
          });
        } else {
          console.log(`[DEBUG] No user found for stream ${stream.id} with userId ${stream.userId}`);
        }
      }
      
      console.log(`[DEBUG] Returning ${clientStreams.length} client streams`);
      res.json(clientStreams);
    } catch (error) {
      console.error('[ERROR] Failed to fetch streams:', error);
      res.status(500).json({ message: 'Failed to fetch streams' });
    }
  });
  
  app.get('/api/streams/:id', async (req, res) => {
    try {
      const streamId = parseInt(req.params.id);
      if (isNaN(streamId)) {
        return res.status(400).json({ message: 'Invalid stream ID' });
      }
      
      const streamData = await storage.getStreamWithUser(streamId);
      if (!streamData) {
        return res.status(404).json({ message: 'Stream not found' });
      }
      
      const { stream, user } = streamData;
      
      res.json({
        id: stream.id,
        userId: stream.userId,
        title: stream.title,
        description: stream.description ? stream.description : undefined,
        thumbnailUrl: stream.thumbnailUrl ? stream.thumbnailUrl : undefined,
        category: stream.category ? stream.category : undefined,
        tags: stream.tags ? stream.tags : undefined,
        viewerCount: stream.viewerCount ?? 0,
        isLive: stream.isLive ?? true,
        startedAt: stream.startedAt?.toISOString(),
        streamer: {
          id: user.id,
          username: user.username,
          displayName: user.displayName ? user.displayName : undefined,
          avatarUrl: user.avatarUrl ? user.avatarUrl : undefined
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stream' });
    }
  });
  
  app.get('/api/streams/:id/chat', async (req, res) => {
    try {
      const streamId = parseInt(req.params.id);
      if (isNaN(streamId)) {
        return res.status(400).json({ message: 'Invalid stream ID' });
      }
      
      const messages = await storage.getClientChatMessages(streamId, 50);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
  });
  
  app.post('/api/streams/:id/donations', async (req, res) => {
    try {
      const streamId = parseInt(req.params.id);
      if (isNaN(streamId)) {
        return res.status(400).json({ message: 'Invalid stream ID' });
      }
      
      const donationData = insertDonationSchema.parse({
        ...req.body,
        streamId
      });
      
      const donation = await storage.createDonation(donationData);
      
      // Add donation message to chat
      const chatMessage = await storage.addChatMessage({
        streamId,
        userId: donationData.userId,
        message: donationData.message || 'Made a donation!',
        isDonation: true,
        donationAmount: donationData.amount
      });
      
      // Get user data for the chat message
      const user = await storage.getUser(donationData.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const clientMessage = {
        id: chatMessage.id,
        streamId: chatMessage.streamId,
        userId: chatMessage.userId,
        username: user.username,
        displayName: user.displayName ? user.displayName : undefined,
        avatarUrl: user.avatarUrl ? user.avatarUrl : undefined,
        message: chatMessage.message,
        timestamp: chatMessage.timestamp ? chatMessage.timestamp.toISOString() : new Date().toISOString(),
        isDonation: chatMessage.isDonation || false,
        donationAmount: chatMessage.donationAmount || undefined
      };
      
      // Broadcast donation message to all connected clients for this stream
      const connections = streamConnections.get(streamId);
      if (connections) {
        const messageJSON = JSON.stringify({
          type: 'donation',
          message: clientMessage
        });
        
        connections.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(messageJSON);
          }
        });
      }
      
      res.status(201).json({
        id: donation.id,
        streamId: donation.streamId,
        userId: donation.userId,
        amount: donation.amount,
        message: donation.message,
        timestamp: donation.timestamp ? donation.timestamp.toISOString() : new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({ message: 'Invalid donation data' });
    }
  });
  
  app.get('/api/streams/:id/recommended', async (req, res) => {
    try {
      const streamId = parseInt(req.params.id);
      if (isNaN(streamId)) {
        return res.status(400).json({ message: 'Invalid stream ID' });
      }
      
      // Get recommended streams (excluding current stream)
      const allRecommended = await storage.getRecommendedStreams(10);
      const recommended = allRecommended.filter(stream => stream.id !== streamId).slice(0, 3);
      
      res.json(recommended);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch recommended streams' });
    }
  });
  
  app.get('/api/categories', async (_req, res) => {
    try {
      // Get unique categories from all streams
      const streams = await storage.getAllStreams();
      const categories = Array.from(new Set(streams.map(stream => stream.category).filter(Boolean) as string[]));
      
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Return user data without password
      const { password: _, ...userData } = user;
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });
  
  return httpServer;
}
