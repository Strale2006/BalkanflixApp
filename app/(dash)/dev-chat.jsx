import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert, KeyboardAvoidingView, Platform  } from 'react-native';
import { client, databases, appwriteConfig } from '../../lib/appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ID, Query } from 'react-native-appwrite';
import { useGlobalContext } from '../../context/GlobalProvider'; // Adjust path


const DevChat = () => {
  const { user, isLoading: isAuthLoading } = useGlobalContext();
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const messagesEndRef = useRef(null);
  const [shouldReconnect, setShouldReconnect] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    getMessages();

    let unsubscribe;

    const connectRealtime = () => {
      unsubscribe = client.subscribe(
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.devCollectionId}.documents`,
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
    if (cooldown) return;
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
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  
    setTimeout(() => {
      setCooldown(false);
    }, 1000);
  };

  console.log(messages);
  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-primary"
    >
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
                item.username === user?.username ? 'self-end bg-blue-500' : 'self-start bg-gray-700'
              } rounded-md m-2`}
            >
              <View className="flex-row items-center justify-center text-center mb-1">
                <Image
                  source={{ uri: item.pfp }}
                  className="w-8 h-8 rounded-full mr-2"
                />
                <Text className="text-lg text-white font-pbold mr-2">{item.username}</Text>
                <Text className="text-sm text-gray-300 font-psemibold">{formatTime(item.$createdAt)}</Text>

              </View>
              <Text className="text-white font-pmedium">{item.body}</Text>
            </View>
          )}
          ref={messagesEndRef}
          onContentSizeChange={scrollToBottom}
        />
        <View className="flex-row items-center px-4 py-4 bg-gray-800">
          <TextInput
            className="flex-1 bg-gray-700 text-white p-3 rounded-md"
            placeholder="Enter your message..."
            placeholderTextColor="#aaa"
            value={messageBody}
            onChangeText={setMessageBody}
          />
          <TouchableOpacity
            className="ml-4 bg-blue-500 p-3 rounded-full"
            onPress={handleSubmit}
          >
            <Text className="text-white font-pbold">Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default DevChat;
