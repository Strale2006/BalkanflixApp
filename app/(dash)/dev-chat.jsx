import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { client, databases, appwriteConfig } from '../../lib/appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ID, Query } from 'react-native-appwrite';

const DevChat = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await databases.listDocuments(
        '6634ff8f0015b74e49fc',
        '677faa88003d48e77d9f'
      );
      setData(response.documents);
    } catch (error) {
      console.error('Appwrite Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <Text>Loading data...</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <View style={{ padding: 20, borderBottomWidth: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
              <Text>{item.description}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default DevChat;
