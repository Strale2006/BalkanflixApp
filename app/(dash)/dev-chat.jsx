import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { client, databases, appwriteConfig } from '../../lib/appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ID, Query } from 'react-native-appwrite';

const DevChat = () => {
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const messagesEndRef = useRef(null);
  const [shouldReconnect, setShouldReconnect] = useState(true);

  const username = "User"; // Replace with secure user state management (e.g., AsyncStorage or Appwrite auth)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    getMessages();

    let unsubscribe;

    const connectRealtime = () => {
      unsubscribe = client.subscribe(
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.collectionId}.documents`,
        (response) => {
          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            setMessages((prevState) => [...prevState, response.payload]);
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

  const getMessages = async () => {
    try {
      const res = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collectionId,
        [Query.orderAsc('$createdAt'), Query.limit(10000)]
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
    if (cooldown) return;

    setCooldown(true);

    const payload = {
      body: messageBody,
      username: username,
      pfp: 'https://example.com/avatar.png', // Replace with user-specific avatar URL
    };

    try {
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionId,
        ID.unique(),
        payload
      );
      setMessageBody('');
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setTimeout(() => {
      setCooldown(false);
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="p-4 bg-gray-800">
        <Text className="text-xl text-white font-psemibold">Chat</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View
            className={`p-4 ${
              item.username === username ? 'self-end bg-blue-500' : 'self-start bg-gray-700'
            } rounded-md m-2`}
          >
            <View className="flex-row items-center mb-1">
              <Image source={{ uri: item.pfp }} className="w-8 h-8 rounded-full mr-2" />
              <Text className="text-sm text-white font-bold">{item.username}</Text>
              <Text className="text-xs text-gray-300 ml-2">{formatTime(item.$createdAt)}</Text>
            </View>
            <Text className="text-white">{item.body}</Text>
          </View>
        )}
        ref={messagesEndRef}
        onContentSizeChange={scrollToBottom}
      />
      <View className="flex-row items-center px-4 bg-gray-800">
        <TextInput
          className="flex-1 bg-gray-700 text-white p-2 rounded-md"
          placeholder="Enter your message..."
          placeholderTextColor="#aaa"
          value={messageBody}
          onChangeText={setMessageBody}
        />
        <TouchableOpacity
          className="ml-4 bg-blue-500 p-3 rounded-full"
          onPress={handleSubmit}
          disabled={cooldown}
        >
          <Text className="text-white font-pbold">Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DevChat;
