import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { schedulePushNotification } from '../../notifications/PushNotificationService';

const API_URL = 'https://balkanflix-server.up.railway.app/api';

const DashHome = () => {
  // ---- Glavni dashboard state ----
  const [users, setUsers] = useState(null);
  const [series, setSeries] = useState(null);
  const [viewsToday, setViewsToday] = useState(null);
  const [totalViews, setTotalViews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ---- Top prevodioci state ----
  const [topTranslators, setTopTranslators] = useState([]);
  const [loadingTranslators, setLoadingTranslators] = useState(true);

  // ---- Intro timing state ----
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [introLoading, setIntroLoading] = useState(false);
  const [introStatus, setIntroStatus] = useState(null);
  const [showSeriesPicker, setShowSeriesPicker] = useState(false);
  const [showEpisodePicker, setShowEpisodePicker] = useState(false);

  // ---- Auth headers ----
  const getAuthHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem('authToken');
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);

  // ---- Fetch dashboard data ----
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, viewsRes] = await Promise.all([
        axios.get(`${API_URL}/auth/countAllUsers`),
        axios.get('https://api.byse.sx/account/stats?key=46529qdxsb1y65ki1juu9&last=30'),
      ]);

      setUsers(usersRes.data.totalUsers);
      setSeries(usersRes.data.totalSeries);

      const stats = viewsRes.data.result;
      if (stats?.length) {
        setViewsToday(stats[stats.length - 1].views);
        const monthly = stats.slice(-30).reduce((acc, item) => acc + item.views, 0);
        setTotalViews(monthly);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ---- Fetch top translators ----
  const fetchTopTranslators = async () => {
    try {
      setLoadingTranslators(true);
      const { data } = await axios.get(`${API_URL}/auth/getTopTranslators`);
      setTopTranslators((data.topTranslators || []).slice(0, 10));
      console.log(data)
    } catch (error) {
      console.error('Error fetching top translators:', error);
    } finally {
      setLoadingTranslators(false);
    }
  };

  // ---- Fetch series list for intro timing ----
  const fetchSeriesList = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/content/getTitlesForUploadEpisodes`);
      setSeriesList(data.series || []);
    } catch (error) {
      console.error('Error fetching series list:', error);
    }
  };

  // ---- Fetch episodes when series selected ----
  useEffect(() => {
    if (!selectedSeries) {
      setEpisodes([]);
      setSelectedEpisode('');
      return;
    }
    const fetchEpisodes = async () => {
      try {
        const { data } = await axios.get(
            `${API_URL}/episode/episodesInfo/${selectedSeries.title_params}`
        );
        setEpisodes(data.data?.episodes || []);
      } catch (error) {
        console.error('Error fetching episodes:', error);
        setEpisodes([]);
      }
    };
    fetchEpisodes();
  }, [selectedSeries]);

  // ---- Initial data fetch ----
  useEffect(() => {
    fetchDashboardData();
    fetchTopTranslators();
    fetchSeriesList();
  }, []);

  // ---- Refresh ----
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    fetchTopTranslators();
  };

  // ---- Test notifications ----
  const testNotification = async () => {
    try {
      await schedulePushNotification(
          'Test Notifikacija',
          'Ovo je test notifikacija iz dashboard-a!',
          { url: '/home' }
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const showPushToken = async () => {
    try {
      const token = await AsyncStorage.getItem('pushToken');
      if (token) {
        Alert.alert(
            'Push Token',
            `Current token: ${token}\n\nMake sure this token starts with "ExponentPushToken[" or "ExpoPushToken[" to work with Expo's push service.`,
            [{ text: 'OK' }]
        );
      } else {
        Alert.alert('No Token', 'No push token found in storage');
      }
    } catch (error) {
      console.error('Error getting push token:', error);
      Alert.alert('Error', 'Failed to get push token');
    }
  };

  // ---- Intro timing submit ----
  const handleIntroSubmit = async () => {
    const s = parseFloat(start);
    const e = parseFloat(end);
    if (!selectedSeries) {
      Alert.alert('Greška', 'Izaberi serijal.');
      return;
    }
    if (!selectedEpisode) {
      Alert.alert('Greška', 'Izaberi epizodu.');
      return;
    }
    if (isNaN(s) || isNaN(e)) {
      Alert.alert('Greška', 'Start i End moraju biti brojevi (sekunde).');
      return;
    }
    if (s < 0 || e <= 0) {
      Alert.alert('Greška', 'Vrednosti moraju biti pozitivne.');
      return;
    }
    if (s >= e) {
      Alert.alert('Greška', 'Start mora biti manji od End.');
      return;
    }

    setIntroLoading(true);
    setIntroStatus(null);
    try {
      const config = await getAuthHeaders();
      const payload = {
        seriesTitleParams: selectedSeries.title_params,
        episodeNumber: Number(selectedEpisode),
        intro: {
          start: Number(s.toFixed(2)),
          end: Number(e.toFixed(2)),
        },
      };
      const { data } = await axios.post(`${API_URL}/episode/setIntro`, payload, config);
      if (data.success) {
        setIntroStatus({ type: 'success', message: 'Intro uspešno sačuvan.' });
      } else {
        setIntroStatus({ type: 'error', message: data.message || 'Greška pri čuvanju intro-a.' });
      }
    } catch (err) {
      console.error('Error setting intro:', err);
      setIntroStatus({
        type: 'error',
        message: err.response?.data?.message || 'Nešto je pošlo po zlu.',
      });
    } finally {
      setIntroLoading(false);
    }
  };

  // ---- Stat card component ----
  const StatCard = ({ icon, iconColor, label, value, onPress, extra }) => (
      <TouchableOpacity
          onPress={onPress}
          activeOpacity={onPress ? 0.7 : 1}
          className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-4 border border-gray-700 mb-4"
      >
        <View className="flex-row items-center mb-3">
          <View style={{ backgroundColor: iconColor + '20' }} className="p-2 rounded-full">
            <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
          </View>
          <Text className="text-gray-400 font-psemibold ml-3">{label}</Text>
        </View>
        {loading ? (
            <View className="h-10 justify-center">
              <ActivityIndicator color={iconColor} size="small" />
            </View>
        ) : (
            <Text className="text-white text-3xl font-pbold">{value ?? '---'}</Text>
        )}
        {extra && <Text className="text-gray-400 text-sm mt-1 font-pregular">{extra}</Text>}
        {onPress && (
            <View className="flex-row items-center mt-3">
              <Text className="text-blue-400 font-psemibold text-sm">Vidi više</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#60a5fa" />
            </View>
        )}
      </TouchableOpacity>
  );

  // ---- Main render ----
  return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#06b6d4"
                  colors={['#06b6d4']}
              />
            }
        >
          {/* Header sa blobovima */}
          <View className="relative overflow-hidden bg-gray-900 pb-6 pt-8 px-5 border-b border-gray-800">
            <View className="absolute inset-0">
              <View className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
              <View className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl" />
            </View>
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-gray-400 text-sm font-pregular">Dobrodošli nazad</Text>
                <Text className="text-white text-2xl font-pbold">Dashboard</Text>
              </View>
              <TouchableOpacity
                  onPress={() => router.push('/dev-profil')}
                  className="bg-gray-800/70 p-2 rounded-full border border-gray-700"
              >
                <MaterialCommunityIcons name="account-cog" size={24} color="#06b6d4" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="p-4 space-y-5">
            {/* Stats Grid */}
            <StatCard
                icon="account-group"
                iconColor="#8b5cf6"
                label="Ukupno korisnika"
                value={users?.toLocaleString()}
            />
            <StatCard
                icon="television"
                iconColor="#f59e0b"
                label="Ukupno serijala"
                value={series?.toLocaleString()}
            />
            <StatCard
                icon="chart-line"
                iconColor="#10b981"
                label="Pregleda"
                value={
                  viewsToday !== null && totalViews !== null
                      ? `${viewsToday} / ${totalViews}`
                      : null
                }
                extra="danas / mesec"
                onPress={() => router.push('https://byse.sx/reports')}
            />

            {/* Quick Actions */}
            <View>
              <Text className="text-gray-400 font-psemibold mb-3">Brze akcije</Text>
              <View className="flex-row gap-4">
                <TouchableOpacity
                    onPress={testNotification}
                    className="flex-1 bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-4 items-center"
                >
                  <MaterialCommunityIcons name="bell-ring" size={24} color="#818cf8" />
                  <Text className="text-indigo-300 mt-2 text-center font-pmedium">
                    Test Notifikacije
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={showPushToken}
                    className="flex-1 bg-gray-700/50 border border-gray-600/30 rounded-xl p-4 items-center"
                >
                  <MaterialCommunityIcons name="key-variant" size={24} color="#9ca3af" />
                  <Text className="text-gray-300 mt-2 text-center font-pmedium">Push Token</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Administrator shortcut */}
            <View>
              <Text className="text-gray-400 font-psemibold mb-3">Administracija</Text>
              <TouchableOpacity
                  onPress={() => router.push('/dev-profil')}
                  className="bg-gray-800/70 backdrop-blur-lg rounded-xl p-4 flex-row items-center justify-between border border-gray-700"
              >
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="shield-account" size={24} color="#f97316" />
                  <Text className="text-white ml-3 font-pmedium">Developer Panel</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Top Translators Ranking */}
            <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-4 border border-gray-700">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="trophy" size={22} color="#fbbf24" />
                  <Text className="text-white text-lg font-psemibold ml-2">Top Prevodioci</Text>
                </View>
                <Text className="text-gray-400 text-xs font-pregular">Broj epizoda</Text>
              </View>
              {loadingTranslators ? (
                  <ActivityIndicator color="#fbbf24" className="my-4" />
              ) : topTranslators.length === 0 ? (
                  <Text className="text-gray-500 font-pregular text-center py-4">
                    Nema podataka o prevodiocima
                  </Text>
              ) : (
                  topTranslators.map((user, index) => (
                      <View
                          key={user._id}
                          className="flex-row items-center bg-gray-900/50 rounded-lg p-3 mb-2"
                      >
                        <View className="w-8 items-center">
                          {index === 0 ? (
                              <MaterialCommunityIcons name="crown" size={20} color="#fbbf24" />
                          ) : index === 1 ? (
                              <MaterialCommunityIcons name="medal" size={20} color="#c0c0c0" />
                          ) : index === 2 ? (
                              <MaterialCommunityIcons name="medal" size={20} color="#cd7f32" />
                          ) : (
                              <Text className="text-gray-400 font-pbold text-sm">{index + 1}</Text>
                          )}
                        </View>
                        <View className="flex-1 flex-row items-center ml-3">
                          <Image source={{uri: user.pfp}} className="w-7 h-7 rounded-full" />
                          <Text className="text-white font-pmedium ml-2">{user.username}</Text>
                        </View>
                        <Text className="text-yellow-400 font-pbold text-sm">
                          {user.totalEpisodesTranslated || 0}
                        </Text>
                      </View>
                  ))
              )}
            </View>

            {/* Intro Timing Editor */}
            <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-4 border border-gray-700">
              <View className="flex-row items-center mb-3">
                <MaterialCommunityIcons name="fast-forward" size={22} color="#f97316" />
                <Text className="text-white text-lg font-psemibold ml-2">
                  Ručno dodavanje intro timinga
                </Text>
              </View>
              <Text className="text-gray-400 text-xs mb-3 font-pregular">
                Izaberi serijal, epizodu i unesi početak/kraj intro-a u sekundama.
              </Text>

              {/* Serijal picker */}
              <Text className="text-gray-300 font-pmedium text-sm mb-1">Serijal</Text>
              <TouchableOpacity
                  onPress={() => setShowSeriesPicker(true)}
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 flex-row justify-between items-center mb-3"
              >
                <Text className="text-white font-pregular" numberOfLines={1}>
                  {selectedSeries ? selectedSeries.title : 'Odaberi serijal...'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Epizoda picker */}
              <Text className="text-gray-300 font-pmedium text-sm mb-1">Epizoda</Text>
              <TouchableOpacity
                  onPress={() => {
                    if (!selectedSeries) {
                      Alert.alert('Greška', 'Prvo odaberi serijal.');
                      return;
                    }
                    setShowEpisodePicker(true);
                  }}
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 flex-row justify-between items-center mb-3"
              >
                <Text className="text-white font-pregular">
                  {selectedEpisode ? `Epizoda ${selectedEpisode}` : 'Odaberi epizodu...'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Start & End */}
              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-gray-300 font-pmedium text-sm mb-1">Start (s)</Text>
                  <TextInput
                      className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-pregular"
                      keyboardType="numeric"
                      placeholder="npr. 12"
                      placeholderTextColor="#6b7280"
                      value={start}
                      onChangeText={setStart}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-300 font-pmedium text-sm mb-1">End (s)</Text>
                  <TextInput
                      className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-pregular"
                      keyboardType="numeric"
                      placeholder="npr. 92"
                      placeholderTextColor="#6b7280"
                      value={end}
                      onChangeText={setEnd}
                  />
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity
                  onPress={handleIntroSubmit}
                  disabled={introLoading}
                  className={`py-3 rounded-xl items-center ${
                      introLoading ? 'bg-gray-600' : 'bg-orange-600'
                  }`}
              >
                <Text className="text-white font-psemibold">
                  {introLoading ? 'Snimam...' : 'Sačuvaj Intro'}
                </Text>
              </TouchableOpacity>

              {/* Status message */}
              {introStatus && (
                  <View
                      className={`mt-3 p-3 rounded-lg flex-row items-center ${
                          introStatus.type === 'success' ? 'bg-green-900/30' : 'bg-red-900/30'
                      }`}
                  >
                    <MaterialCommunityIcons
                        name={introStatus.type === 'success' ? 'check-circle' : 'alert-circle'}
                        size={16}
                        color={introStatus.type === 'success' ? '#4ade80' : '#f87171'}
                    />
                    <Text
                        className={`ml-2 font-pregular text-xs ${
                            introStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
                        }`}
                    >
                      {introStatus.message}
                    </Text>
                  </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Modal za izbor serijala */}
        <Modal visible={showSeriesPicker} transparent animationType="fade">
          <View className="flex-1 justify-center items-center bg-black/70 p-4">
            <View className="w-4/5 max-h-96 bg-gray-900 rounded-2xl p-4 border border-gray-700">
              <Text className="text-white text-lg font-pbold mb-3 text-center">Izaberi serijal</Text>
              <FlatList
                  data={seriesList}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                      <TouchableOpacity
                          onPress={() => {
                            setSelectedSeries(item);
                            setSelectedEpisode(''); // reset episode
                            setShowSeriesPicker(false);
                          }}
                          className={`p-3 rounded-lg mb-1 ${
                              selectedSeries?._id === item._id
                                  ? 'bg-orange-600/20 border border-orange-400'
                                  : 'bg-gray-800'
                          }`}
                      >
                        <Text className="text-white font-pmedium">{item.title}</Text>
                      </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text className="text-gray-400 text-center mt-4 font-pregular">
                      Nema serijala
                    </Text>
                  }
              />
              <TouchableOpacity
                  onPress={() => setShowSeriesPicker(false)}
                  className="mt-3 py-2"
              >
                <Text className="text-gray-400 text-center font-pmedium">Zatvori</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal za izbor epizode */}
        <Modal visible={showEpisodePicker} transparent animationType="fade">
          <View className="flex-1 justify-center items-center bg-black/70 p-4">
            <View className="w-4/5 max-h-96 bg-gray-900 rounded-2xl p-4 border border-gray-700">
              <Text className="text-white text-lg font-pbold mb-3 text-center">
                Izaberi epizodu
              </Text>
              <FlatList
                  data={episodes}
                  keyExtractor={(item) => item.ep.toString()}
                  renderItem={({ item }) => (
                      <TouchableOpacity
                          onPress={() => {
                            setSelectedEpisode(item.ep.toString());
                            setShowEpisodePicker(false);
                          }}
                          className={`p-3 rounded-lg mb-1 ${
                              selectedEpisode === item.ep.toString()
                                  ? 'bg-orange-600/20 border border-orange-400'
                                  : 'bg-gray-800'
                          }`}
                      >
                        <Text className="text-white font-pmedium">Epizoda {item.ep}</Text>
                      </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text className="text-gray-400 text-center mt-4 font-pregular">
                      Nema epizoda
                    </Text>
                  }
              />
              <TouchableOpacity
                  onPress={() => setShowEpisodePicker(false)}
                  className="mt-3 py-2"
              >
                <Text className="text-gray-400 text-center font-pmedium">Zatvori</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
};

export default DashHome;