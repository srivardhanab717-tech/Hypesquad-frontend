import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'coach';
  content: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Quick-prompt chips
// ---------------------------------------------------------------------------

const QUICK_PROMPTS = [
  'Plan my week',
  'I want to quit',
  'I missed 3 days',
  'Hype me up',
];

// ---------------------------------------------------------------------------
// Typing Indicator (3 bouncing dots)
// ---------------------------------------------------------------------------

function TypingIndicator() {
  const { theme } = useTheme();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      );

    const anim1 = createBounce(dot1, 0);
    const anim2 = createBounce(dot2, 150);
    const anim3 = createBounce(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={[typingStyles.container, { backgroundColor: theme.colors.surface }]}>
      {[dot1, dot2, dot3].map((dot, idx) => (
        <Animated.View
          key={idx}
          style={[
            typingStyles.dot,
            { backgroundColor: theme.colors.textSecondary, transform: [{ translateY: dot }] },
          ]}
        />
      ))}
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginLeft: 16,
    marginVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
});

// ---------------------------------------------------------------------------
// AICoachScreen
// ---------------------------------------------------------------------------

export function AICoachScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Fetch conversation history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = (await api.aiCoach.history()) as Message[];
      setMessages(data ?? []);
    } catch (error) {
      // On error, just show empty state
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: Message = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText('');
      setIsTyping(true);

      try {
        const response = (await api.aiCoach.send(text.trim())) as Message;
        setMessages((prev) => [...prev, response]);
      } catch (error) {
        // On error, add a fallback error message from coach
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'coach',
          content: "Sorry, I couldn't process that. Please try again.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [],
  );

  const handleChipPress = (chip: string) => {
    sendMessage(chip);
  };

  const handleSend = () => {
    sendMessage(inputText);
  };

  const navigateToMarketplace = () => {
    navigation.push('CoachMarketplace');
  };

  const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.colors.primary }]
            : [styles.coachBubble, { backgroundColor: theme.colors.surface }],
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isUser ? theme.colors.textInverse : theme.colors.text },
          ]}
        >
          {item.content}
        </Text>
        <Text
          style={[
            styles.timestamp,
            { color: isUser ? theme.colors.textInverse : theme.colors.textSecondary },
          ]}
        >
          {formatTimestamp(item.created_at)}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.coachIntroTitle, { color: theme.colors.text }]}>
        🤖 Your AI Coach
      </Text>
      <Text style={[styles.coachIntroSubtitle, { color: theme.colors.textSecondary }]}>
        I'm here to help you stay on track with your goals. Ask me anything or
        tap a quick prompt below to get started!
      </Text>
      <TouchableOpacity
        style={[styles.marketplaceLink, { borderColor: theme.colors.border }]}
        onPress={navigateToMarketplace}
      >
        <Text style={[styles.marketplaceLinkText, { color: theme.colors.primary }]}>
          Browse Coach Marketplace →
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickPrompts = () => (
    <View style={styles.chipsContainer}>
      {QUICK_PROMPTS.map((prompt) => (
        <TouchableOpacity
          key={prompt}
          style={[styles.chip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => handleChipPress(prompt)}
        >
          <Text style={[styles.chipText, { color: theme.colors.text }]}>{prompt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHeader = () => {
    // Header shows at bottom of inverted list (visually at top)
    if (messages.length === 0 && !loading) {
      return (
        <>
          {renderQuickPrompts()}
          {renderEmptyState()}
        </>
      );
    }
    // Show chips inline when there are messages
    return renderQuickPrompts();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading conversation...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header with marketplace link */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>AI Coach</Text>
        <TouchableOpacity onPress={navigateToMarketplace}>
          <Text style={[styles.headerLink, { color: theme.colors.primary }]}>Marketplace</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Thread */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.chatContent}
        ListHeaderComponent={isTyping ? <TypingIndicator /> : null}
        ListFooterComponent={renderHeader}
      />

      {/* Composer */}
      <View style={[styles.composer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message your coach..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim()
                ? theme.colors.primary
                : theme.colors.disabled,
            },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={[styles.sendButtonText, { color: theme.colors.textInverse }]}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    marginRight: 8,
    borderBottomRightRadius: 4,
  },
  coachBubble: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  coachIntroTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  coachIntroSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  marketplaceLink: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  marketplaceLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
