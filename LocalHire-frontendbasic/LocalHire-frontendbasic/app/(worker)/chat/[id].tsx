import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../../constants/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [chatData, setChatData] = useState({
    id: '',
    name: 'Chat',
    role: '',
    jobTitle: '',
    online: false,
    avatar: 'U',
  });
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    const newMessage = {
      id: String(messages.length + 1),
      text: inputText.trim(),
      sender: 'worker',
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      read: false,
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    Keyboard.dismiss();

    // Simulate employer typing
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const reply = {
          id: String(messages.length + 2),
          text: 'Great! I will send you the location details.',
          sender: 'employer',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          read: false,
        };
        setMessages(prev => [...prev, reply]);
      }, 2000);
    }, 500);
  };

  const renderMessage = ({ item }: any) => {
    const isWorker = item.sender === 'worker';

    return (
      <View style={[
        styles.messageContainer,
        isWorker ? styles.messageContainerWorker : styles.messageContainerEmployer
      ]}>
        <View style={[
          styles.messageBubble,
          isWorker ? styles.messageBubbleWorker : styles.messageBubbleEmployer
        ]}>
          <Text style={[
            styles.messageText,
            isWorker ? styles.messageTextWorker : styles.messageTextEmployer
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isWorker ? styles.timestampWorker : styles.timestampEmployer
            ]}>
              {item.timestamp}
            </Text>
            {isWorker && (
              <Ionicons 
                name={item.read ? 'checkmark-done' : 'checkmark'} 
                size={16} 
                color={item.read ? COLORS.worker.primary : COLORS.white}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter} activeOpacity={0.7}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{chatData.avatar}</Text>
            </View>
            {chatData.online && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{chatData.name}</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? 'typing...' : chatData.online ? 'online' : 'offline'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call-outline" size={22} color={COLORS.gray[700]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={22} color={COLORS.gray[700]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Job Context Banner */}
      <View style={styles.contextBanner}>
        <Ionicons name="briefcase" size={16} color={COLORS.worker.primary} />
        <Text style={styles.contextText}>{chatData.jobTitle}</Text>
        <TouchableOpacity>
          <Text style={styles.contextLink}>View Details</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingBubble}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, styles.typingDotDelay1]} />
            <View style={[styles.typingDot, styles.typingDotDelay2]} />
          </View>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle" size={28} color={COLORS.worker.primary} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.gray[400]}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.emojiButton}>
              <Ionicons name="happy-outline" size={22} color={COLORS.gray[500]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim().length === 0 && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={inputText.trim().length === 0}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim().length > 0 ? COLORS.white : COLORS.gray[400]} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.worker.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.status.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  headerInfo: {
    marginLeft: SPACING.md,
  },
  headerName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  headerStatus: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.worker.bg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  contextText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[700],
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  contextLink: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.worker.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  messagesList: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  messageContainer: {
    marginBottom: SPACING.md,
    maxWidth: '75%',
  },
  messageContainerWorker: {
    alignSelf: 'flex-end',
  },
  messageContainerEmployer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  messageBubbleWorker: {
    backgroundColor: COLORS.worker.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleEmployer: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: TYPOGRAPHY.sizes.base,
    lineHeight: 20,
  },
  messageTextWorker: {
    color: COLORS.white,
  },
  messageTextEmployer: {
    color: COLORS.gray[900],
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  timestampWorker: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timestampEmployer: {
    color: COLORS.gray[500],
  },
  typingIndicator: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray[400],
  },
  typingDotDelay1: {
    opacity: 0.7,
  },
  typingDotDelay2: {
    opacity: 0.4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    gap: SPACING.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
    paddingVertical: SPACING.sm,
    maxHeight: 100,
  },
  emojiButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.worker.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray[200],
  },
});