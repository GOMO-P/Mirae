import {useState} from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
// 🔥 DB 관련 모듈 추가
import {doc, setDoc, serverTimestamp} from 'firebase/firestore';
import {auth, db} from '@/config/firebase'; // db 추가

interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

interface SignInData {
  email: string;
  password: string;
}

export default function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async ({email, password, name}: SignUpData): Promise<User | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. 인증(Authentication) 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. 프로필 이름 업데이트
      if (name) {
        await updateProfile(user, {displayName: name});
      }

      // 3. 🔥 [추가됨] Firestore 'users' 컬렉션에 내 정보 저장
      // 이 부분이 있어야 나중에 친구 찾기가 가능합니다!
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: name || '이름 없음',
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      return user;
    } catch (err: any) {
      setLoading(false);

      // 에러 처리
      let errorMessage = 'An error occurred during sign up';
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      return null;
    }
  };

  const signIn = async ({email, password}: SignInData): Promise<User | null> => {
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      return userCredential.user;
    } catch (err: any) {
      setLoading(false);

      let errorMessage = 'An error occurred during sign in';
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // 최신 파이어베이스 에러 코드 대응
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      return null;
    }
  };

  const logout = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await signOut(auth);
      setLoading(false);
      return true;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'An error occurred during sign out');
      return false;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const deleteAccount = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        setLoading(false);
        return null;
      }
      return 'No user logged in';
    } catch (err: any) {
      setLoading(false);

      let errorMessage = 'An error occurred during account deletion';
      if (err.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log in again to delete your account';
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      return errorMessage;
    }
  };

  return {
    signUp,
    signIn,
    logout,
    deleteAccount,
    loading,
    error,
    clearError,
  };
}
