import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: 'AIzaSyCNpAXo9k_5oGoVaf2ebU2kWjQiiTk4K0o',
  authDomain: 'myapp-bc5d3.firebaseapp.com',
  projectId: 'myapp-bc5d3',
  storageBucket: 'myapp-bc5d3.firebasestorage.app',
  messagingSenderId: '81835239864',
  appId: '1:81835239864:web:0c31492d967f4d4382474d',
  measurementId: 'G-80K5K3M4KQ',
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스
// getAuth는 자동으로 플랫폼을 감지하고 적절한 설정을 사용합니다
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
