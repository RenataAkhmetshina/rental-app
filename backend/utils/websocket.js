const jwt = require('jsonwebtoken');
const User = require('../models/User');

const clients = new Map();
const onlineUsers = new Map();

function setupWebSocket(wss) {
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', async (ws, req) => {
    let userId = null;
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'AUTH') {
          try {
            const decoded = jwt.verify(
              message.token,
              process.env.JWT_SECRET || 'dev_secret'
            );
            
            userId = decoded.id.toString();

            const user = await User.findById(userId).select('name avatar');
            if (!user) {
              ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'User not found' }));
              return;
            }

            if (!clients.has(userId)) {
              clients.set(userId, new Set());
            }
            clients.get(userId).add(ws);

            await User.findByIdAndUpdate(userId, { 
              isOnline: true, 
              lastSeen: new Date() 
            });

            onlineUsers.set(userId, {
              id: userId,
              name: user.name,
              avatar: user.avatar,
            });

            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', userId }));

            broadcastOnlineUsers(wss);
          } catch (err) {
            ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Invalid token' }));
          }
          return;
        }

        if (!userId) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Not authenticated' }));
          return;
        }


        if (message.type === 'PROPERTY_UPDATE') {
          broadcastToAll(wss, {
            type: 'PROPERTY_UPDATED',
            propertyId: message.propertyId,
            isAvailable: message.isAvailable,
            updatedBy: userId,
          });
        }

        if (message.type === 'NEW_REVIEW') {
          broadcastToAll(wss, {
            type: 'REVIEW_ADDED',
            propertyId: message.propertyId,
            review: message.review,
          });
        }

        if (message.type === 'NEW_LEASE') {
          broadcastToAll(wss, {
            type: 'LEASE_CREATED',
            propertyId: message.propertyId,
            leaseId: message.leaseId,
          });
        }

        if (message.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
        }

      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', async () => {
      if (userId) {
        const userConnections = clients.get(userId);
        if (userConnections) {
          userConnections.delete(ws);
          
          if (userConnections.size === 0) {
            clients.delete(userId);
            onlineUsers.delete(userId);
            
            try {
              await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date(),
              });
              broadcastOnlineUsers(wss);
            } catch (err) {
              console.error("Error updating user status on close:", err);
            }
          }
        }
      }
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error for user ${userId}:`, err);
    });
  });

  wss.on('close', () => {
    clearInterval(interval);
  });
}


function broadcastToAll(wss, data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { 
      client.send(message);
    }
  });
}

function broadcastOnlineUsers(wss) {
  const users = Array.from(onlineUsers.values());
  broadcastToAll(wss, { type: 'ONLINE_USERS', users });
}

function sendToUser(userId, data) {
  if (!userId) return;
  const userConnections = clients.get(userId.toString());
  if (userConnections) {
    const message = JSON.stringify(data);
    userConnections.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(message);
      }
    });
  }
}

module.exports = { 
  setupWebSocket, 
  broadcastToAll, 
  sendToUser, 
  broadcastOnlineUsers 
};