import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import { VideoView, useVideoPlayer } from 'expo-video';   // <-- novi import
import BalkanflixPlayer from "../../components/BalkanflixPlayer"


// ---------- Glavna komponenta ----------
const Episode = () => {
  const { token, user } = useGlobalContext();
  const { ep, title } = useLocalSearchParams();

  const [seriesData, setSeriesData] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [inputEpisode, setInputEpisode] = useState('');

  // Server / source state
  const [selectedServer, setSelectedServer] = useState('Balkanflix');
  const [availableServers, setAvailableServers] = useState([]);
  const [episodeSrc, setEpisodeSrc] = useState('');       // Filemoon id
  const [episodeBf, setEpisodeBf] = useState('');         // Balkanflix filename
  const [intro, setIntro] = useState(null);               // intro { start, end }

  const startTime = useRef(new Date());

  // ---- Snimanje odgledane epizode ----
  const recordEpisodeWatch = async (episodeNumber, seriesTitle) => {
    if (!token) return;
    const config = {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    };
    try {
      await axios.post(
          'https://balkanflix-server.up.railway.app/api/auth/watchedEpisode',
          { user: user.username, seriesTitle, episodeNumber },
          config
      );
    } catch (error) {
      console.error('Error recording episode watch:', error);
    }
  };

  const recordEpisodeWatchFull = async (episodeNumber, seriesTitle, start, end) => {
    if (!token) return;
    const config = {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    };
    try {
      await axios.post(
          'https://balkanflix-server.up.railway.app/api/auth/watchedEpisodeFull',
          { user: user.username, seriesTitle, episodeNumber, startTime: start, endTime: end },
          config
      );
    } catch (error) {
      console.error('Error recording full watch:', error);
    }
  };

  // ---- BB view tracking (za Balkanflix server) ----
  const handleBBView = async () => {
    try {
      await axios.post('https://balkanflix-server.up.railway.app/api/episode/addBBView', {
        title_params: title,
        episodeNumber: ep,
      });
      console.log('BB view counted');
    } catch (err) {
      console.error('BB view error:', err);
    }
  };

  // ---- Fetch serije ----
  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        const { data } = await axios.get(`https://balkanflix-server.up.railway.app/api/content/series/${title}`);
        setSeriesData(data.series);
      } catch (error) {
        console.error('Error fetching series data:', error);
      }
    };
    fetchSeriesData();
  }, [title]);

  // ---- Fetch epizoda i setovanje servera ----
  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        const { data } = await axios.get(
            `https://balkanflix-server.up.railway.app/api/episode/episodesInfo/${title}`
        );
        const series = data.data;
        if (!series) return;

        const foundEp = series.episodes.find((e) => e.ep.toString() === ep);
        if (!foundEp) return;

        // Postavi epizode
        setEpisodes(series.episodes || []);

        // Filemoon src
        const fmSrc = foundEp.src ? `https://filemoon.to/e/${foundEp.src}` : '';
        setEpisodeSrc(fmSrc);

        // Balkanflix src (bb)
        const bfSrc = foundEp.bb || '';
        setEpisodeBf(bfSrc);

        // Intro
        setIntro(foundEp.intro || null);

        // Ažuriraj preglede
        await axios.patch(
            `https://balkanflix-server.up.railway.app/api/episode/episodeViews/${series.title_params}/${foundEp.ep}`
        );

        // Snimi odgledanu epizodu
        await recordEpisodeWatch(foundEp.ep, title);

      } catch (error) {
        console.error('Error fetching episode data:', error);
      }
    };

    fetchEpisodeData();
  }, [title, ep]);

  // ---- Ažuriranje dostupnih servera i auto-selekcija ----
  useEffect(() => {
    const servers = [];
    if (episodeBf) {
      servers.push({ id: 'Balkanflix', name: 'Balkanflix' });
    }
    if (episodeSrc) {
      servers.push({ id: 'Filemoon', name: 'Filemoon' });
    }
    setAvailableServers(servers);

    // Ako trenutno odabrani server nije dostupan, prebaci na prvi dostupni
    if (servers.length > 0 && !servers.find((s) => s.id === selectedServer)) {
      setSelectedServer(servers[0].id);
    }
  }, [episodeSrc, episodeBf, selectedServer]);

  // ---- Snimanje kompletnog gledanja pri unmountu ----
  useEffect(() => {
    return () => {
      const endTime = new Date();
      recordEpisodeWatchFull(ep, title, startTime.current, endTime);
    };
  }, [ep, title]);

  // ---- Navigacija na epizodu ----
  const handleGoToEpisode = () => {
    const episodeNumber = parseInt(inputEpisode);
    if (episodeNumber > 0 && episodeNumber <= episodes.length) {
      router.push(`/${encodeURIComponent(seriesData?.title_params)}/${episodeNumber}`);
    } else {
      Alert.alert('Neispravan broj epizode');
    }
  };

  // ---- Video source za odabrani server ----
  const currentVideoUrl =
      selectedServer === 'Balkanflix'
          ? `https://server.balkanflix.com/file/Balkanflix/${episodeBf}`
          : episodeSrc;

  return (
      <SafeAreaView className="bg-gray-950 flex-1">
        <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 48 : 24 }}
        >
          {/* Header */}
          <View className="mb-4 mt-6">
            <Link href={`/details/${seriesData?.title_params}`} asChild>
              <TouchableOpacity>
                <Text className="text-2xl font-pbold text-gray-100 mb-1">
                  {seriesData?.title}
                </Text>
                <Text className="text-lg font-pmedium text-blue-400">
                  Epizoda {ep}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Video Player */}
          <View className="mb-6">
            <View className="aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
              {currentVideoUrl ? (
                  selectedServer === 'Balkanflix' ? (
                      <BalkanflixPlayer
                          url={currentVideoUrl}
                          intro={intro}
                          onValidView={handleBBView}
                      />
                  ) : (
                      <WebView
                          allowsFullscreenVideo
                          source={{ uri: currentVideoUrl }}
                          className="flex-1 bg-gray-900"
                      />
                  )
              ) : (
                  <View className="flex-1 justify-center items-center bg-gray-900">
                    <Text className="text-gray-500 font-pmedium">Video nije dostupan</Text>
                  </View>
              )}
            </View>
          </View>

          {/* Server Selection */}
          {availableServers.length > 1 && (
              <View className="flex-row gap-3 mb-6">
                {availableServers.map((server) => (
                    <TouchableOpacity
                        key={server.id}
                        className={`flex-1 py-3 rounded-xl ${
                            selectedServer === server.id
                                ? 'bg-blue-600 border border-blue-400'
                                : 'bg-gray-900 border border-gray-800'
                        }`}
                        onPress={() => setSelectedServer(server.id)}
                    >
                      <Text className="text-center font-psemibold text-blue-400">
                        {server.name}
                      </Text>
                    </TouchableOpacity>
                ))}
              </View>
          )}

          {/* Navigacija epizoda */}
          <View className="mb-6">
            <View className="flex-row justify-between gap-4 mb-4">
              <TouchableOpacity
                  className={`flex-row items-center flex-1 justify-center py-3 rounded-xl ${
                      parseInt(ep) > 1
                          ? 'bg-blue-600 active:bg-blue-700'
                          : 'bg-gray-900 border border-gray-800 opacity-60'
                  }`}
                  disabled={parseInt(ep) <= 1}
                  onPress={() =>
                      router.push(`/${encodeURIComponent(seriesData?.title_params)}/${parseInt(ep) - 1}`)
                  }
              >
                <FontAwesome5 name="step-backward" size={24} color="#93c5fd" />
                <Text className="text-blue-100 font-psemibold"> Prethodno</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  className={`flex-row items-center flex-1 justify-center py-3 rounded-xl ${
                      parseInt(ep) < episodes.length
                          ? 'bg-blue-600 active:bg-blue-700'
                          : 'bg-gray-900 border border-gray-800 opacity-60'
                  }`}
                  disabled={parseInt(ep) >= episodes.length}
                  onPress={() =>
                      router.push(`/${encodeURIComponent(seriesData?.title_params)}/${parseInt(ep) + 1}`)
                  }
              >
                <Text className="text-blue-100 font-psemibold">Sledeće </Text>
                <FontAwesome5 name="step-forward" size={24} color="#93c5fd" />
              </TouchableOpacity>
            </View>

            {/* Unos epizode */}
            <TextInput
                className="bg-gray-900 text-gray-100 font-pregular rounded-lg px-4 py-3 mb-4 border border-gray-800"
                placeholder="Unesite broj epizode..."
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={inputEpisode}
                onChangeText={setInputEpisode}
                onSubmitEditing={handleGoToEpisode}
            />

            {/* Lista epizoda */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
            >
              {episodes.map((episode) => (
                  <Link
                      key={episode.ep}
                      href={`/${encodeURIComponent(seriesData?.title_params)}/${episode.ep}`}
                      asChild
                  >
                    <TouchableOpacity
                        className={`w-12 aspect-square justify-center items-center rounded-lg ${
                            episode.ep.toString() === ep
                                ? 'bg-blue-600 border border-blue-400'
                                : episode.isFiller
                                    ? 'bg-purple-600 border border-purple-400'
                                    : 'bg-gray-900 border border-gray-800'
                        } active:opacity-80`}
                    >
                      <Text className="text-gray-100 font-psemibold">{episode.ep}</Text>
                    </TouchableOpacity>
                  </Link>
              ))}
            </ScrollView>
          </View>

          {/* Serija info */}
          <View className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-800">
            <View className="flex-row gap-4 mb-4">
              <Image
                  source={{ uri: `https://images.balkanflix.com/${seriesData?.img}` }}
                  className="w-24 h-36 rounded-lg border border-gray-800"
              />
              <View className="flex-1 gap-1">
                <Text className="text-gray-100 font-pbold text-lg">{seriesData?.title}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {seriesData?.genre?.map((genre, index) => (
                      <Text
                          key={index}
                          className="text-blue-400 font-pmedium text-sm bg-blue-900/30 px-2 py-1 rounded-md"
                      >
                        {genre}
                      </Text>
                  ))}
                </View>
                <View className="mt-2 gap-1">
                  <Text className="text-gray-400 font-pregular">
                    Epizode: {seriesData?.ep} • {seriesData?.status}
                  </Text>
                  <Text className="text-gray-400 font-pregular">
                    Studio: {seriesData?.studio}
                  </Text>
                  <Text className="text-gray-400 font-pregular">
                    Ocena: ⭐ {seriesData?.MAL_ocena}/10
                  </Text>
                  <Text className="text-gray-400 font-pregular">
                    Pregleda: {seriesData?.totalViews} 👀
                  </Text>
                </View>
              </View>
            </View>
            <Text className="text-gray-400 font-pregular leading-5">
              {seriesData?.description}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
};

export default Episode;