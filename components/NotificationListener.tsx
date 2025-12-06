import {useEffect, useRef} from 'react';
import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import {collection, query, where, onSnapshot} from 'firebase/firestore';
import {db} from '@/config/firebase';
import {useAuthContext} from '@/contexts/AuthContext';
import {useSegments} from 'expo-router';

// 알림 핸들러 설정 (앱이 포그라운드에 있을 때 알림 표시 방법)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export function NotificationListener() {
  const {user} = useAuthContext();
  const segments = useSegments();
  const lastMessageTimes = useRef<{[key: string]: any}>({});

  // 1. 권한 요청
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (Platform.OS === 'web') return;

      const {status: existingStatus} = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const {status} = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
    }

    registerForPushNotificationsAsync();
  }, []);

  // 2. 채팅방 구독 및 알림 트리거
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified' || change.type === 'added') {
          const data = change.doc.data();
          const roomId = change.doc.id;

          // 초기 로딩 시 알림 방지 (또는 너무 오래된 메시지 방지)
          // 여기서는 간단히 change.type === 'added'일 때는 무시하고 'modified'일 때만 처리할 수도 있음
          // 하지만 새로운 채팅방이 생겼을 때도 알림이 필요할 수 있으므로,
          // lastMessageAt을 비교하는 것이 좋음.

          // 현재 로직: 앱 켜진 후 수신된 메시지만 알림
          // lastMessageTimes에 저장된 시간보다 새로운 시간이면 알림

          const lastMsgTime = data.lastMessageAt?.toMillis
            ? data.lastMessageAt.toMillis()
            : Date.now();
          const prevTime = lastMessageTimes.current[roomId] || 0;

          // 최초 실행 시에는 현재 상태를 저장만 하고 알림은 스킵 (앱 켤 때 쏟아지는 알림 방지)
          if (prevTime === 0) {
            lastMessageTimes.current[roomId] = lastMsgTime;
            return;
          }

          if (lastMsgTime > prevTime) {
            lastMessageTimes.current[roomId] = lastMsgTime;

            // 내가 보낸 메시지는 무시
            if (data.lastMessageSenderId === user.uid) return;

            // 알림 끈 채팅방 무시
            if (data.mutedBy && data.mutedBy.includes(user.uid)) return;

            // 현재 보고 있는 채팅방이면 무시 (선택 사항)
            // segments를 확인하여 현재 라우트가 해당 채팅방인지 확인
            // segments 예: ['(tabs)', 'chat', '[id]'] 또는 ['chat', '[id]']
            // params를 가져오기 어려우므로 간단히 체크하거나,
            // unreadCounts를 믿을 수도 있음.

            // unreadCounts가 나에게 0보다 크면 알림
            const myUnread = data.unreadCounts?.[user.uid] || 0;
            if (myUnread > 0) {
              // 알림 발송
              Notifications.scheduleNotificationAsync({
                content: {
                  title: data.name || '새 메시지',
                  body: data.lastMessage || '사진을 보냈습니다.',
                  data: {url: `/chat/${roomId}?name=${data.name}`}, // 딥링크용 데이터
                },
                trigger: null, // 즉시 발송
              });
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  // 3. 알림 클릭 처리 (딥링크 이동)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data.url;
      // 여기서 router.push(url) 등을 할 수 있으나,
      // NotificationListener가 렌더링되는 위치에 따라 router 사용이 가능해야 함.
      // _layout.tsx에서 렌더링되므로 router 사용 가능.
      // 하지만 router 객체는 컴포넌트 내부에서 가져와야 함.
    });
    return () => subscription.remove();
  }, []);

  return null; // UI 없음
}
