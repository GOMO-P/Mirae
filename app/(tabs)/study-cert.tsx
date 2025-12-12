import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router, useLocalSearchParams} from 'expo-router';
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  writeBatch,
  increment,
  runTransaction,
} from 'firebase/firestore';
import {db, storage} from '../../config/firebase';

import * as ImagePicker from 'expo-image-picker';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';

import {useAuthContext} from '@/contexts/AuthContext';
import {useGroupContext} from '@/contexts/GroupContext';
import {userService, UserProfile} from '@/services/userService';

const BLUE = '#4A90E2';
const LIGHT_BG = '#F5F7FA';
const LIGHT_CARD = '#FFFFFF';
const GRAY = '#8E8E93';
const LIGHT_GRAY = '#E5E5EA';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1C1C1E';

const weekdayKo = ['일', '월', '화', '수', '목', '금', '토'];

export default function StudyCertScreen() {
  const {user} = useAuthContext();
  const {getMyGroups} = useGroupContext();
  const myGroups = getMyGroups();

  const params = useLocalSearchParams();
  const [studyMode, setStudyMode] = useState<'solo' | 'group'>(
    params.mode === 'group' || params.mode === 'solo' ? params.mode : 'solo',
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 그룹 선택 관련 state
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // 사용자 프로필 로드 (Firestore에서 displayName 가져오기)
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.uid) {
        const profile = await userService.getUserProfile(user.uid);
        setUserProfile(profile);
      }
    };
    loadUserProfile();
  }, [user?.uid]);

  // ===== 날짜 조절 =====
  const changeMonth = (delta: number) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  const changeDay = (delta: number) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();
  const weekday = weekdayKo[selectedDate.getDay()];

  // ===== 사진 선택 =====
  const pickImage = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '앨범 접근 권한을 허용해주세요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ===== 시간 조절 =====
  const changeHours = (delta: number) => {
    setHours(prev => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next > 24) return 24;
      return next;
    });
  };

  const changeMinutes = (delta: number) => {
    setMinutes(prev => {
      let total = prev + delta;
      if (total < 0) total = 0;
      if (total > 55) total = 55;
      const mod = total % 5;
      if (mod !== 0) total = total - mod;
      return total;
    });
  };

  // ===== 등록 처리 =====
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('안내', '오늘 공부한 내용을 적어주세요.');
      return;
    }
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 1) {
      Alert.alert('안내', '공부한 시간을 1분 이상으로 설정해주세요.');
      return;
    }

    if (studyMode === 'group' && !selectedGroupId) {
      Alert.alert('안내', '공부한 그룹을 선택해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // --- 사진 업로드 (있을 때만) ---
      if (imageUri) {
        try {
          // fetch 대신 XMLHttpRequest 사용 (React Native Blob 이슈 해결)
          const blob: any = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
              resolve(xhr.response);
            };
            xhr.onerror = function (e) {
              console.error(e);
              reject(new TypeError('Network request failed'));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', imageUri, true);
            xhr.send(null);
          });

          const fileRef = ref(storage, `studyCerts/${user.uid}/${Date.now()}.jpg`);

          await uploadBytes(fileRef, blob);
          imageUrl = await getDownloadURL(fileRef);

          // Blob 해제 (메모리 누수 방지, 필요한 경우)
          // if (blob.close) blob.close();
        } catch (err) {
          console.error('이미지 업로드 에러:', err);
          Alert.alert('사진 업로드 실패', '사진은 업로드하지 못했지만,\n인증 내용만 저장할게요.');
        }
      }

      // --- Firestore Transaction: 기록 저장 + 포인트 지급 ---
      const points = totalMinutes; // 1분당 1포인트

      const selectedGroup = myGroups.find(g => g.id === selectedGroupId);
      const selectedGroupName = selectedGroup ? selectedGroup.name : null;

      await runTransaction(db, async transaction => {
        // 1. Study Record 생성
        const newRecordRef = doc(collection(db, 'studyRecords'));
        transaction.set(newRecordRef, {
          uid: user.uid,
          userDisplayName:
            userProfile?.displayName || user.displayName || user.email?.split('@')[0] || '익명',
          userPhotoURL: userProfile?.photoURL || user.photoURL || null,
          studyMode, // 'solo' | 'group'
          groupId: studyMode === 'group' ? selectedGroupId : null,
          groupName: studyMode === 'group' ? selectedGroupName : null,
          studyDate: selectedDate.toISOString(),
          studyDateDisplay: `${year}년 ${month}월 ${day}일 (${weekday})`,
          hours,
          minutes,
          totalMinutes,
          description,
          imageUrl: imageUrl ?? null,
          createdAt: serverTimestamp(),
          pointsEarned: points,
        });

        // 2. 개인 포인트 지급
        const userRef = doc(db, 'users', user.uid);
        transaction.update(userRef, {
          totalPoints: increment(points),
          totalStudyMinutes: increment(totalMinutes),
        });

        // 3. 그룹 포인트 지급 (그룹 모드인 경우)
        if (studyMode === 'group' && selectedGroupId) {
          const groupRef = doc(db, 'groups', selectedGroupId);
          transaction.update(groupRef, {
            totalPoints: increment(points),
          });
        }
      });

      // 폼 초기화
      setDescription('');
      setImageUri(null);
      setHours(1);
      setMinutes(0);
      setSelectedDate(new Date());
      setSelectedGroupId(null);

      Alert.alert('성공', `${points} 포인트를 획득했어요! 👏`);
      if (params.returnFilter) {
        router.replace(`/study-feed?initialFilter=${params.returnFilter}`);
      } else {
        router.replace('/study-feed');
      }
    } catch (e) {
      console.error('인증 등록 전체 에러:', e);
      Alert.alert('에러', '저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGroupName = myGroups.find(g => g.id === selectedGroupId)?.name || '선택하기';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>스터디 인증</Text>
        </View>

        <View style={styles.card}>
          {/* 1. 공부 모드 */}
          <View style={styles.section}>
            <Text style={styles.label}>어떻게 공부 하셨나요?</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  studyMode === 'solo' ? styles.toggleActive : styles.toggleInactive,
                ]}
                onPress={() => setStudyMode('solo')}>
                <Text
                  style={[
                    styles.toggleText,
                    studyMode === 'solo' ? styles.toggleTextActive : styles.toggleTextInactive,
                  ]}>
                  혼자 공부
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggle,
                  studyMode === 'group' ? styles.toggleActive : styles.toggleInactive,
                ]}
                onPress={() => setStudyMode('group')}>
                <Text
                  style={[
                    styles.toggleText,
                    studyMode === 'group' ? styles.toggleTextActive : styles.toggleTextInactive,
                  ]}>
                  다같이 공부
                </Text>
              </TouchableOpacity>
            </View>

            {/* 그룹 선택 버튼 (그룹 모드일 때만 표시) */}
            {studyMode === 'group' && (
              <TouchableOpacity
                style={styles.groupSelectButton}
                onPress={() => setGroupModalVisible(true)}>
                <Text style={styles.groupSelectLabel}>공부한 그룹 선택:</Text>
                <Text style={styles.groupSelectValue}>{selectedGroupName}</Text>
                <Text style={styles.chevron}>{'>'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 2. 날짜 선택 */}
          <View style={styles.section}>
            <Text style={styles.label}>공부한 날짜를 선택해주세요!</Text>

            <View style={styles.dateRow}>
              {/* 월 조절 */}
              <View style={styles.dateBlock}>
                <Text style={styles.dateBlockLabel}>MONTH</Text>
                <View style={styles.dateControlRow}>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => changeMonth(-1)}>
                    <Text style={styles.dateBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.dateValue}>{String(month).padStart(2, '0')}</Text>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => changeMonth(1)}>
                    <Text style={styles.dateBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 일 조절 */}
              <View style={styles.dateBlock}>
                <Text style={styles.dateBlockLabel}>DAY</Text>
                <View style={styles.dateControlRow}>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => changeDay(-1)}>
                    <Text style={styles.dateBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.dateValue}>{String(day).padStart(2, '0')}</Text>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => changeDay(1)}>
                    <Text style={styles.dateBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 요일 표시 */}
              <View style={styles.dateBlockSmall}>
                <Text style={styles.dateBlockLabel}>WEEKDAY</Text>
                <Text style={[styles.dateValue, {marginTop: 8}]}>{weekday}</Text>
              </View>
            </View>

            <Text style={styles.dateSummary}>
              {year}년 {month}월 {day}일 ({weekday})
            </Text>
          </View>

          {/* 3. 사진 + 시간 */}
          <View style={styles.section}>
            <Text style={styles.subLabel}>공부한 사진과 시간을 알려주세요!</Text>

            <View style={styles.timeRow}>
              {/* 사진 박스 */}
              <TouchableOpacity style={styles.photoBox} onPress={pickImage} activeOpacity={0.8}>
                {imageUri ? (
                  <Image source={{uri: imageUri}} style={styles.photoImage} />
                ) : (
                  <>
                    <Text style={styles.photoIcon}>🖼</Text>
                    <Text style={styles.photoText}>사진 선택하기{'\n'}(한 번 터치해서 선택)</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* 시간 설정 */}
              <View style={styles.timeBadges}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeTitle}>HOURS</Text>
                  <View style={styles.timeControlRow}>
                    <TouchableOpacity style={styles.timeButton} onPress={() => changeHours(-1)}>
                      <Text style={styles.timeButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{String(hours).padStart(2, '0')}</Text>
                    <TouchableOpacity style={styles.timeButton} onPress={() => changeHours(1)}>
                      <Text style={styles.timeButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.timeBadge}>
                  <Text style={styles.timeTitle}>MINUTES</Text>
                  <View style={styles.timeControlRow}>
                    <TouchableOpacity style={styles.timeButton} onPress={() => changeMinutes(-5)}>
                      <Text style={styles.timeButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{String(minutes).padStart(2, '0')}</Text>
                    <TouchableOpacity style={styles.timeButton} onPress={() => changeMinutes(5)}>
                      <Text style={styles.timeButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 4. 설명 입력 */}
          <View style={styles.section}>
            <Text style={styles.subLabel}>오늘 공부한 내용에 대해 설명해주세요...</Text>
            <TextInput
              style={styles.textArea}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder="오늘 공부한 내용을 적어주세요."
              placeholderTextColor={GRAY}
            />
          </View>

          {/* 5. 인증 등록 버튼 */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && {opacity: 0.6}]}
            onPress={handleSubmit}
            disabled={submitting}>
            <Text style={styles.submitText}>{submitting ? '등록 중...' : '인증 등록하기'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 그룹 선택 모달 */}
      <Modal
        visible={groupModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGroupModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>공부한 그룹을 선택해주세요</Text>
            {myGroups.length === 0 ? (
              <View style={styles.emptyGroupView}>
                <Text style={styles.emptyGroupText}>가입된 그룹이 없어요.</Text>
                <Text style={styles.emptyGroupText}>먼저 그룹에 가입해보세요!</Text>
                <TouchableOpacity
                  style={[styles.modalButton, {marginTop: 20}]}
                  onPress={() => setGroupModalVisible(false)}>
                  <Text style={styles.modalButtonText}>닫기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={myGroups}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={styles.modalGroupItem}
                    onPress={() => {
                      setSelectedGroupId(item.id);
                      setGroupModalVisible(false);
                    }}>
                    <Text style={styles.modalGroupText}>{item.name}</Text>
                    {selectedGroupId === item.id && <Text style={{color: BLUE}}>✓</Text>}
                  </TouchableOpacity>
                )}
                style={{maxHeight: 300, width: '100%'}}
              />
            )}
            {myGroups.length > 0 && (
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setGroupModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LIGHT_BG,
  },
  container: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  back: {
    fontSize: 20,
    marginRight: 12,
    color: '#000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  card: {
    backgroundColor: LIGHT_CARD,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: TEXT_DARK,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: TEXT_DARK,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggle: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleActive: {
    backgroundColor: BLUE,
  },
  toggleInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#303030',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: WHITE,
  },
  toggleTextInactive: {
    color: GRAY,
  },
  groupSelectButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D8FF',
  },
  groupSelectLabel: {
    fontSize: 13,
    color: '#555',
    marginRight: 8,
  },
  groupSelectValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
  },
  chevron: {
    fontSize: 16,
    color: BLUE,
  },
  dateRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dateBlock: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderRadius: 16,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  dateBlockSmall: {
    width: 90,
    backgroundColor: LIGHT_BG,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  dateBlockLabel: {
    fontSize: 11,
    color: GRAY,
  },
  dateControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnText: {
    color: TEXT_DARK,
    fontSize: 18,
    fontWeight: '700',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BLUE,
    marginHorizontal: 8,
    minWidth: 32,
    textAlign: 'center',
  },
  dateSummary: {
    marginTop: 6,
    color: GRAY,
    fontSize: 12,
  },
  timeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  photoBox: {
    flex: 1,
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    backgroundColor: LIGHT_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  photoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoText: {
    fontSize: 11,
    color: GRAY,
    textAlign: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  timeBadges: {
    flex: 1,
    justifyContent: 'space-between',
  },
  timeBadge: {
    borderRadius: 16,
    backgroundColor: LIGHT_BG,
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  timeTitle: {
    fontSize: 11,
    color: GRAY,
  },
  timeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonText: {
    color: TEXT_DARK,
    fontSize: 18,
    fontWeight: '700',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: BLUE,
    marginHorizontal: 8,
    minWidth: 32,
    textAlign: 'center',
  },
  textArea: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    backgroundColor: LIGHT_BG,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 13,
    color: TEXT_DARK,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: BLUE,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 12,
  },
  submitText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 15,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalGroupItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalGroupText: {
    fontSize: 16,
  },
  modalCancelButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: BLUE,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyGroupView: {
    alignItems: 'center',
    padding: 20,
  },
  emptyGroupText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
});
