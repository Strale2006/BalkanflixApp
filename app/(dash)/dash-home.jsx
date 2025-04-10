import { View, Text, ScrollView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { schedulePushNotification } from '../../notifications/PushNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DashHome = () => {
  const [users, setUsers] = useState(null);
  const [series, setSeries] = useState(null);
  const [viewsToday, setViewsToday] = useState(null);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const usersResponse = await axios.get('https://balkanflix-server.up.railway.app/api/auth/countAllUsers');
        setUsers(usersResponse.data.totalUsers);
        setSeries(usersResponse.data.totalSeries);

        const viewsTodayResponse = await axios.get('https://filemoonapi.com/api/account/stats?key=46529qdxsb1y65ki1juu9&last=30');
        setViewsToday(viewsTodayResponse.data.result[viewsTodayResponse.data.result.length - 1].views);
        setTotalViews(viewsTodayResponse.data.result.slice(30).reduce((acc, item) => acc + item.views, 0));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const testNotification = async () => {
    try {
      await schedulePushNotification(
        "Test Notifikacija",
        "Ovo je test notifikacija iz dashboard-a!",
        { url: '/home' }
      );
      console.log('Test notification sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const showPushToken = async () => {
    try {
      const token = await AsyncStorage.getItem('pushToken');
      if (token) {
        console.log('Current push token:', token);
        Alert.alert(
          'Push Token',
          `Current token: ${token}\n\nMake sure this token starts with "ExponentPushToken[" or "ExpoPushToken[" to work with Expo's push service.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('No Token', 'No push token found in storage');
      }
    } catch (error) {
      console.error('Error getting push token:', error);
      Alert.alert('Error', 'Failed to get push token');
    }
  };

  return (
    <SafeAreaView className="bg-gray-900 h-full">
      <ScrollView className="bg-gray-900 h-full p-6">
        <Text className="text-white text-2xl font-pbold mb-6">Dashboard</Text>

        <View className="bg-gray-800 p-4 rounded-xl mb-4">
          <Text className="text-gray-400 font-psemibold">Ukupno korisnika</Text>
          <Text className="text-white text-3xl font-pbold">{users !== null ? users : 'Loading...'}</Text>
          <TouchableOpacity onPress={() => router.push('/dashboard/users')}>
            <Text className="text-blue-400 mt-2 font-psemibold">Vidi više</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-gray-800 p-4 rounded-xl mb-4">
          <Text className="text-gray-400 font-psemibold">Ukupno serijala</Text>
          <Text className="text-white text-3xl font-pbold">{series !== null ? series : 'Loading...'}</Text>
          <TouchableOpacity onPress={() => router.push('/dashboard/series')}>
            <Text className="text-blue-400 mt-2 font-psemibold">Vidi više</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-gray-800 p-4 rounded-xl mb-4">
          <Text className="text-gray-400 font-psemibold">Pregleda Danas / Mesec</Text>
          <Text className="text-white text-3xl font-pbold">{viewsToday !== null && totalViews !== null ? `${viewsToday} / ${totalViews}` : 'Loading...'}</Text>
          <TouchableOpacity onPress={() => router.push('https://filemoon.sx/reports')}>
            <Text className="text-blue-400 mt-2 font-psemibold">Vidi više</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-4 mb-4">
          <TouchableOpacity 
            onPress={testNotification}
            className="flex-1 bg-indigo-600 p-4 rounded-xl"
          >
            <Text className="text-white text-center font-psemibold">Test Notifikacije</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={showPushToken}
            className="flex-1 bg-gray-700 p-4 rounded-xl"
          >
            <Text className="text-white text-center font-psemibold">Show Push Token</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default DashHome;