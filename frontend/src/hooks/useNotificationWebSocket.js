import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  connectWebSocket,
  disconnectWebSocket,
  addNotification,
  updateNotification,
  markNotificationAsRead,
  markAllAsRead,
  setWebSocketConnectionStatus,
  addNotifications,
} from '../store/slices/NotificationSlice';
import notificationWebSocketService from '../services/notificationWebSocketService';

export const useNotificationWebSocket = () => {
  const dispatch = useDispatch();
  const { websocketConnected } = useSelector(state => state.notifications);
  const isInitialized = useRef(false);

  useEffect(() => {
    const token = sessionStorage.getItem('access');
    
    if (token && !isInitialized.current) {
      isInitialized.current = true;
      
      // Connect to WebSocket
      dispatch(connectWebSocket(token));
      
      // Set up event handlers
      notificationWebSocketService.on('newNotification', (notification) => {
        dispatch(addNotification(notification));
      });

      notificationWebSocketService.on('notificationUpdated', (notification) => {
        dispatch(updateNotification(notification));
      });

      notificationWebSocketService.on('allNotificationsMarkedRead', () => {
        dispatch(markAllAsRead());
      });

      notificationWebSocketService.on('notificationMarkedRead', (notificationId) => {
        dispatch(markNotificationAsRead(notificationId));
      });

      notificationWebSocketService.on('unreadNotifications', (notifications) => {
        // Bulk add to avoid duplicates
        dispatch(addNotifications(notifications));
      });

      notificationWebSocketService.on('notificationsList', (notifications) => {
        // Bulk add to avoid duplicates
        dispatch(addNotifications(notifications));
      });

      // Monitor connection status
      const checkConnectionStatus = () => {
        const isConnected = notificationWebSocketService.getConnectionStatus();
        dispatch(setWebSocketConnectionStatus(isConnected));
      };

      // Check connection status periodically
      const statusInterval = setInterval(checkConnectionStatus, 5000);

      // Cleanup function
      return () => {
        clearInterval(statusInterval);
        dispatch(disconnectWebSocket());
        isInitialized.current = false;
      };
    }
  }, [dispatch]);

  // Return WebSocket service methods for manual operations
  return {
    websocketConnected,
    markNotificationRead: (notificationId) => {
      notificationWebSocketService.markNotificationRead(notificationId);
    },
    markAllNotificationsRead: () => {
      notificationWebSocketService.markAllNotificationsRead();
    },
    getNotifications: () => {
      notificationWebSocketService.getNotifications();
    },
  };
};
