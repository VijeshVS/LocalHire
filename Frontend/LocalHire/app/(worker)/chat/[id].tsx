import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from '../../../components/Icon';

const chatData = {
  '1': {
    name: 'Rajesh Kumar',
    jobTitle: 'House Painting Job',
    online: true,
    messages: [
      { id: '1', text: 'Hi! I saw your application for the painting job.', sender: 'employer', time: '10:30 AM' },
      { id: '2', text: 'Hello! Yes, I am very interested in this opportunity.', sender: 'worker', time: '10:32 AM' },
      { id: '3', text: 'Great! Do you have experience with interior painting?', sender: 'employer', time: '10:33 AM' },
      { id: '4', text: 'Yes, I have over 3 years of experience in interior and exterior painting. I can share some photos of my previous work.', sender: 'worker', time: '10:35 AM' },
      { id: '5', text: 'Perfect! The job is for 3 rooms. When can you start?', sender: 'employer', time: '10:40 AM' },
      { id: '6', text: 'I can start tomorrow morning. What time works best for you?', sender: 'worker', time: '10:42 AM' },
      { id: '7', text: 'How about 9 AM? The address is 123 MG Road, Koramangala.', sender: 'employer', time: '10:45 AM' },
      { id: '8', text: 'Perfect! I will be there at 9 AM sharp. Should I bring my own painting supplies?', sender: 'worker', time: '10:47 AM' },
    ]
  }
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(chatData[id as keyof typeof chatData]?.messages || []);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chat = chatData[id as keyof typeof chatData];

  useEffect(() => {
    // Scroll to bottom when component mounts
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'worker',
        time: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }),
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      // Simulate typing indicator and response
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const responses = [
          "That sounds good!",
          "I'll get back to you shortly.",
          "Perfect, looking forward to working with you.",
          "Thanks for the quick response.",
        ];
        const response = {
          id: (Date.now() + 1).toString(),
          text: responses[Math.floor(Math.random() * responses.length)],
          sender: 'employer',
          time: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }),
        };
        setMessages(prev => [...prev, response]);
      }, 2000);

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item }: { item: typeof messages[0] }) => {
    const isWorker = item.sender === 'worker';
    
    return (
      <View style={[
        styles.messageContainer,
        isWorker ? styles.workerMessageContainer : styles.employerMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isWorker ? styles.workerBubble : styles.employerBubble
        ]}>
          <Text style={[
            styles.messageText,
            isWorker ? styles.workerMessageText : styles.employerMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isWorker ? styles.workerMessageTime : styles.employerMessageTime
          ]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, styles.dot1]} />
          <View style={[styles.typingDot, styles.dot2]} />
          <View style={[styles.typingDot, styles.dot3]} />
        </View>
      </View>
    </View>
  );

  if (!chat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Chat not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>RK</Text>
            {chat.online && <View style={styles.headerOnlineIndicator} />}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{chat.name}</Text>
            <Text style={styles.headerJobTitle}>{chat.jobTitle}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Icon name="call" size={20} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Icon name="options" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isTyping ? renderTypingIndicator : null}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Icon name="add" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity 
              style={[styles.sendButton, message.trim() && styles.sendButtonActive]}
              onPress={sendMessage}
              disabled={!message.trim()}
            >
              <Icon 
                name="arrow-back" 
                size={20} 
                color={message.trim() ? 'white' : '#9ca3af'}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  headerAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatarText: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  headerOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16a34a',
    borderWidth: 2,
    borderColor: 'white',
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  headerJobTitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  workerMessageContainer: {
    alignItems: 'flex-end',
  },
  employerMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  workerBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  employerBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  workerMessageText: {
    color: 'white',
  },
  employerMessageText: {
    color: '#374151',
  },
  messageTime: {
    fontSize: 12,
  },
  workerMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  employerMessageTime: {
    color: '#9ca3af',
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typingBubble: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  attachButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  sendButtonActive: {
    backgroundColor: '#2563eb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
});