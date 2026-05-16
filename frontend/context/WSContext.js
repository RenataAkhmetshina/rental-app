'use client';
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WSContext = createContext(null);

export function WSProvider({ children }) {
  const { token } = useAuth();
  const tokenRef = useRef(token); 
  const wsRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const listeners = useRef({});
  const reconnectTimer = useRef(null);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const connect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setConnected(true);
      if (tokenRef.current) {
        ws.send(JSON.stringify({ type: 'AUTH', token: tokenRef.current }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ONLINE_USERS') setOnlineUsers(msg.users);
        
        listeners.current[msg.type]?.forEach((cb) => cb(msg));
        listeners.current['*']?.forEach((cb) => cb(msg));
      } catch (err) {
        console.error("WS Parse Error", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };
  }, []); 

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    if (connected && token && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'AUTH', token }));
    }
  }, [token, connected]);

  const on = useCallback((type, cb) => {
    if (!listeners.current[type]) listeners.current[type] = new Set();
    listeners.current[type].add(cb);
    return () => {
      listeners.current[type]?.delete(cb);
    };
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return (
    <WSContext.Provider value={{ connected, onlineUsers, send, on }}>
      {children}
    </WSContext.Provider>
  );
}

export const useWS = () => useContext(WSContext);