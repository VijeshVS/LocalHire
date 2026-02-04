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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../../constants/theme';
import { getConversationDetails, getMessages, sendMessage } from '../../../services/messageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EmployerChatScreen() {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatData();
  }, [id]);

  const loadChatData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user id
      const userId = await AsyncStorage.getItem('user_id');
      setCurrentUserId(userId);

      // Load conversation details
      const conversationId = Array.isArray(id) ? id[0] : id;
      const convDetails = await getConversationDetails(conversationId);
      
      const otherUser = convDetails.other_user;
      const name = otherUser?.name || 'Unknown';
      
      setChatData({
        id: conversationId,
        name: name,
        role: convDetails.other_user_role === 'EMPLOYEE' ? 'Worker' : 'Employer',
        jobTitle: convDetails.job?.title || 'General',
        online: false,
        avatar: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      });

      // Load messages
      const msgs = await getMessages(conversationId);
      const formattedMsgs = msgs.map((msg: any) => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender_id === userId ? 'employer' : 'worker',
        timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        read: msg.is_read,
      }));
      setMessages(formattedMsgs);
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      const conversationId = Array.isArray(id) ? id[0] : id;
      const msgs = await getMessages(conversationId);
      const userId = await AsyncStorage.getItem('user_id');
      
      const formattedMsgs = msgs.map((msg: any) => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender_id === userId ? 'employer' : 'worker',
        timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        read: msg.is_read,
      }));
      setMessages(formattedMsgs);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSend = async () => {
    if (inputText.trim().length === 0) return;

    const messageText = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    // Optimistically add message
    const tempMessage = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: 'employer',
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      read: false,
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const conversationId = Array.isArray(id) ? id[0] : id;
      const sentMsg = await sendMessage(conversationId, messageText);
      
      // Replace temp message with real one
      setMessages(prev => prev.map(m => 
        m.id === tempMessage.id 
          ? {
              id: sentMsg.id,
              text: sentMsg.text,
              sender: 'employer',
              timestamp: new Date(sentMsg.created_at).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }),
              read: sentMsg.is_read,
            }
          : m
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  const renderMessage = ({ item }: any) => {
    const isEmployer = item.sender === 'employer';

    return (
      <View style={[
        styles.messageContainer,
        isEmployer ? styles.messageContainerEmployer : styles.messageContainerWorker
      ]}>
        <View style={[
          styles.messageBubble,
          isEmployer ? styles.messageBubbleEmployer : styles.messageBubbleWorker
        ]}>
          <Text style={[
            styles.messageText,
            isEmployer ? styles.messageTextEmployer : styles.messageTextWorker
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isEmployer ? styles.timestampEmployer : styles.timestampWorker
            ]}>
              {item.timestamp}
            </Text>
            {isEmployer && (
              <Ionicons 
                name={item.read ? 'checkmark-done' : 'checkmark'} 
                size={16} 
                color={item.read ? '#10b981' : COLORS.white}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

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
              {isTyping ? 'typing...' : chatData.role}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <Ionicons 
              name="refresh-outline" 
              size={22} 
              color={isRefreshing ? COLORS.gray[400] : COLORS.gray[700]} 
              style={isRefreshing ? styles.refreshing : undefined}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call-outline" size={22} color={COLORS.gray[700]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Job Context Banner */}
      <View style={styles.contextBanner}>
        <Ionicons name="briefcase" size={16} color="#6366f1" />
        <Text style={styles.contextText}>Re: {chatData.jobTitle}</Text>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.messagesContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.gray[300]} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          }
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.gray[400]}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim().length > 0 && styles.sendButtonActive
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
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
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshing: {
    transform: [{ rotate: '180deg' }],
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: '#eef2ff',
    gap: SPACING.xs,
  },
  contextText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6366f1',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: SPACING.lg,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[500],
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
  },
  messageContainer: {
    marginBottom: SPACING.sm,
    flexDirection: 'row',
  },
  messageContainerEmployer: {
    justifyContent: 'flex-end',
  },
  messageContainerWorker: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
  },
  messageBubbleEmployer: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: RADIUS.sm,
  },
  messageBubbleWorker: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: RADIUS.sm,
    ...SHADOWS.sm,
  },
  messageText: {
    fontSize: TYPOGRAPHY.sizes.base,
    lineHeight: 22,
  },
  messageTextEmployer: {
    color: COLORS.white,
  },
  messageTextWorker: {
    color: COLORS.gray[900],
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  timestampEmployer: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timestampWorker: {
    color: COLORS.gray[400],
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
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    maxHeight: 120,
  },
  textInput: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#6366f1',
  },
});
