import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  increment,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
// 🔹 상대 경로로 수정 (폴더 구조에 맞게)
import {db} from '../config/firebase';
import {Alert} from 'react-native';
import {useAuthContext} from './AuthContext';
import {userService, UserProfile} from '../services/userService';

export interface Group {
  id: string;
  name: string;
  description: string;
  currentMembers: number;
  maxMembers: number;
  categories: string[];
  isMonthly?: boolean;
  imageUrl?: string;
  createdAt?: number;
  createdBy?: string;
  members?: string[];
}

interface GroupContextType {
  groups: Group[];
  joinedGroupIds: string[];
  loading: boolean;
  addGroup: (groupData: Omit<Group, 'id' | 'currentMembers' | 'members'>) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  getMonthlyGroups: () => Group[];
  getPopularGroups: () => Group[];
  getMyGroups: () => Group[];
  getGroupMembers: (groupId: string) => Promise<UserProfile[]>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({children}: {children: ReactNode}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const {user} = useAuthContext();

  // 1. 그룹 목록 실시간 동기화
  useEffect(() => {
    // 최신순 정렬 쿼리
    const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      async snapshot => {
        const fetchedGroups: Group[] = snapshot.docs.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Group),
        );

        setGroups(fetchedGroups);

        // 내가 가입한 그룹 ID 추출
        if (user) {
          const myJoined = fetchedGroups.filter(g => g.members?.includes(user.uid)).map(g => g.id);
          setJoinedGroupIds(myJoined);
        }

        setLoading(false);
      },
      error => {
        console.error('🔥 Firebase 데이터 로드 실패:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // 2. 그룹 생성 함수
  const addGroup = async (groupData: Omit<Group, 'id' | 'currentMembers' | 'members'>) => {
    console.log('🔹 addGroup 호출됨');
    console.log('🔹 현재 사용자:', user?.uid);
    console.log('🔹 그룹 데이터:', groupData);

    if (!user) {
      console.error('❌ 로그인되지 않음');
      Alert.alert('로그인 필요', '그룹을 생성하려면 로그인이 필요합니다.');
      throw new Error('User not authenticated');
    }

    try {
      // 사용자 프로필이 없으면 생성
      const userProfile = await userService.getUserProfile(user.uid);
      if (!userProfile) {
        await userService.updateUserProfile(user.uid, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email || '익명',
          photoURL: user.photoURL || undefined,
        });
      }

      const newGroup = {
        ...groupData,
        currentMembers: 1,
        createdAt: Date.now(),
        createdBy: user.uid,
        members: [user.uid], // 생성자는 자동 가입
      };

      console.log('🔹 Firestore에 저장할 데이터:', newGroup);

      const docRef = await addDoc(collection(db, 'groups'), newGroup);

      console.log('✅ 그룹 생성 성공! ID:', docRef.id);
      Alert.alert('성공', '그룹이 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('❌ 그룹 생성 실패:', error);
      Alert.alert('오류', `그룹 생성에 실패했습니다: ${error}`);
      throw error;
    }
  };

  // 3. 그룹 가입 함수
  const joinGroup = async (groupId: string) => {
    if (!user) {
      Alert.alert('로그인 필요', '로그인이 필요합니다.');
      return;
    }

    if (joinedGroupIds.includes(groupId)) return;

    try {
      // 사용자 프로필이 없으면 생성
      const userProfile = await userService.getUserProfile(user.uid);
      if (!userProfile) {
        await userService.updateUserProfile(user.uid, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email || '익명',
          photoURL: user.photoURL || undefined,
        });
      }

      const groupRef = doc(db, 'groups', groupId);

      await updateDoc(groupRef, {
        members: arrayUnion(user.uid),
        currentMembers: increment(1),
      });

      setJoinedGroupIds(prev => [...prev, groupId]);
    } catch (error) {
      console.error('그룹 가입 실패:', error);
      Alert.alert('오류', '가입에 실패했습니다.');
    }
  };

  // 이달의 그룹: 최근 생성된 5개의 그룹
  const getMonthlyGroups = () => {
    // 이미 createdAt 기준 내림차순으로 정렬되어 있으므로 상위 5개만 반환
    return groups.slice(0, 5);
  };

  // 인기 그룹: 7명 이상인 그룹
  const getPopularGroups = () => groups.filter(g => g.currentMembers >= 7);

  const getMyGroups = () => groups.filter(g => joinedGroupIds.includes(g.id));

  // 4. 그룹 멤버 정보 가져오기
  const getGroupMembers = async (groupId: string): Promise<UserProfile[]> => {
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group || !group.members || group.members.length === 0) {
        return [];
      }

      const memberProfiles = await userService.getUserProfiles(group.members);
      return memberProfiles;
    } catch (error) {
      console.error('그룹 멤버 정보 가져오기 실패:', error);
      return [];
    }
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        joinedGroupIds,
        loading,
        addGroup,
        joinGroup,
        getMonthlyGroups,
        getPopularGroups,
        getMyGroups,
        getGroupMembers,
      }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroupContext() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroupContext must be used within a GroupProvider');
  }
  return context;
}
