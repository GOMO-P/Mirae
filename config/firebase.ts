import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: 'AIzaSyBvSLcQnOUXb-9htltF-3wz8G6Tr8Y-03w',
  authDomain: 'gomo-d42fc.firebaseapp.com',
  projectId: 'gomo-d42fc',
  storageBucket: 'gomo-d42fc.firebasestorage.app',
  messagingSenderId: '771029392525',
  appId: '1:771029392525:web:6ee22f4241fd61d7e096c4',
  measurementId: 'G-30NW6LKXHZ',
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스
// getAuth는 자동으로 플랫폼을 감지하고 적절한 설정을 사용합니다
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
