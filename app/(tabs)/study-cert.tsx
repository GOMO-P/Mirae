// app/study-cert.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';

import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const BLUE = '#316BFF';
const CARD = '#151515';
const GRAY = '#A0A4AF';
const WHITE = '#FFFFFF';

const weekdayKo = ['일', '월', '화', '수', '목', '금', '토'];

export default function StudyCertScreen() {
  const [studyMode, setStudyMode] = useState<'solo' | 'group'>('solo');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

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
    if (!description.trim()) {
      Alert.alert('안내', '오늘 공부한 내용을 적어주세요.');
      return;
    }
    if (hours === 0 && minutes === 0) {
      Alert.alert('안내', '공부한 시간을 1분 이상으로 설정해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // --- 사진 업로드 (있을 때만) ---
      if (imageUri) {
        try {
          console.log('이미지 업로드 시작', imageUri);

          // 웹/모바일 공통: URI -> blob
          const response = await fetch(imageUri);
          const blob = await response.blob();

          const fileRef = ref(
            storage,
            `studyCerts/defaultUser/${Date.now()}.jpg`,
          );

          await uploadBytes(fileRef, blob);
          imageUrl = await getDownloadURL(fileRef);

          console.log('이미지 업로드 완료', imageUrl);
        } catch (err) {
          console.error('이미지 업로드 에러:', err);
          Alert.alert(
            '사진 업로드 실패',
            '사진은 업로드하지 못했지만,\n인증 내용만 저장할게요.',
          );
          // imageUrl은 null 그대로 유지 → 텍스트만 저장
        }
      }

      // --- Firestore에 인증 기록 저장 ---
      await addDoc(collection(db, 'studyRecords'), {
        studyMode, // 'solo' | 'group'
        studyDate: selectedDate.toISOString(),
        studyDateDisplay: `${year}년 ${month}월 ${day}일 (${weekday})`,
        hours,
        minutes,
        totalMinutes: hours * 60 + minutes,
        description,
        imageUrl: imageUrl ?? null,
        createdAt: serverTimestamp(),
      });

      Alert.alert('완료', '공부 인증이 등록되었어요!', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);

      // 폼 초기화
      setDescription('');
      setImageUri(null);
      setHours(1);
      setMinutes(0);
      setSelectedDate(new Date());
    } catch (e) {
      console.error('인증 등록 전체 에러:', e);
      Alert.alert('에러', '저장 중 오류가 발생했어요.');
    } finally {
      setSubmitting(false);
    }
  };

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
                  studyMode === 'solo'
                    ? styles.toggleActive
                    : styles.toggleInactive,
                ]}
                onPress={() => setStudyMode('solo')}>
                <Text
                  style={[
                    styles.toggleText,
                    studyMode === 'solo'
                      ? styles.toggleTextActive
                      : styles.toggleTextInactive,
                  ]}>
                  혼자 공부
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggle,
                  studyMode === 'group'
                    ? styles.toggleActive
                    : styles.toggleInactive,
                ]}
                onPress={() => setStudyMode('group')}>
                <Text
                  style={[
                    styles.toggleText,
                    studyMode === 'group'
                      ? styles.toggleTextActive
                      : styles.toggleTextInactive,
                  ]}>
                  다같이 공부
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. 날짜 선택 */}
          <View style={styles.section}>
            <Text style={styles.label}>공부한 날짜를 선택해주세요!</Text>

            <View style={styles.dateRow}>
              {/* 월 조절 */}
              <View style={styles.dateBlock}>
                <Text style={styles.dateBlockLabel}>MONTH</Text>
                <View style={styles.dateControlRow}>
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => changeMonth(-1)}>
                    <Text style={styles.dateBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.dateValue}>
                    {String(month).padStart(2, '0')}
                  </Text>
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => changeMonth(1)}>
                    <Text style={styles.dateBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 일 조절 */}
              <View style={styles.dateBlock}>
                <Text style={styles.dateBlockLabel}>DAY</Text>
                <View style={styles.dateControlRow}>
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => changeDay(-1)}>
                    <Text style={styles.dateBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.dateValue}>
                    {String(day).padStart(2, '0')}
                  </Text>
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => changeDay(1)}>
                    <Text style={styles.dateBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 요일 표시 */}
              <View style={styles.dateBlockSmall}>
                <Text style={styles.dateBlockLabel}>WEEKDAY</Text>
                <Text style={[styles.dateValue, { marginTop: 8 }]}>
                  {weekday}
                </Text>
              </View>
            </View>

            <Text style={styles.dateSummary}>
              {year}년 {month}월 {day}일 ({weekday})
            </Text>
          </View>

          {/* 3. 사진 + 시간 */}
          <View style={styles.section}>
            <Text style={styles.subLabel}>
              공부한 사진과 시간을 알려주세요!
            </Text>

            <View style={styles.timeRow}>
              {/* 사진 박스 */}
              <TouchableOpacity
                style={styles.photoBox}
                onPress={pickImage}
                activeOpacity={0.8}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.photoImage}
                  />
                ) : (
                  <>
                    <Text style={styles.photoIcon}>🖼</Text>
                    <Text style={styles.photoText}>
                      사진 선택하기{'\n'}(한 번 터치해서 선택)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* 시간 설정 */}
              <View style={styles.timeBadges}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeTitle}>HOURS</Text>
                  <View style={styles.timeControlRow}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => changeHours(-1)}>
                      <Text style={styles.timeButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>
                      {String(hours).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => changeHours(1)}>
                      <Text style={styles.timeButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.timeBadge}>
                  <Text style={styles.timeTitle}>MINUTES</Text>
                  <View style={styles.timeControlRow}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => changeMinutes(-5)}>
                      <Text style={styles.timeButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>
                      {String(minutes).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => changeMinutes(5)}>
                      <Text style={styles.timeButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 4. 설명 입력 */}
          <View style={styles.section}>
            <Text style={styles.subLabel}>
              오늘 공부한 내용에 대해 설명해주세요...
            </Text>
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
            style={[
              styles.submitButton,
              submitting && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={submitting}>
            <Text style={styles.submitText}>
              {submitting ? '등록 중...' : '인증 등록하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
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
    color: WHITE,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: WHITE,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: WHITE,
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
  dateRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dateBlock: {
    flex: 1,
    backgroundColor: '#202020',
    borderRadius: 16,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  dateBlockSmall: {
    width: 90,
    backgroundColor: '#202020',
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
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
    backgroundColor: '#303030',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnText: {
    color: WHITE,
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
    borderColor: '#303030',
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
    backgroundColor: '#202020',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 6,
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
    backgroundColor: '#303030',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonText: {
    color: WHITE,
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
    borderColor: '#303030',
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 13,
    color: WHITE,
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
});
