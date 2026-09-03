import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { NotificationService, AppNotification } from '../lib/NotificationService';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    
    const unsubscribe = NotificationService.subscribeNotifications(user.id, (notifs) => {
      setNotifications(notifs);
    });
    
    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  const markRead = useCallback(async (id: string) => {
    if (user) {
      await NotificationService.markRead(user.id, id);
    }
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (user) {
      await NotificationService.markAllRead(user.id);
    }
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    if (user) {
      // Optimistic update
      const targetNotif = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      await NotificationService.deleteNotification(user.id, id);
      
      toast('Notification deleted', {
        action: {
          label: 'Undo',
          onClick: async () => {
            await NotificationService.restoreNotification(user.id, id);
          }
        },
        duration: 5000,
      });
    }
  }, [user, notifications]);

  const deleteAllNotifications = useCallback(async () => {
    if (user) {
      setNotifications([]);
      try {
        const batch = writeBatch(db);
        notifications.forEach(n => {
          const ref = doc(db, 'users', user.id, 'notifications', n.id);
          batch.update(ref, { deleted: true });
        });
        await batch.commit();
        toast.success('All notifications deleted');
      } catch (e) {
        console.error('Error deleting all notifications', e);
        toast.error('Failed to delete all notifications');
      }
    }
  }, [user, notifications]);

  const archiveNotification = useCallback(async (id: string) => {
    if (user) {
      await NotificationService.archiveNotification(user.id, id);
      toast.success('Notification archived');
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      deleteNotification,
      deleteAllNotifications,
      archiveNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
