import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { memoService } from '../../services/memoService';
import { Memo } from '../../types/memo';

export default function MemoScreen() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMemos();
  }, []);

  const loadMemos = async () => {
    try {
      const data = await memoService.getMemos();
      setMemos(data);
    } catch (error) {
      Alert.alert('오류', '메모를 불러오는데 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('알림', '제목과 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await memoService.updateMemo(editingId, title, content);
      } else {
        await memoService.addMemo(title, content);
      }
      setTitle('');
      setContent('');
      setEditingId(null);
      await loadMemos();
    } catch (error) {
      Alert.alert('오류', '메모 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (memo: Memo) => {
    setTitle(memo.title);
    setContent(memo.content);
    setEditingId(memo.id);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      '삭제 확인',
      '정말 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await memoService.deleteMemo(id);
              await loadMemos();
            } catch (error) {
              Alert.alert('오류', '메모 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.titleInput}
          placeholder="제목"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.contentInput}
          placeholder="내용을 입력하세요"
          value={content}
          onChangeText={setContent}
          multiline
        />
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {editingId ? '수정' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={memos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.memoItem}>
            <View style={styles.memoContent}>
              <Text style={styles.memoTitle}>{item.title}</Text>
              <Text style={styles.memoText} numberOfLines={2}>
                {item.content}
              </Text>
              <Text style={styles.memoDate}>
                {item.updatedAt.toLocaleDateString('ko-KR')}
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.buttonText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.buttonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>메모가 없습니다</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  memoItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memoContent: {
    flex: 1,
  },
  memoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memoDate: {
    fontSize: 12,
    color: '#999',
  },
  buttonContainer: {
    justifyContent: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
});
