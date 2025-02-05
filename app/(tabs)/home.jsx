import { View, Text, FlatList, ImageBackground, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import TopSlider from '../../components/HeroSlide';
import MovieList from '../../components/MovieList';
import GoogleButton from '../../components/GoogleButton';

const { width } = Dimensions.get('window');

const MainHome = () => {
  const navigation = useNavigation();
  const [topUsers, setTopUsers] = useState([]);
  const [newEpisodes, setNewEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);

  const fetchData = async () => {
    try {
      const [topUsersRes, episodesRes] = await Promise.all([
        axios.get("https://balkanflix-server.vercel.app/api/auth/getTopUsersByEpisodesWatchedFull"),
        axios.get('https://balkanflix-server.vercel.app/api/episode/newest')
      ]);

      setTopUsers(topUsersRes.data.topUsers.slice(0, 5));
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
    <View style={styles.episodeContainer}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Watch', { 
          titleParams: item.title_params,
          episode: item.ep 
        })}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.img}` }}
          style={styles.episodeCard}
          imageStyle={styles.episodeImage}
        >
          {item.partner && (
            <FontAwesome 
              name="handshake-o" 
              size={24} 
              color="#FFD700" 
              style={styles.partnerIcon} 
            />
          )}
          
          <View style={styles.episodeInfo}>
            <GoogleButton style={styles.watchButton}>
              <Text style={styles.watchButtonText}>GLEDAJ</Text>
            </GoogleButton>
            <Text style={styles.episodeNumber}>Epizoda {item.ep}</Text>
          </View>
        </ImageBackground>
        <Text style={styles.episodeTitle} numberOfLines={1}>{item.title}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[]}
        ListHeaderComponent={
          <View style={styles.content}>
            <TopSlider />
            
            {/* New Episodes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Najnovije Epizode</Text>
              </View>
              
              {loading ? (
                <FlatList
                  horizontal
                  data={[1, 2, 3, 4, 5]}
                  renderItem={() => (
                    <View style={styles.skeletonContainer}>
                      <ActivityIndicator size="large" color="#E50914" />
                    </View>
                  )}
                  contentContainerStyle={styles.episodeList}
                />
              ) : (
                <FlatList
                  horizontal
                  data={newEpisodes}
                  renderItem={renderNewEpisode}
                  contentContainerStyle={styles.episodeList}
                  showsHorizontalScrollIndicator={false}
                />
              )}
            </View>

            {/* Popular Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popularno</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Category', { category: 'popular' })}>
                  <Text style={styles.moreButton}>Više</Text>
                </TouchableOpacity>
              </View>
              <MovieList category="popular" />
            </View>

            {/* Schedule Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Raspored</Text>
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
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    paddingBottom: 20,
  },
  section: {
    marginVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  moreButton: {
    color: '#E50914',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  episodeContainer: {
    width: width * 0.35,
    marginHorizontal: 8,
  },
  episodeCard: {
    height: width * 0.5,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  episodeImage: {
    resizeMode: 'cover',
  },
  partnerIcon: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 5,
  },
  episodeInfo: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  watchButton: {
    backgroundColor: '#E50914',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  watchButtonText: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  episodeNumber: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'right',
  },
  episodeTitle: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    paddingHorizontal: 5,
    fontFamily: 'Poppins-SemiBold',
  },
  episodeList: {
    paddingLeft: 15,
  },
  skeletonContainer: {
    width: width * 0.35,
    height: width * 0.5,
    marginHorizontal: 8,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
};

export default MainHome;