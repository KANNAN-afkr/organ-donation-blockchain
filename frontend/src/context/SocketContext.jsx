import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000");
    setSocket(s);

    s.on("new_organ_available", (data) => {
      setNotifications((prev) => [{
        id: Date.now(),
        type: "new_organ",
        message: `New ${data.organType} organ available at ${data.hospitalName}`,
        data,
        read: false,
        time: new Date(),
      }, ...prev]);
    });

    s.on("new_organ_request", (data) => {
      setNotifications((prev) => [{
        id: Date.now() + 1,
        type: "new_request",
        message: `Organ request: ${data.organNeeded} (${data.urgencyLevel}) from ${data.hospitalName}`,
        data,
        read: false,
        time: new Date(),
      }, ...prev]);
    });

    return () => s.disconnect();
  }, []);

  const markRead = (id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const clearAll = () => setNotifications([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markRead, clearAll }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
