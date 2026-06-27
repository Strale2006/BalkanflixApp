import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
const TRANSLATOR_REMINDER_PREFIX = 'translator-';
import { useGlobalContext } from '../../context/GlobalProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = SCREEN_WIDTH > 768 ? 2 : 1;

const CalendarScreen = () => {
  // ---- STATE ----
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serijali, setSerijali] = useState([]);
  const { user } = useGlobalContext();
  const username = user?.username || '';

  // Add to calendar modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [oznaceniSerijal, setOznaceniSerijal] = useState(null);
  const [epizoda, setEpizoda] = useState('');
  const [izabranoVreme, setIzabranoVreme] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchSeries, setSearchSeries] = useState('');
  const [showSeriesPicker, setShowSeriesPicker] = useState(false);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editTranslator, setEditTranslator] = useState('');
  const [editEpizoda, setEditEpizoda] = useState('');
  const [editVreme, setEditVreme] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  const [schedulingNeeded, setSchedulingNeeded] = useState(false);

  // ---- HELPERS ----
  const convertToBelgradeTime = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Belgrade',
    }).format(date);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Europe/Belgrade',
    }).format(date);
  };

  const calculateCountdown = (isoString) => {
    const eventDate = new Date(isoString);
    const now = new Date();
    const diff = eventDate - now;
    if (diff <= 0) return 'SADA';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}d ${hours}h ${mins}m ${secs}s`;
  };

  const getStatus = (isoString) => {
    const eventDate = new Date(isoString);
    const now = new Date();
    const diff = eventDate - now;
    if (diff <= 0) return 'released';
    if (diff <= 24 * 60 * 60 * 1000) return 'today';
    if (diff <= 72 * 60 * 60 * 1000) return 'soon';
    return 'upcoming';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'released': return 'Sada';
      case 'today': return 'Danas';
      case 'soon': return 'Uskoro';
      default: return 'Dolazi';
    }
  };

  const getImageUrl = (img) => `https://images.balkanflix.com/${img}`;

  // Otkazuje sve prethodne prevodilačke podsetnike
  const cancelTranslatorReminders = async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(n =>
        n.identifier.startsWith(TRANSLATOR_REMINDER_PREFIX)
    );
    for (const notif of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  };

