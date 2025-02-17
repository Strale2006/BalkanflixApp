import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';

const Episode = () => {
  const { token, user } = useGlobalContext();
  const { ep, title } = useLocalSearchParams();

  const [seriesData, setSeriesData] = useState(null);
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeSrc, setEpisodeSrc] = useState('');
  const [episodeBf, setEpisodeBf] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [inputEpisode, setInputEpisode] = useState('');
  const [selectedServer, setSelectedServer] = useState('Filemoon');

  const [startTime] = useState(new Date());

  const handleEpisodeEnd = useCallback(async () => {
    if (!startTime) {
      console.warn('Start time not defined, skipping episode end logic');
      return;
    }
    const endTime = new Date();
    try {
      await recordEpisodeWatchFull(ep, title, startTime, endTime);
      console.log('Episode watch recorded successfully');
    } catch (error) {
      console.error('Error recording episode watch:', error);
    }
  }, [startTime, title, ep]);

  useEffect(() => {
    return () => {
      handleEpisodeEnd();
    };
  }, [handleEpisodeEnd]);

  const recordEpisodeWatchFull = async (episodeNumber, seriesTitle, startTime, endTime) => {
    console.log('Inside recordEpisodeWatchFull');
    if (!token) {
      console.log('No token available.');
      return;
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    try {
      const username = user.username;
      await axios.post(
        'https://balkanflix-server.vercel.app/api/auth/watchedEpisodeFull',
        { user: username, seriesTitle, episodeNumber, startTime, endTime },
        config
      );
      console.log('Episode watch recorded for', episodeNumber);
    } catch (error) {
      console.error('Error recording episode watch:', error);
    }
  };

  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        const { data } = await axios.get(`https://balkanflix-server.vercel.app/api/content/series/${title}`);
        setSeriesData(data.series);
        console.log('API RESPONSE:', data.series);
        
        // const foundEp = data.series.episodes.find((episode) => episode.ep.toString() === ep);
        // if (foundEp) {
        //   await recordEpisodeWatch(foundEp.ep, title);
        // } else {
        //   console.log('Episode not found.');
        // }
      } catch (error) {
        console.error('Error fetching series data:', error);
      }
    };
    fetchSeriesData();
  }, [title, ep]);

  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        const { data } = await axios.get(`https://balkanflix-server.vercel.app/api/episode/episodesInfo/${title}`);
        const series = data.data;
        if (series) {
          const foundEp = series.episodes.find((episode) => episode.ep.toString() === ep);
          if (foundEp) {
            setEpisodeTitle(series.title);
            await updateEpisodeViews(series.title_params, foundEp.ep);

            if (foundEp.src) {
              setEpisodeSrc(`https://filemoon.to/e/${foundEp.src}`);
              setSelectedServer('Filemoon');
            } else {
              setEpisodeSrc('');
              setSelectedServer('Filemoon');
            }
            await recordEpisodeWatch(foundEp.ep, title);
          } else {
            console.log('Episode not found.');
          }
        } else {
          console.log('Series not found.');
        }
      } catch (error) {
        console.error('Error fetching episode data:', error);
      }
    };
    fetchEpisodeData();
  }, [title, ep]);

  useEffect(() => {
    const fetchEpCount = async () => {
      try {
        const { data } = await axios.get(`https://balkanflix-server.vercel.app/api/episode/episodeCount/${title}`);
        setEpisodes(data.episode);
      } catch (e) {
        console.log(e);
      }
    };
    fetchEpCount();
  }, [title]);

  const recordEpisodeWatch = async (episodeNumber, seriesTitle) => {
    if (!token) {
      console.log('No token available.');
      return;
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    try {
      const username = user.username;
      await axios.post(
        'https://balkanflix-server.vercel.app/api/auth/watchedEpisode',
        { user: username, seriesTitle, episodeNumber },
        config
      );
      console.log('Episode watch recorded for', episodeNumber);
    } catch (error) {
      console.error('Error recording episode watch:', error);
    }
  };

  const handleGoToEpisode = () => {
    const episodeNumber = parseInt(inputEpisode);
    if (episodeNumber > 0 && episodeNumber <= episodes.length) {
      router.push(`/${encodeURIComponent(seriesData.title_params)}/${episodeNumber}`);
    } else {
      Alert.alert('Invalid ep number');
    }
  };


  const linkToTitle = `/details/${seriesData?.title.replace(/\s+/g, '')}`;
  const episodePlus = parseInt(ep) + 1;
  const episodeMinus = parseInt(ep) - 1;
  const fillerEpisodeStyle = { backgroundColor: 'purple' };
  const currentSrc = selectedServer === 'Balkanflix' ? episodeBf : episodeSrc;

  const updateEpisodeViews = async (titleParam, episodeNumber) => {
    try {
      await axios.patch(`https://balkanflix-server.vercel.app/api/episode/episodeViews/${titleParam}/${episodeNumber}`);
    } catch (error) {
      console.error('Error updating episode views:', error);
    }
  };

  return (
    <SafeAreaView className="bg-gray-950 flex-1">
      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 48 : 24 }}
      >
        {/* Title Header */}
        <View className="mb-4 mt-6">
          <Link href={linkToTitle} asChild>
            <TouchableOpacity>
              <Text className="text-2xl font-pbold text-gray-100 mb-1">
                {seriesData?.title}
              </Text>
              <Text className="text-lg font-pmedium text-blue-400">
                Episode {ep}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
        {/* Video Player Section */}
        <View className="mb-6">
          <View className="aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
            {currentSrc ? (
              <WebView 
                allowsFullscreenVideo 
                source={{ uri: currentSrc }} 
                className="flex-1 bg-gray-900"
              />
            ) : (
              <View className="flex-1 justify-center items-center bg-gray-900">
                <Text className="text-gray-500 font-pmedium">Video not available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Server Selection */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-xl ${
              selectedServer === 'Filemoon' 
                ? 'bg-blue-600 border border-blue-400' 
                : 'bg-gray-900 border border-gray-800'
            }`}
            onPress={() => setSelectedServer('Filemoon')}
          >
            <Text className="text-center font-psemibold text-blue-400">Filemoon</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-xl ${
              selectedServer === 'Balkanflix' 
                ? 'bg-blue-600 border border-blue-400' 
                : 'bg-gray-900 border border-gray-800'
            }`}
            onPress={() => setSelectedServer('Balkanflix')}
          >
            <Text className="text-center font-psemibold text-blue-400">Balkanflix</Text>
          </TouchableOpacity>
        </View>

        {/* Episode Navigation */}
        <View className="mb-6">
          <View className="flex-row justify-between gap-4 mb-4">
            <TouchableOpacity
              className={`flex-row items-center flex-1 justify-center py-3 rounded-xl ${
                parseInt(ep) > 1 
                  ? 'bg-blue-600 active:bg-blue-700' 
                  : 'bg-gray-900 border border-gray-800 opacity-60'
              }`}
              disabled={parseInt(ep) <= 1}
              onPress={() => router.push(`/${encodeURIComponent(seriesData.title_params)}/${episodeMinus}`)}
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
              onPress={() => router.push(`/${encodeURIComponent(seriesData.title_params)}/${episodePlus}`)}
            >
              <Text className="text-blue-100 font-psemibold">Sledeće </Text>
              <FontAwesome5 name="step-forward" size={24} color="#93c5fd" />
            </TouchableOpacity>
          </View>

          {/* Episode Grid */}
          <View className="mb-4">
            <TextInput
              className="bg-gray-900 text-gray-100 font-pregular rounded-lg px-4 py-3 mb-4 border border-gray-800"
              placeholder="Enter episode number..."
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={inputEpisode}
              onChangeText={setInputEpisode}
              onSubmitEditing={handleGoToEpisode}
            />
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {episodes.map((episode) => (
                <Link
                  key={episode.ep}
                  href={`/${encodeURIComponent(seriesData.title_params)}/${episode.ep}`}
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
        </View>

        {/* Series Info */}
        <View className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-800">
          <View className="flex-row gap-4 mb-4">
            <Image
              source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${seriesData?.img}` }}
              className="w-24 h-36 rounded-lg border border-gray-800"
            />
            <View className="flex-1 gap-1">
              <Text className="text-gray-100 font-pbold text-lg">{seriesData?.title}</Text>
              <View className="flex-row flex-wrap gap-2">
                {seriesData?.genre.map((genre, index) => (
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
                  Episodes: {seriesData?.ep} • {seriesData?.status}
                </Text>
                <Text className="text-gray-400 font-pregular">
                  Studio: {seriesData?.studio}
                </Text>
                <Text className="text-gray-400 font-pregular">
                  Rating: ⭐ {seriesData?.MAL_ocena}/10
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