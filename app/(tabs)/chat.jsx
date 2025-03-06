import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert, KeyboardAvoidingView, Platform  } from 'react-native';
import { client, databases, appwriteConfig } from '../../lib/appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ID, Query } from 'react-native-appwrite';
import { useGlobalContext } from '../../context/GlobalProvider'; // Adjust path
import Icon from 'react-native-vector-icons/FontAwesome';

const Chat = () => {
  const { user, isLoading: isAuthLoading } = useGlobalContext();
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const messagesEndRef = useRef(null);
  const [shouldReconnect, setShouldReconnect] = useState(true);
  // Add a new state to track if user is manually scrolling
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  // Track if we should auto-scroll on new messages
  const [shouldAutoScrollToBottom, setShouldAutoScrollToBottom] = useState(true);

  const scrollToBottom = (force = false) => {
    // Only scroll to bottom if we're not currently user-scrolling or if force is true
    if ((shouldAutoScrollToBottom && !isUserScrolling) || force) {
      messagesEndRef.current?.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    getMessages();

    let unsubscribe;

    const connectRealtime = () => {
      unsubscribe = client.subscribe(
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.collectionId}.documents`,
        (response) => {
          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            setMessages((prevState) => {
              const newMessages = [...prevState, response.payload];
              // Auto-scroll only if the new message is from the current user
              // or if we're already at the bottom of the chat
              if (response.payload.userId === user?.$id) {
                // If it's our own message, always scroll to bottom
                setTimeout(() => scrollToBottom(true), 100);
              }
              return newMessages;
            });
          }
        },
        (error) => {
          console.error("Realtime subscription error:", error);
          if (shouldReconnect) {
            setTimeout(connectRealtime, 5000);
          }
        }
      );
    };

    connectRealtime();

    return () => {
      setShouldReconnect(false);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // When messages load initially, scroll to bottom
    useEffect(() => {
      if (messages.length > 0) {
        setTimeout(() => scrollToBottom(true), 300);
      }
    }, [messages.length === 0]);

  const getMessages = async () => {
    try {
      const res = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collectionId,
        [Query.orderAsc('$createdAt'), Query.limit(10000), Query.select(['$id', 'body', '$createdAt', 'username', 'pfp'])]
      );
      setMessages(res.documents);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleSubmit = async () => {
    if (cooldown || !messageBody.trim()) return;
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to send messages');
      return;
    }

    setCooldown(true);

    const payload = {
      body: messageBody,
      userId: user.$id,
      username: user.username,
      pfp: user.pfp
    };

    try {
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionId,
        ID.unique(),
        payload
      );
      setMessageBody('');
      // Set auto-scroll to true when sending a message
      setShouldAutoScrollToBottom(true);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }

    setTimeout(() => {
      setCooldown(false);
    }, 1000);
  };

  // Function to detect when the user has scrolled up
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    // If the user is near the bottom (within 20px), enable auto-scrolling
    const isNearBottom = contentHeight - layoutHeight - offsetY < 20;
    setShouldAutoScrollToBottom(isNearBottom);
  };

  // Functions to track when user starts and stops scrolling manually
  const handleScrollBeginDrag = () => {
    setIsUserScrolling(true);
  };

  const handleScrollEndDrag = () => {
    setIsUserScrolling(false);
  };

  // Add this new function to process message text and detect mentions
  const processMessageText = (text) => {
    if (!text) return null;
    
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} className="text-white">
            {text.slice(lastIndex, match.index)}
          </Text>
        );
      }

      // Add the mention with special styling
      parts.push(
        <Text key={`mention-${match.index}`} className="text-blue-400 font-pbold">
          {match[0]}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(
        <Text key={`text-${lastIndex}`} className="text-white">
          {text.slice(lastIndex)}
        </Text>
      );
    }

    return parts;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#151C2B]"
    >
      <SafeAreaView className="flex-1 bg-gray-900">
        <FlatList
          data={messages}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <View>
              <View className={`${item.username === user?.username ? 'self-end' : 'self-start'} flex-row items-center mb-1`}>
                <Image
                  source={{ uri: item.pfp }}
                  className="ml-2 w-8 h-8 rounded-full mr-2"
                />
                <Text className="text-lg text-white font-pbold mr-2">{item.username}</Text>
                <Text className="text-sm text-gray-300 font-psemibold mr-2">{formatTime(item.$createdAt)}</Text>
              </View>
              <View className={`p-3 ${
                item.username === user?.username ? 'self-end bg-blue-500' : 'self-start bg-[#22293E]'
              } rounded-3xl ml-2 mr-2 mt-1 mb-3`}>
                <Text className="text-white font-psemibold">
                  {processMessageText(item.body)}
                </Text>
              </View>
            </View>
          )}
          ref={messagesEndRef}
          onContentSizeChange={() => scrollToBottom()}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={() => setIsUserScrolling(false)}
          scrollEventThrottle={16}
        />
        <View className="flex-row items-center p-4 bg-[#101420]">
          <TextInput
            className="flex-1 bg-[#1b202f] text-white p-3 rounded-2xl font-psemibold"
            placeholder="Unesi poruku..."
            placeholderTextColor="#aaa"
            value={messageBody}
            onChangeText={setMessageBody}
          />
          <TouchableOpacity
            className="ml-4 bg-blue-500 p-3 rounded-full"
            onPress={handleSubmit}
            disabled={cooldown || !messageBody.trim()}
          >
            <Text className="text-white font-pbold"><Icon name="send" size={18} color="#E4E5E6" /></Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Chat;