// Zakazuje podsetnike za sve buduće događaje gde je korisnik prevodilac
  const scheduleTranslatorReminders = async () => {
    if (!username || schedule.length === 0) {
      console.log('⛔ scheduleTranslatorReminders: nedostaje username ili nema schedule');
      return;
    }
    console.log(`📋 Proveravam ${schedule.length} stavki za username: "${username}"`);

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('❌ Dozvola za notifikacije nije data');
        return;
      }
    }

    await cancelTranslatorReminders();
    const now = new Date();
    let scheduledCount = 0;

    for (const item of schedule) {
      console.log(`   ➤ ${item.title} Ep ${item.ep} | pv="${item.pv}" | eventTime=${item.originalTime}`);
      if (item.pv !== username) {
        console.log(`      ❌ pv se ne poklapa (očekivano "${username}", dobijeno "${item.pv}")`);
        continue;
      }

      const eventTime = new Date(item.originalTime);
      if (eventTime <= now) {
        console.log(`      ⏭️ Vreme je već prošlo: ${eventTime.toISOString()}`);
        continue;
      }

      const reminderTime = new Date(eventTime.getTime() - 3 * 60 * 60 * 1000);
      const triggerDate = reminderTime > now ? reminderTime : new Date(now.getTime() + 10 * 1000);

      console.log(`      🕒 Podsetnik za ${triggerDate.toISOString()} (za ${Math.round((triggerDate - now) / 1000)}s)`);

      await Notifications.scheduleNotificationAsync({
        identifier: `${TRANSLATOR_REMINDER_PREFIX}${item._id}`,
        content: {
          title: `Prevodi: ${item.title} Ep ${item.ep}`,
          body: `Zakazano za ${item.date} u ${item.time}. Klikni da otvoriš kalendar.`,
          data: { url: '/calendar' },
        },
        trigger: { date: triggerDate },
      });
      scheduledCount++;
      console.log(`      ✅ ZAKAZANO (ID: ${TRANSLATOR_REMINDER_PREFIX}${item._id})`);
    }

    console.log(`📬 Ukupno zakazanih podsetnika za prevode: ${scheduledCount}`);
    setSchedulingNeeded(false);
  };

  // ---- DATA FETCHING ----
  const fetchSchedule = useCallback(async () => {
    try {
      const { data } = await axios.get('https://balkanflix-server.up.railway.app/api/schedule/animeCalendar');
      const converted = data.map(item => ({
        ...item,
        title_params: item.title_params || item.title?.replace(/\s+/g, ''),
        originalTime: item.time,
        time: convertToBelgradeTime(item.time),
        date: formatDate(item.time),
        countdown: calculateCountdown(item.time),
        imageSrc: getImageUrl(item.img),
        status: getStatus(item.time),
      }));
      setSchedule(converted);
      setSchedulingNeeded(true);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSeries = useCallback(async () => {
    try {
      const { data } = await axios.get('https://balkanflix-server.up.railway.app/api/content/getCalendarSeries');
      setSerijali(data.series || []);
    } catch (error) {
      console.error('Error fetching series:', error);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
    fetchSeries();
  }, []);

  useEffect(() => {
    if (schedulingNeeded && username) {
      scheduleTranslatorReminders();
    }
  }, [schedulingNeeded, username]);

  // Live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSchedule(prev =>
          prev.map(item => ({
            ...item,
            countdown: calculateCountdown(item.originalTime),
            status: getStatus(item.originalTime),
          }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ---- ADD TO CALENDAR ----
  const handleAddToCalendar = async () => {
    if (!oznaceniSerijal || !epizoda || !izabranoVreme) {
      Alert.alert('Greška', 'Popuni sva polja.');
      return;
    }
    const selected = serijali.find(s => s.title_params === oznaceniSerijal);
    if (!selected) return Alert.alert('Greška', 'Serijal nije pronađen.');

    const payload = {
      title: selected.title,
      title_params: selected.title_params,
      jpn: selected.jpn,
      img: selected.poster,
      ep: parseInt(epizoda, 10),
      time: izabranoVreme.toISOString(),
    };

    try {
      await axios.post('https://balkanflix-server.up.railway.app/api/schedule/addToCalendar', payload);
      Alert.alert('Uspešno', 'Dodato u kalendar!');
      setIsAddModalOpen(false);
      setEpizoda('');
      setOznaceniSerijal(null);
      setIzabranoVreme(new Date());
      setSearchSeries('');
      setShowSeriesPicker(false);
      fetchSchedule();
    } catch (err) {
      console.error(err);
      Alert.alert('Greška', 'Dodavanje nije uspelo.');
    }
  };

  // ---- EDIT / DELETE ----
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditEpizoda(item.ep.toString());
    setEditTranslator(item.pv);
    setEditVreme(new Date(item.originalTime));
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const payload = {
      ep: editEpizoda,
      pv: editTranslator,
      time: editVreme.toISOString(),
    };
    try {
      await axios.patch(
          `https://balkanflix-server.up.railway.app/api/schedule/patchCalendarItem/${editingItem.title_params}`,
          payload
      );
      Alert.alert('Sačuvano', 'Izmene su uspešno sačuvane.');
      setEditModalOpen(false);
      fetchSchedule();
    } catch (e) {
      console.error(e);
      Alert.alert('Greška', 'Čuvanje nije uspelo.');
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    try {
      await axios.delete(
          `https://balkanflix-server.up.railway.app/api/schedule/deleteCalendarItem/${editingItem.title_params}`
      );
      Alert.alert('Obrisano', 'Stavka je uklonjena iz kalendara.');
      setEditModalOpen(false);
      fetchSchedule();
    } catch (e) {
      console.error(e);
      Alert.alert('Greška', 'Brisanje nije uspelo.');
    }
  };

  const handleQuickNext = () => {
    setEditEpizoda(prev => (parseInt(prev, 10) + 1).toString());
    setEditVreme(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  // ---- DATE PICKER HANDLERS ----
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setIzabranoVreme(selectedDate);
  };

  const onEditDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowEditDatePicker(false);
    if (selectedDate) setEditVreme(selectedDate);
  };

  // ---- FILTERED SERIES ----
  const filteredSeries = serijali.filter(s =>
      s.title.toLowerCase().includes(searchSeries.toLowerCase())
  );

  // ---- RENDER CARD ----
  const renderCard = ({ item }) => {
    const isHighlighted = username === item.pv;
    const statusColor =
        item.status === 'released' ? 'bg-green-500' :
            item.status === 'today' ? 'bg-orange-500' :
                item.status === 'soon' ? 'bg-red-600' :
                    'bg-blue-600';

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/details/${encodeURIComponent(item.title_params)}`)}
            className={`w-[48%] mb-4 rounded-xl overflow-hidden border border-gray-800 bg-gray-900 ${isHighlighted ? 'border-blue-500' : ''}`}
        >
          {/* Image Container */}
          <View className="relative aspect-[3/4]">
            <Image
                source={{ uri: item.imageSrc }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
            />
            <View className="absolute top-2 left-2 bg-red-600 px-2 py-1 rounded-lg flex-row items-center">
              <MaterialCommunityIcons name="play" size={10} color="white" />
              <Text className="text-white font-pbold text-xs ml-1">Ep {item.ep}</Text>
            </View>
            <View className={`absolute top-3 right-3 px-2 py-1 rounded-lg ${statusColor}`}>
              <Text className="text-white font-pbold text-xs">{getStatusText(item.status)}</Text>
            </View>
            <TouchableOpacity
                onPress={() => handleOpenEdit(item)}
                className="absolute bottom-3 right-3 bg-gray-800/80 w-9 h-9 rounded-full items-center justify-center"
            >
              <MaterialCommunityIcons name="pencil" size={12} color="#a5b4fc" />
            </TouchableOpacity>
          </View>

          <View className="p-2 flex-1">
            <Text className="text-white font-psemibold text-base mb-2" numberOfLines={2}>
              {item.title}
            </Text>
            <View className="flex-row items-center gap-2 mb-1">
              <View className="flex-row items-center gap-0.5">
                <MaterialCommunityIcons name="calendar" size={10} color="#9ca3af" />
                <Text className="text-gray-400 font-pregular text-xs">{item.date}</Text>
              </View>
              <View className="flex-row items-center gap-0.5">
                <MaterialCommunityIcons name="clock" size={10} color="#9ca3af" />
                <Text className="text-gray-400 font-pregular text-xs">{item.time}</Text>
              </View>
            </View>
            <View className="flex-row items-center bg-gray-800/50 p-2 rounded-md mb-1">
              <MaterialCommunityIcons name="account" size={10} color="#9ca3af" />
              <Text className={`ml-1 font-pmedium text-xs ${isHighlighted ? 'text-blue-400' : 'text-gray-400'}`}>
                {item.pv}
              </Text>
            </View>
            {item.countdown !== 'SADA' && (
                <View className="mt-auto bg-black/30 p-2 rounded-lg border border-red-500/20">
                  <Text className="text-gray-400 font-pregular text-xs mb-1">Preostalo:</Text>
                  <Text className="text-red-500 font-pbold text-sm">{item.countdown}</Text>
                </View>
            )}
          </View>
        </TouchableOpacity>
    );
  };

  // ---- RENDER ----
  return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="relative overflow-hidden bg-gray-900 pb-6 pt-8 px-5 border-b border-gray-800">
          {/* Background blobs */}
          <View className="absolute inset-0">
            <View className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />
            <View className="absolute -bottom-6 -left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          </View>

          <View className="items-center">
            <MaterialCommunityIcons name="calendar-month" size={44} color="#06b6d4" />
            <Text className="text-white text-2xl font-pbold mt-2">Anime Kalendar</Text>
            <Text className="text-gray-400 text-sm font-pregular text-center mt-1">
              Procenjeno vreme izlaska epizoda
            </Text>

            <TouchableOpacity
                onPress={() => setIsAddModalOpen(true)}
                className="mt-4 bg-red-600/90 px-6 py-2.5 rounded-xl flex-row items-center"
            >
              <MaterialCommunityIcons name="plus" size={18} color="white" />
              <Text className="text-white font-psemibold ml-2">Dodaj na listu</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#ef4444" />
            </View>
        ) : (
            <FlatList
                data={schedule}
                keyExtractor={(item) => item._id}
                renderItem={renderCard}
                numColumns={2}
                key={NUM_COLUMNS}
                contentContainerStyle={{ padding: 12 }}
                columnWrapperStyle={{justifyContent: 'space-between' }}
            />
        )}

        {/* ====== ADD MODAL ====== */}
        <Modal visible={isAddModalOpen} transparent animationType="fade" onRequestClose={() => setIsAddModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <View className="flex-1 justify-center items-center bg-black/70 p-4">
              <View className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-gray-700">
                <Text className="text-white text-xl font-pbold text-center mb-2">Dodaj na listu</Text>
                <Text className="text-gray-400 text-center font-pregular mb-4">
                  Ovde možeš dodati serijal na kalendar izbacivanja.
                </Text>

                {/* Series Picker */}
                <Text className="text-gray-300 font-psemibold mb-1">Izaberi serijal:</Text>
                <TouchableOpacity
                    onPress={() => setShowSeriesPicker(!showSeriesPicker)}
                    className="bg-gray-800 p-3 rounded-xl flex-row justify-between items-center mb-4"
                >
                  <Text className="text-white font-pmedium" numberOfLines={1}>
                    {oznaceniSerijal
                        ? serijali.find(s => s.title_params === oznaceniSerijal)?.title || 'Odabran'
                        : 'Odaberi...'}
                  </Text>
                  <MaterialCommunityIcons name={showSeriesPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#9ca3af" />
                </TouchableOpacity>

                {showSeriesPicker && (
                    <View className="bg-gray-800 rounded-xl mb-4 overflow-hidden">
                      <View className="flex-row items-center bg-gray-700 mx-3 mt-3 rounded-lg px-3 py-2">
                        <MaterialCommunityIcons name="magnify" size={16} color="#9ca3af" />
                        <TextInput
                            className="flex-1 ml-2 text-white font-pregular"
                            placeholder="Pretraži serijale..."
                            placeholderTextColor="#6b7280"
                            value={searchSeries}
                            onChangeText={setSearchSeries}
                        />
                        {searchSeries !== '' && (
                            <TouchableOpacity onPress={() => setSearchSeries('')}>
                              <MaterialCommunityIcons name="close" size={16} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                      </View>
                      <ScrollView className="max-h-40" nestedScrollEnabled={true}>
                        {filteredSeries.length > 0 ? (
                            filteredSeries.map((s, idx) => (
                                <TouchableOpacity
                                    key={s._id ? s._id.toString() : `serija-${idx}`}
                                    onPress={() => {
                                      setOznaceniSerijal(s.title_params);
                                      setShowSeriesPicker(false);
                                      setSearchSeries('');
                                    }}
                                    className={`px-4 py-3 flex-row items-center ${
                                        oznaceniSerijal === s.title_params ? 'bg-red-600/20' : ''
                                    }`}
                                >
                                  <MaterialCommunityIcons
                                      name={oznaceniSerijal === s.title_params ? 'radiobox-marked' : 'radiobox-blank'}
                                      size={18}
                                      color={oznaceniSerijal === s.title_params ? '#ef4444' : '#9ca3af'}
                                  />
                                  <Text className="text-white font-pmedium ml-3 flex-1" numberOfLines={1}>
                                    {s.title}
                                  </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View className="px-4 py-3">
                              <Text className="text-gray-500 font-pregular text-center">Nema rezultata</Text>
                            </View>
                        )}
                      </ScrollView>
                    </View>
                )}

                {/* Episode */}
                <Text className="text-gray-300 font-psemibold mb-1">Broj epizode:</Text>
                <TextInput
                    className="bg-gray-800 p-3 rounded-xl text-white mb-4 font-pregular"
                    keyboardType="numeric"
                    value={epizoda}
                    onChangeText={setEpizoda}
                    placeholder="npr. 1149"
                    placeholderTextColor="#6b7280"
                />

                {/* Date & Time */}
                <Text className="text-gray-300 font-psemibold mb-1">Datum i vreme:</Text>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-gray-800 p-3 rounded-xl mb-2"
                >
                  <Text className="text-white font-pregular">
                    {new Intl.DateTimeFormat('sr-Latn-RS', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }).format(izabranoVreme)}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={izabranoVreme}
                        mode="datetime"
                        display="default"
                        onChange={onDateChange}
                    />
                )}

                <TouchableOpacity
                    onPress={handleAddToCalendar}
                    className="bg-red-600 py-3 rounded-xl mt-4"
                >
                  <Text className="text-white text-center font-psemibold">Potvrdi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                      setIsAddModalOpen(false);
                      setShowSeriesPicker(false);
                      setSearchSeries('');
                    }}
                    className="mt-3 py-2"
                >
                  <Text className="text-gray-400 text-center font-pmedium">Zatvori</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ====== EDIT MODAL ====== */}
        <Modal visible={editModalOpen} transparent animationType="fade" onRequestClose={() => setEditModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <View className="flex-1 justify-center items-center bg-black/70 p-4">
              <View className="w-full max-w-md bg-gray-900 rounded-2xl p-6 border border-indigo-500/30">
                <View className="flex-row items-center justify-center mb-4">
                  <MaterialCommunityIcons name="pencil" size={22} color="#a5b4fc" />
                  <Text className="text-white text-xl font-pbold ml-2">
                    Izmeni "{editingItem?.title || ''}"
                  </Text>
                </View>

                <Text className="text-gray-300 font-psemibold mb-1">Broj epizode:</Text>
                <TextInput
                    className="bg-gray-800 p-3 rounded-xl text-white mb-4 font-pregular"
                    keyboardType="numeric"
                    value={editEpizoda}
                    onChangeText={setEditEpizoda}
                />

                <Text className="text-gray-300 font-psemibold mb-1">Ime prevodioca:</Text>
                <TextInput
                    className="bg-gray-800 p-3 rounded-xl text-white mb-4 font-pregular"
                    value={editTranslator}
                    onChangeText={setEditTranslator}
                    placeholder="Unesi ime"
                    placeholderTextColor="#6b7280"
                />

                <Text className="text-gray-300 font-psemibold mb-1">Datum i vreme:</Text>
                <TouchableOpacity
                    onPress={() => setShowEditDatePicker(true)}
                    className="bg-gray-800 p-3 rounded-xl mb-4"
                >
                  <Text className="text-white font-pregular">
                    {new Intl.DateTimeFormat('sr-Latn-RS', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }).format(editVreme)}
                  </Text>
                </TouchableOpacity>
                {showEditDatePicker && (
                    <DateTimePicker
                        value={editVreme}
                        mode="datetime"
                        display="default"
                        onChange={onEditDateChange}
                    />
                )}

                <View className="flex-row gap-3 mt-2">
                  <TouchableOpacity
                      onPress={handleSaveEdit}
                      className="flex-1 bg-green-600 py-3 rounded-xl flex-row items-center justify-center"
                  >
                    <MaterialCommunityIcons name="content-save" size={18} color="white" />
                    <Text className="text-white font-psemibold ml-2">Sačuvaj</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      onPress={handleDelete}
                      className="flex-1 bg-red-600 py-3 rounded-xl flex-row items-center justify-center"
                  >
                    <MaterialCommunityIcons name="delete" size={18} color="white" />
                    <Text className="text-white font-psemibold ml-2">Obriši</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={handleQuickNext}
                    className="mt-3 bg-yellow-500/20 border border-yellow-500/30 py-2 rounded-xl items-center"
                >
                  <MaterialCommunityIcons name="lightning-bolt" size={20} color="#fbbf24" />
                  <Text className="text-yellow-400 font-pmedium text-xs">+1 epizoda / +7 dana</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setEditModalOpen(false)}
                    className="mt-4 py-2"
                >
                  <Text className="text-gray-400 text-center font-pmedium">Zatvori</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
  );
};

export default CalendarScreen;