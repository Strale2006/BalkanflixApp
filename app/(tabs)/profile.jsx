import { View, Text, Image, TouchableOpacity, FlatList, ScrollView  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from './../../context/GlobalProvider';
import { icons } from '../../constants';
import InfoBox from './../../components/InfoBox';
import { router } from "expo-router";
import { logoutUser } from '../../lib/appwrite'; // Import your logout function

const Profile = () => {
  const { user, setUser, setIsLoggedIn } = useGlobalContext();
  const totalEpisodesWatched = user?.full_ep.length;

  const isTranslator = true;


  const logout = async () => {
    try {
      // Log out the user
      await logoutUser(); // Clears the token and user session

      // Reset context values
      setIsLoggedIn(false);
      setUser(null);

      // Redirect to the login page
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="flex-1">
        {/* Banner Image */}
        <View className="w-full h-40 relative mb-8">
          <Image
            source={{ uri: user?.banner }}
            resizeMode="cover"
            className="w-full h-full rounded-xl"
          />
          {/* Profile Picture */}
          <View className="absolute left-4 bottom-[-30px]">
            <Image
              source={{ uri: user?.pfp }}
              resizeMode="contain"
              className="w-24 h-24 rounded-full border-4 border-secondary"
            />
          </View>
        </View>

        {/* User Info Section */}
        <View className="px-6">
          <Text className="text-3xl font-bold text-white">{user?.username}</Text>
          <Text className="text-lg text-gray-400">{user?.email}</Text>

          {user?.isVerified && (
            <Text className="mt-2 text-sm text-green-500">Verifikovan Korisnik</Text>
          )}

          {/* Admin Badge */}
          {user?.isAdmin && (
            <Text className="mt-1 text-sm text-blue-500 font-semibold">Admin👑</Text>
          )}

          {isTranslator && (
            <Text className="mt-1 text-sm text-red-500 font-semibold">Prevodilac📝</Text>
          )}

          <View className="w-full flex">
              
          {/* Episodes Watched Stats */}
          <View className="flex-row mt-6 justify-between">
            <InfoBox
              title={totalEpisodesWatched}
              subtitle="Odgledanih Epizoda"
              containerStyles=" p-3 border border-red-500 rounded-lg"
              titleStyles="text-xl font-semibold"
              subtitleStyles="text-gray-400"
            />

          {isTranslator && (
            <InfoBox
              title="50"
              subtitle="Prevedeno Epizoda"
              containerStyles=" p-3 border border-red-500 rounded-lg"
              titleStyles="text-xl font-semibold"
              subtitleStyles="text-gray-400"
            />
          )}
          </View>

          
          </View>


          {/* Favorites Section */}
          <View className="mt-6">
            <Text className="text-xl font-bold text-white">Omiljeno</Text>
            <View className="mt-4 flex-row flex-wrap">
              {user?.favorites?.map((title, index) => (
                <View key={index} className="bg-secondary rounded-lg p-2 mx-2 mb-2">
                  <Text className="text-white text-sm">{title}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;