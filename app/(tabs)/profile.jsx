import { View, Text, Image, TouchableOpacity, Dimensions, FlatList } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from './../../context/GlobalProvider';
import { Link, router, useFocusEffect } from "expo-router";
// import { logoutUser } from '../../lib/apiControllers';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import InfoBox from './../../components/InfoBox';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

const Profile = () => {
  const { user, logout, setUser } = useGlobalContext();
  const [animeCards, setAnimeCards] = useState([]);

  // console.log(user.favorites);
  
  const dashboard = () => router.push('/dash-home');

  // Refresh user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshUserData = async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (!token) return;

          const config = {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          };

          const { data } = await axios.get("https://balkanflix-server.vercel.app/api/private", config);
          setUser(data);
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      };

      refreshUserData();
    }, [])
  );

  // Fetch anime cards
  useEffect(() => {
    const fetchAnimeCards = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.error("No token found");
          return;
        }

        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const { data } = await axios.get('https://balkanflix-server.vercel.app/api/auth/getProfileCards', config);
        setAnimeCards(data.animeCards);
      } catch (error) {
        console.error("Error fetching anime cards:", error);
      }
    };

    fetchAnimeCards();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderProfileHeader = () => (
    <View>
      {/* Banner Section */}
      <View className="w-full h-40 relative mb-8 border-b-2 border-gray-800">
        <Image 
          source={{ uri: user?.banner }} 
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute left-6 bottom-[-40px] rounded-full border-2 border-gray-800 bg-gray-900 p-1">
          <Image 
            source={{ uri: user?.pfp }} 
            className="w-24 h-24 rounded-full"
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Profile Info Section */}
      <View className="mt-4 px-6 items-center">
        <Text className="text-3xl font-extrabold text-white">{user?.username}</Text>
        <Text className="text-lg text-gray-400 mb-4">{user?.email}</Text>

        {/* Badges Row */}
        <View className="flex-row flex-wrap justify-center gap-2 mt-2 mb-10">
          {user?.isVerified && (
            <View className="flex-row items-center bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text className="ml-1.5 text-sm text-emerald-400 font-semibold">
                Verifikovan
              </Text>
            </View>
          )}

          {user?.isAdmin && (
            <View className="flex-row items-center bg-indigo-500/10 px-3 py-1.5 rounded-full">
              <MaterialCommunityIcons name="crown" size={14} color="#818cf8" />
              <Text className="ml-1.5 text-sm text-indigo-400 font-semibold">
                Admin
              </Text>
            </View>
          )}

          {user?.isTranslator && (
            <View className="flex-row items-center bg-rose-500/10 px-3 py-1.5 rounded-full">
              <MaterialIcons name="translate" size={14} color="#fb7185" />
              <Text className="ml-1.5 text-sm text-rose-400 font-semibold">
                Prevodilac
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-center w-full mb-6 px-4 gap-4">
          <TouchableOpacity activeOpacity={0.5} className="bg-gray-800 px-6 py-3 rounded-full border border-gray-700">
            <Link href="/profileModal" className="text-white text-lg font-psemibold">Izmenite Profil</Link>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogout}
            className="p-4 rounded-full bg-gray-800 border border-gray-700"
          >
            <MaterialIcons name="logout" size={20} color="#e5e7eb" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View className="w-full flex-row justify-around gap-4 mb-4 mt-2">
          <InfoBox title={user?.full_ep?.length || 0} subtitle="Odgledanih Epizoda" titleStyles={"text-lg"} />
          {user?.isTranslator && <InfoBox title={user?.brojPrevoda || 0} subtitle="Prevedeno Epizoda" titleStyles={"text-lg"} />}
        </View>

        {user?.isTranslator && (
          <TouchableOpacity onPress={dashboard} className="bg-blue-600 px-6 py-3 mb-5 rounded-full border border-blue-400">
            <Text className="text-white text-lg font-psemibold">Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFavoritesSection = () => (
    <View className="px-6 mb-8">
      <Text className="text-xl font-pbold text-white mb-4">Omiljeno</Text>
      {animeCards.length > 0 ? (
        <FlatList
          data={animeCards}
          numColumns={2}
          keyExtractor={(item, index) => index.toString()}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              className="bg-gray-800 rounded-lg border border-gray-700 mb-4"
              onPress={() => router.push(`/details/${item.title_params}`)}
              activeOpacity={0.7}
              style={{
                width: width * 0.38,
              }}
            >
              <Image 
                source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.img}` }}
                style={{ width: '100%', height: width * 0.6, borderRadius: 8 }}
                resizeMode="cover"
              />
              <Text numberOfLines={2} className="text-white text-sm font-pmedium text-center" style={{ padding: 5 }}>{item.title}</Text>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      ) : (
        <View className="w-full py-4 bg-gray-800 rounded-lg border border-gray-700">
          <Text className="text-center text-gray-400">Nema omiljenih stavki</Text>
        </View>
      )}
    </View>
  );

  return (
    // <SafeAreaView className="flex-1 bg-[#0B0F19]">
      <View className="flex-1 bg-[#0B0F19]">
        <FlatList
          data={[{ key: 'profile' }]}
          renderItem={() => (
            <View>
              {renderProfileHeader()}
              {renderFavoritesSection()}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </View>
    // </SafeAreaView>
  );
};

export default Profile;
