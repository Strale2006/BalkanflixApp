import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
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
    <SafeAreaView className='bg-black h-full'>
      <ScrollView className="bg-black flex-1 p-4">
          {/* Episode Header & Video */}
          <View className="mb-4">
            <Link href={linkToTitle}>
              <Text className="text-xl font-pbold text-white mb-2">
                {episodeTitle} - Epizoda {ep} Online sa prevodom
              </Text>
            </Link>
            <View className="h-64 bg-gray-800 rounded overflow-hidden">
              {currentSrc ? (
                <WebView   allowsFullscreenVideo={true} source={{ uri: currentSrc }} style={{ flex: 1 }} />
              ) : (
                <Text className="text-white text-center">No video available</Text>
              )}
            </View>
          </View>

          {/* Episode Navigation & Input */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              {parseInt(ep) > 1 ? (
                <TouchableOpacity onPress={() => router.push(`/${encodeURIComponent(seriesData.title_params)}/${episodeMinus}`)} className="flex-row items-center">
                  <FontAwesome5 name="fast-backward" size={20} color="white" />
                  <Text className="text-white ml-2 font-psemibold">Prošla epizoda</Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-row items-center opacity-50">
                  <FontAwesome5 name="fast-backward" size={20} color="white" />
                  <Text className="text-white ml-2 font-psemibold">Prošla epizoda</Text>
                </View>
              )}
              {parseInt(ep) < episodes.length ? (
                <TouchableOpacity onPress={() => router.push(`/${encodeURIComponent(seriesData.title_params)}/${episodePlus}`)} className="flex-row items-center">
                  <Text className="text-white mr-2 font-psemibold">Sledeća epizoda</Text>
                  <FontAwesome5 name="fast-forward" size={20} color="white" />
                </TouchableOpacity>
              ) : (
                <View className="flex-row items-center opacity-50">
                  <Text className="text-white mr-2 font-psemibold">Sledeća epizoda</Text>
                  <FontAwesome5 name="fast-forward" size={20} color="white" />
                </View>
              )}
            </View>
            {/* <TouchableOpacity onPress={() => Alert.alert('Prijavi problem')} className="flex-row items-center mb-2">
              <FontAwesome5 name="exclamation-triangle" size={20} color="white" />
              <Text className="text-white ml-2 font-psemibold">Prijavi problem</Text>
            </TouchableOpacity> */}
            <TextInput
              className="border border-gray-500 p-2 rounded-md text-white font-psemibold"
              placeholder="Broj epizode"
              placeholderTextColor="#888"
              value={inputEpisode}
              onChangeText={setInputEpisode}
              onSubmitEditing={handleGoToEpisode}
              keyboardType="numeric"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
              {episodes.map((episode, index) => (
                <Link key={index} href={`/${encodeURIComponent(seriesData.title_params)}/${episode.ep}`} asChild>
                  <TouchableOpacity style={episode.isFiller ? fillerEpisodeStyle : {}} className="p-2 bg-gray-800 rounded mx-1">
                    <Text className="text-white font-psemibold">{episode.ep}</Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </ScrollView>
          </View>

          {/* Series Description */}
          <View className="flex-row mb-4">
            <Image
              source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${seriesData?.img}` }}
              className="w-24 h-36 mr-4 rounded"
            />
            <View className="flex-1">
              <Link href={linkToTitle}>
                <Text className="text-lg font-pbold text-white">{seriesData?.title}</Text>
              </Link>
              <View className="flex-row flex-wrap mt-1">
                {seriesData?.genre.map((item, key) => (
                  <Link key={key} href={linkToTitle} asChild>
                    <TouchableOpacity className="mr-2 mb-1">
                      <Text className="text-blue-300 font-pmedium">{item}</Text>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
              <View className="mt-2">
                <Text className="text-white font-pregular">Epizoda: {seriesData?.ep}</Text>
                <Text className="text-white font-pregular">Datum: {seriesData?.date}</Text>
                <Text className="text-white font-pregular">Status: {seriesData?.status}</Text>
              </View>
              <View className="mt-2">
                <Text className="text-white font-pregular">Studio: {seriesData?.studio}</Text>
                <Text className="text-white font-pregular">Ocena: {seriesData?.MAL_ocena}</Text>
                <Text className="text-white font-pregular">Pregledi: {seriesData?.totalViews}</Text>
              </View>
              <Text className="mt-2 text-gray-300 font-pregular text-sm mb-16">{seriesData?.description}</Text>
            </View>
          </View>          
        </ScrollView>
    </SafeAreaView>
    
  );
};

export default Episode;
