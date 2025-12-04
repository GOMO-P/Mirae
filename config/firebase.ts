import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: 'AIzaSyDYgfGY9Qqvg630nptcn1WNBqhb1GXLezo',
  authDomain: 'test-1ccad42a.firebaseapp.com',
  projectId: 'test-1ccad42a',
  storageBucket: 'test-1ccad42a.firebasestorage.app',
  messagingSenderId: '753991690407',
  appId: '1:753991690407:web:baec9d8d9820401e289382',
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스
// getAuth는 자동으로 플랫폼을 감지하고 적절한 설정을 사용합니다
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
