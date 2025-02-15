import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from './../../context/GlobalProvider';
import { router } from "expo-router";
import { logoutUser } from '../../lib/apiControllers';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import InfoBox from './../../components/InfoBox';

const Profile = () => {
  const { user, setUser, setIsLoggedIn } = useGlobalContext();

  const dashboard = () => router.push('/dash-home');

  const logout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      setUser(null);
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F19]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
          <View className="flex-row justify-around w-full mb-6 px-4">
            {user?.isTranslator && (
              <TouchableOpacity onPress={dashboard} className="bg-blue-600 px-6 py-3 rounded-full border border-blue-400">
                <Text className="text-white text-lg font-psemibold">Dashboard</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              onPress={logout}
              className="p-4 rounded-full bg-gray-800 border border-gray-700"
            >
              <MaterialIcons name="logout" size={20} color="#e5e7eb" />
            </TouchableOpacity>
          </View>

          {/* Stats Section */}
          <View className="w-full flex-row justify-around gap-4 mb-4 mt-2">
            <InfoBox title={user?.full_ep?.length || 0} subtitle="Odgledanih Epizoda" />
            {user?.isTranslator && <InfoBox title={user?.brojPrevoda || 0} subtitle="Prevedeno Epizoda" />}
          </View>

          {/* Favorites Section */}
          <View className="mb-8 flex justify-start items-start w-full">
            <Text className="text-xl font-pbold text-white mb-4">Omiljeno</Text>
            <View className="flex-row flex-wrap gap-2">
              {user?.favorites?.length > 0 ? (
                user.favorites.map((title, index) => (
                  <View 
                    key={index}
                    className="px-3 py-2 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <Text className="text-white text-sm font-pmedium">{title}</Text>
                  </View>
                ))
              ) : (
                <View className="w-full py-4 bg-gray-800 rounded-lg border border-gray-700">
                  <Text className="text-center text-gray-400">Nema omiljenih stavki</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
