let socket: WebSocket | null = null;

export function createSocket(): WebSocket {
  // Close existing connection if any
  if (socket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(socket.readyState)) {
    closeSocket(socket);
  }
  
  // Create new connection
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  socket = new WebSocket(wsUrl);
  
  // Add error handler
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return socket;
}

export function closeSocket(socketInstance: WebSocket): void {
  try {
    socketInstance.close();
  } catch (err) {
    console.error('Error closing WebSocket:', err);
  }
  
  if (socketInstance === socket) {
    socket = null;
  }
}

export function getSocket(): WebSocket | null {
  return socket;
}
