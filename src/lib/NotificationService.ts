import { sanitizeForFirestore } from './firestoreUtils';
import { collection, doc, setDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, writeBatch, serverTimestamp, getDocs, Timestamp, where } from 'firebase/firestore';
import { db } from './firebase';

export type NotificationType = 'upload' | 'report' | 'ai' | 'forecast' | 'system' | 'analytics';
export type NotificationPriority = 'success' | 'warning' | 'error' | 'info';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  createdAt: any; // Firestore Timestamp
  actionUrl?: string;
  icon?: string;
  metadata?: any;
  deleted?: boolean;
  archived?: boolean;
}

export class NotificationService {
  static async createNotification(userId: string, notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    if (!userId) return;
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const newDocRef = doc(notificationsRef);
    
    await setDoc(newDocRef, sanitizeForFirestore({
      ...notification,
      id: newDocRef.id,
      read: false,
      deleted: false,
      archived: false,
      createdAt: serverTimestamp()
    }));
  }

  static async markRead(userId: string, notificationId: string) {
    const docRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  }

  static async markAllRead(userId: string) {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('read', '==', false), where('deleted', '==', false));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  }

  static async deleteNotification(userId: string, notificationId: string) {
    const docRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(docRef, { deleted: true });
  }
  
  static async restoreNotification(userId: string, notificationId: string) {
    const docRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(docRef, { deleted: false });
  }

  static async archiveNotification(userId: string, notificationId: string) {
    const docRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(docRef, { archived: true });
  }

  static subscribeNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
    if (!userId) {
      callback([]);
      return () => {};
    }
    
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(
      notificationsRef, 
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as AppNotification;
        if (!data.deleted) {
          notifs.push(data);
        }
      });
      callback(notifs);
    });
  }
}
