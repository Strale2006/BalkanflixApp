import {
  View,
  Text,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import TopSlider from '../../components/HeroSlide';
import MovieList from '../../components/MovieList';
// import CustomButton from '../../components/CustomButton';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const MainHome = () => {
  const [topUsers, setTopUsers] = useState([]);
  const [newEpisodes, setNewEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);

  const fetchData = async () => {
    try {
      const topUsersRes = await axios.get(
        'https://balkanflix-server.vercel.app/api/auth/getTopUsersByEpisodesWatchedFull'
      );
      setTopUsers(topUsersRes.data.topUsers.slice(0, 5));

      const episodesRes = await axios.get('https://balkanflix-server.vercel.app/api/episode/newest');
      setNewEpisodes(episodesRes.data);

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

    const renderNewEpisode = ({ item }) => (
      <View
        className="mx-2"
        style={{ width: width * 0.31 }} // dynamic width
      >
        <TouchableOpacity
          onPress={() => {
            router.push(`/details/${encodeURIComponent(item.title_params)}`);
          }}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={{
              uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.img}`,
            }}
            className="rounded-lg overflow-hidden justify-end"
            style={{ height: width * 0.45 }}
            imageStyle={{ resizeMode: 'cover' }}
          >
            {item.partner && (
              <FontAwesome
                name="handshake-o"
                size={24}
                color="#FFD700"
                className="absolute top-2 left-2 bg-black bg-opacity-70 rounded-full p-1"
              />
            )}

            <View className="p-2">
              <Text className="text-white text-xs text-right font-psemibold bg-red-600/90 px-2 py-1 rounded-md min-w-20 max-w-24 self-end">
                Epizoda {item.ep}
              </Text>
            </View>
          </ImageBackground>
          <Text
            className="text-white text-sm mt-2 px-1 font-psemibold"
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <SafeAreaView className="flex-1 bg-[#101420]">
        <FlatList
          data={[]}
          ListHeaderComponent={
            <View className="pb-5">
              <TopSlider />

              {/* New Episodes Section */}
              <View className="my-4">
                <View className="flex-row justify-between items-center px-4 mb-2">
                  <Text className="text-white text-xl font-pbold">
                    Najnovije Epizode
                  </Text>
                </View>

                {loading ? (
                  <FlatList
                    horizontal
                    data={[1, 2, 3, 4, 5]}
                    renderItem={() => (
                      <View
                        className="mx-2 justify-center items-center rounded-lg bg-[#1a1a1a]"
                        style={{
                          width: width * 0.35,
                          height: width * 0.5,
                        }}
                      >
                        <ActivityIndicator size="large" color="#E50914" />
                      </View>
                    )}
                    contentContainerStyle={{ paddingLeft: 15 }}
                  />
                ) : (
                  <FlatList
                    horizontal
                    data={newEpisodes}
                    renderItem={renderNewEpisode}
                    contentContainerStyle={{ paddingLeft: 15 }}
                    showsHorizontalScrollIndicator={false}
                  />
                )}
              </View>

              {/* Popular Section */}
              <View className="my-4">
                <View className="flex-row justify-between items-center px-4 mb-2">
                  <Text className="text-white text-xl font-pbold">Popularno</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('Category', { category: 'popular' })
                    }
                  >
                    <Text className="text-[#E50914] text-base font-pbold flex items-center text-center justify-center">
                      Više
                    </Text>
                  </TouchableOpacity>
                </View>
                <MovieList type="popular" />
              </View>

              {/* Schedule Section */}
              <View className="my-4 px-4">
                <Text className="text-white text-xl font-pbold">Raspored</Text>
                {/* Add schedule component here */}
              </View>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#E50914"
            />
          }
          keyExtractor={(item, index) => index.toString()}
        />
              <StatusBar style='light' />
        
      </SafeAreaView>
    );
  };

export default MainHome;