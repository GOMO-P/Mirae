import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Memo } from '../types/memo';

const MEMOS_COLLECTION = 'memos';

export const memoService = {
  // 메모 추가
  async addMemo(title: string, content: string): Promise<string> {
    const docRef = await addDoc(collection(db, MEMOS_COLLECTION), {
      title,
      content,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 모든 메모 가져오기
  async getMemos(): Promise<Memo[]> {
    const q = query(collection(db, MEMOS_COLLECTION), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      content: doc.data().content,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    }));
  },

  // 메모 수정
  async updateMemo(id: string, title: string, content: string): Promise<void> {
    const memoRef = doc(db, MEMOS_COLLECTION, id);
    await updateDoc(memoRef, {
      title,
      content,
      updatedAt: Timestamp.now(),
    });
  },

  // 메모 삭제
  async deleteMemo(id: string): Promise<void> {
    await deleteDoc(doc(db, MEMOS_COLLECTION, id));
  },
};
