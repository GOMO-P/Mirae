import {doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, increment} from 'firebase/firestore';
import {db} from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  bio?: string;
  photoURL?: string;
  followersCount?: number;
  followingCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const USERS_COLLECTION = 'users';

export const userService = {
  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, USERS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // 안전하게 문자열로 변환 (name 필드 하위 호환성)
        const displayName = data.displayName 
          ? String(data.displayName) 
          : data.name 
            ? String(data.name) 
            : undefined;
        
        return {
          uid: docSnap.id,
          email: data.email,
          displayName: displayName,
          bio: data.bio,
          photoURL: data.photoURL,
          followersCount: data.followersCount,
          followingCount: data.followingCount,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserProfile;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  // Create or update user profile
  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, USERS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          ...data,
          updatedAt: new Date(),
        });
      } else {
        await setDoc(docRef, {
          ...data,
          uid,
          createdAt: new Date(),
          updatedAt: new Date(),
          followersCount: 0,
          followingCount: 0,
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Delete user profile
  async deleteUserProfile(uid: string): Promise<void> {
    try {
      const docRef = doc(db, USERS_COLLECTION, uid);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  },

  // Follow a user
  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (currentUserId === targetUserId) return;

    try {
      const batch = writeBatch(db);

      // 1. Add to target user's followers subcollection
      const followerRef = doc(db, USERS_COLLECTION, targetUserId, 'followers', currentUserId);
      batch.set(followerRef, {
        uid: currentUserId,
        createdAt: new Date(),
      });

      // 2. Add to current user's following subcollection
      const followingRef = doc(db, USERS_COLLECTION, currentUserId, 'following', targetUserId);
      batch.set(followingRef, {
        uid: targetUserId,
        createdAt: new Date(),
      });

      // 3. Increment followers count on target user
      const targetUserRef = doc(db, USERS_COLLECTION, targetUserId);
      batch.update(targetUserRef, {
        followersCount: increment(1),
      });

      // 4. Increment following count on current user
      const currentUserRef = doc(db, USERS_COLLECTION, currentUserId);
      batch.update(currentUserRef, {
        followingCount: increment(1),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  // Unfollow a user
  async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (currentUserId === targetUserId) return;

    try {
      const batch = writeBatch(db);

      // 1. Remove from target user's followers subcollection
      const followerRef = doc(db, USERS_COLLECTION, targetUserId, 'followers', currentUserId);
      batch.delete(followerRef);

      // 2. Remove from current user's following subcollection
      const followingRef = doc(db, USERS_COLLECTION, currentUserId, 'following', targetUserId);
      batch.delete(followingRef);

      // 3. Decrement followers count on target user
      const targetUserRef = doc(db, USERS_COLLECTION, targetUserId);
      batch.update(targetUserRef, {
        followersCount: increment(-1),
      });

      // 4. Decrement following count on current user
      const currentUserRef = doc(db, USERS_COLLECTION, currentUserId);
      batch.update(currentUserRef, {
        followingCount: increment(-1),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  // Check if following
  async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      const docRef = doc(db, USERS_COLLECTION, currentUserId, 'following', targetUserId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking isFollowing:', error);
      return false;
    }
  },

  // Get multiple user profiles by UIDs
  async getUserProfiles(uids: string[]): Promise<UserProfile[]> {
    try {
      if (uids.length === 0) return [];

      const profiles = await Promise.all(
        uids.map(async uid => {
          const profile = await this.getUserProfile(uid);
          return profile;
        }),
      );

      return profiles.filter((p): p is UserProfile => p !== null);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      return [];
    }
  },
};
