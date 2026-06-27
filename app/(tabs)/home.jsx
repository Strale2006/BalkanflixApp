import {
  View,
  Text,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Alert,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import TopSlider from '../../components/HeroSlide';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Schedule from './../schedule/schedule';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
const { width } = Dimensions.get('window');

// grid podesavanja za "Najnovije Epizode"
const COLUMNS = 2;
const ROWS = 4;
const PAGE_SIZE = COLUMNS * ROWS; // 8 po strani
const H_PADDING = 15;
const CARD_WIDTH = width * 0.4;            // malo uvecano (bilo 0.34)
const H_GAP = 28;
const IMAGE_HEIGHT = CARD_WIDTH * 1.45;
const ROW_GAP = 18;

const MainHome = () => {

    const BANNER_ID = __DEV__
        ? TestIds.BANNER
        : 'ca-app-pub-5998257044328183/7987732426';

  const [topUsers, setTopUsers] = useState([]);
  const [newEpisodes, setNewEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);

  const [episodePage, setEpisodePage] = useState(0);
  const [episodePageReady, setEpisodePageReady] = useState(true);

  const fetchData = async () => {
    try {
      const [topUsersRes, episodesRes] = await Promise.all([
        axios.get('https://balkanflix-server.up.railway.app/api/auth/getTopUsersByEpisodesWatchedFull'),
        axios.get('https://balkanflix-server.up.railway.app/api/episode/newest')
      ]);

      setTopUsers((topUsersRes.data?.topUsers || []).slice(0, 5));
      setNewEpisodes(Array.isArray(episodesRes.data) ? episodesRes.data.map(episode => ({
        ...episode,
        title_params: episode.title_params || episode.title?.replace(/\s+/g, '')
      })) : []);
      setEpisodePage(0);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response) {
        console.error('Error Response:', error.response.data);
      }
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

  const totalEpisodePages = Math.max(1, Math.ceil(newEpisodes.length / PAGE_SIZE));

  const pageEpisodes = useMemo(
      () => newEpisodes.slice(episodePage * PAGE_SIZE, episodePage * PAGE_SIZE + PAGE_SIZE),
      [newEpisodes, episodePage]
  );

  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(0, episodePage - 2);
    let end = Math.min(totalEpisodePages, start + windowSize);
    start = Math.max(0, end - windowSize);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [episodePage, totalEpisodePages]);

  const goToEpisodePage = useCallback((next) => {
    if (next < 0 || next > totalEpisodePages - 1 || next === episodePage) return;
    setEpisodePage(next);
    setEpisodePageReady(false);
    InteractionManager.runAfterInteractions(() => {
      setEpisodePageReady(true);
    });
  }, [episodePage, totalEpisodePages]);

  const showEpisodeSkeletons = loading || !episodePageReady;
  const displayEpisodes = showEpisodeSkeletons ? Array.from({ length: PAGE_SIZE }) : pageEpisodes;

  const renderEpisodeCard = (item) => {
    if (!item || !item.title_params) {
      return (
          <View
              className="justify-center items-center rounded-2xl bg-[#0d1430]"
              style={{ width: CARD_WIDTH, height: IMAGE_HEIGHT }}
          >
            <ActivityIndicator size="small" color="#D7F7F4" />
          </View>
      );
    }

    return (
        <TouchableOpacity
            onPress={() => {
              router.push(`/${encodeURIComponent(item.title_params)}/${item.ep}`);
            }}
            activeOpacity={0.85}
            style={{ width: CARD_WIDTH }}
        >
          <View
              style={{
                width: CARD_WIDTH,
                height: IMAGE_HEIGHT,
                borderRadius: 14,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 6 },
                shadowRadius: 10,
                elevation: 6,
              }}
          >
            <ImageBackground
                source={{ uri: `https://images.balkanflix.com/${item.img}` }}
                style={{ flex: 1, justifyContent: 'flex-end' }}
                imageStyle={{ resizeMode: 'cover' }}
            >
              <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  locations={[0.45, 1]}
                  style={{ flex: 1, justifyContent: 'space-between', padding: 8 }}
              >
                {item.partner ? (
                    <FontAwesome
                        name="handshake-o"
                        size={16}
                        color="#FFD700"
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: 'rgba(0,0,0,0.55)',
                          borderRadius: 20,
                          padding: 5,
                        }}
                    />
                ) : (
                    <View />
                )}

                <View
                    className="bg-red-600 self-end px-2 py-1 rounded-md flex-row items-center"
                    style={{
                      shadowColor: '#dc2626',
                      shadowOpacity: 0.5,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                >
                  <MaterialIcons name="play-arrow" size={11} color="white" />
                  <Text className="text-white text-[10px] font-pbold ml-0.5">
                    EP {item.ep}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>

          <Text
              className="text-white text-[13px] mt-2 px-0.5 font-psemibold leading-[16px]"
              numberOfLines={2}
              style={{ width: CARD_WIDTH }}
          >
            {item.title}
          </Text>
        </TouchableOpacity>
    );
  };

  const episodeRows = [];
  for (let i = 0; i < displayEpisodes.length; i += COLUMNS) {
    episodeRows.push(displayEpisodes.slice(i, i + COLUMNS));
  }

  return (
      <SafeAreaView className="flex-1 bg-[#101420]">
        <FlatList
            data={[1]}
            renderItem={() => null}
            ListHeaderComponent={
              <View className="pb-5">
                <TopSlider />
                  {/* AdMob Banner */}
                  <View style={{ alignItems: 'center', marginVertical: 8 }}>
                      <BannerAd
                          unitId={BANNER_ID}
                          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                          onAdFailedToLoad={(error) => console.log('Banner greška:', error)}
                      />
                  </View>
                {/* New Episodes Section */}
                <View className="my-4">
                  <View className="flex-row items-center px-4 mb-4">
                    <View
                        style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: '#E50914', marginRight: 8 }}
                    />
                    <Text className="text-white text-xl font-pbold">
                      Najnovije Epizode
                    </Text>
                  </View>

                  <View style={{ paddingHorizontal: H_PADDING }}>
                    {episodeRows.map((row, rowIndex) => (
                        <View
                            key={rowIndex}
                            className="flex-row justify-center"
                            style={{ marginBottom: ROW_GAP, gap: H_GAP }}
                        >
                          {row.map((item, colIndex) => (
                              <View key={`${episodePage}-${rowIndex}-${colIndex}`}>
                                {renderEpisodeCard(item)}
                              </View>
                          ))}
                        </View>
                    ))}

                    {!loading && newEpisodes.length === 0 && (
                        <View className="items-center py-6">
                          <MaterialIcons name="movie-filter" size={26} color="#555" />
                          <Text className="text-gray-500 text-sm mt-2">Nema novih epizoda</Text>
                        </View>
                    )}
                  </View>

                  {!loading && totalEpisodePages > 1 && (
                      <View className="flex-row items-center justify-center mt-3" style={{ gap: 6 }}>
                        <TouchableOpacity
                            onPress={() => goToEpisodePage(episodePage - 1)}
                            disabled={episodePage === 0}
                            className="w-9 h-9 rounded-full items-center justify-center"
                            style={{ opacity: episodePage === 0 ? 0.3 : 1, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        >
                          <FontAwesome name="chevron-left" size={14} color="white" />
                        </TouchableOpacity>

                        {pageNumbers[0] > 0 && <Text className="text-gray-500 text-xs">…</Text>}

                        {pageNumbers.map((p) => (
                            <TouchableOpacity
                                key={p}
                                onPress={() => goToEpisodePage(p)}
                                className="w-9 h-9 rounded-full items-center justify-center"
                                style={{ backgroundColor: p === episodePage ? '#E50914' : 'rgba(255,255,255,0.08)' }}
                            >
                              <Text className={`text-xs font-psemibold ${p === episodePage ? 'text-white' : 'text-gray-300'}`}>
                                {p + 1}
                              </Text>
                            </TouchableOpacity>
                        ))}

                        {pageNumbers[pageNumbers.length - 1] < totalEpisodePages - 1 && (
                            <Text className="text-gray-500 text-xs">…</Text>
                        )}

                        <TouchableOpacity
                            onPress={() => goToEpisodePage(episodePage + 1)}
                            disabled={episodePage === totalEpisodePages - 1}
                            className="w-9 h-9 rounded-full items-center justify-center"
                            style={{ opacity: episodePage === totalEpisodePages - 1 ? 0.3 : 1, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        >
                          <FontAwesome name="chevron-right" size={14} color="white" />
                        </TouchableOpacity>
                      </View>
                  )}
                </View>

                {/* Schedule Section */}
                <View className="my-4 px-4">
                  <Text className="text-white text-xl font-pbold">Raspored</Text>
                  <Schedule />
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