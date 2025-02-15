import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DashHome = () => {
  const [users, setUsers] = useState(null);
    const [series, setSeries] = useState(null);
    const [viewsToday, setViewsToday] = useState(null);
    const [totalViews, setTotalViews] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const usersResponse = await axios.get('https://balkanflix-server.vercel.app/api/auth/countAllUsers');
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
        </ScrollView>
      </SafeAreaView>
    );
}

export default DashHome