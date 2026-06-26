import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Modal,
    FlatList,
    Alert,
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const API_URL = 'https://balkanflix-server.up.railway.app/api';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PollManagerScreen = () => {
    // ----- State -----
    const [ankete, setAnkete] = useState([]);
    const [filter, setFilter] = useState('All'); // 'All', 'Active', 'Inactive'
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // New poll modal
    const [modalOtvoren, setModalOtvoren] = useState(false);
    const [novaAnketa, setNovaAnketa] = useState({
        pitanje: '',
        opcije: ['', ''],
        istice: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // za 7 dana default
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);

    // Analytics modal
    const [analitikaOtvoren, setAnalitikaOtvoren] = useState(false);
    const [analitikaPoll, setAnalitikaPoll] = useState(null);
    const [loadingAnalitika, setLoadingAnalitika] = useState(false);

    // ----- Helpers -----
    const getAuthHeaders = useCallback(async () => {
        const token = await AsyncStorage.getItem('authToken');
        return {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        };
    }, []);

    const vremeOd = (datumString) => {
        const razlika = Math.floor((new Date() - new Date(datumString)) / (1000 * 60 * 60 * 24));
        if (razlika < 1) return 'Danas';
        if (razlika === 1) return 'Pre 1 dan';
        return `Pre ${razlika} dana`;
    };

    const formatirajDatum = (datumString) =>
        new Date(datumString).toLocaleString('sr-RS', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const ukupnoGlasova = (opcije) => opcije.reduce((sum, opt) => sum + (opt.votes || 0), 0);

    // ----- Fetch polls -----
    const fetchPolls = async () => {
        try {
            setLoading(true);
            const config = await getAuthHeaders();
            const { data } = await axios.get(`${API_URL}/poll/getPolls`, config);
            setAnkete(data.polls || []);
        } catch (e) {
            console.error('Greška pri učitavanju anketa:', e);
            Alert.alert('Greška', 'Neuspelo učitavanje anketa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolls();
    }, []);

    // ----- Filter & search -----
    const filtriraneAnkete = ankete
        .filter((a) => {
            if (filter === 'Active') return a.isActive;
            if (filter === 'Inactive') return !a.isActive;
            return true;
        })
        .filter((a) => a.question.toLowerCase().includes(searchTerm.toLowerCase()));

    // ----- Toggle poll active status -----
    const prebaciStatus = async (id) => {
        try {
            const config = await getAuthHeaders();
            const { data } = await axios.put(`${API_URL}/poll/activeSwitch/${id}`, {}, config);
            setAnkete((prev) =>
                prev.map((a) => (a._id === id ? { ...a, isActive: data.poll.isActive } : a))
            );
        } catch (e) {
            console.error(e);
            Alert.alert('Greška', 'Promena statusa nije uspela.');
        }
    };

    // ----- Open analytics -----
    const otvoriAnalitiku = async (pollId) => {
        setLoadingAnalitika(true);
        try {
            const config = await getAuthHeaders();
            const { data } = await axios.get(`${API_URL}/poll/getPollData/${pollId}`, config);
            setAnalitikaPoll(data.poll);
            setAnalitikaOtvoren(true);
        } catch (e) {
            console.error(e);
            Alert.alert('Greška', 'Neuspelo učitavanje analitike.');
        } finally {
            setLoadingAnalitika(false);
        }
    };

    // ----- Create poll -----
    const dodajOpciju = () => setNovaAnketa((prev) => ({ ...prev, opcije: [...prev.opcije, ''] }));
    const ukloniOpciju = (index) =>
        setNovaAnketa((prev) => ({ ...prev, opcije: prev.opcije.filter((_, i) => i !== index) }));
    const promeniOpciju = (index, vrednost) => {
        const nove = [...novaAnketa.opcije];
        nove[index] = vrednost;
        setNovaAnketa((prev) => ({ ...prev, opcije: nove }));
    };

    const kreirajAnketu = async () => {
        if (!novaAnketa.pitanje.trim()) {
            setError('Pitanje je obavezno.');
            return;
        }
        const validneOpcije = novaAnketa.opcije.filter((o) => o.trim());
        if (validneOpcije.length < 2) {
            setError('Potrebne su najmanje dve opcije.');
            return;
        }
        if (!novaAnketa.istice) {
            setError('Datum isteka je obavezan.');
            return;
        }

        setCreating(true);
        setError('');
        try {
            const config = await getAuthHeaders();
            const payload = {
                question: novaAnketa.pitanje,
                options: validneOpcije,
                expiresAt: novaAnketa.istice.toISOString(),
            };
            const { data } = await axios.post(`${API_URL}/poll/createPoll`, payload, config);
            setAnkete((prev) => [data.poll, ...prev]);
            setModalOtvoren(false);
            setNovaAnketa({ pitanje: '', opcije: ['', ''], istice: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
        } catch (e) {
            console.error(e);
            setError('Kreiranje ankete nije uspelo.');
        } finally {
            setCreating(false);
        }
    };

    const onDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) setNovaAnketa((prev) => ({ ...prev, istice: selectedDate }));
    };

    // ----- Render poll card -----
    const renderPoll = ({ item }) => {
        const totalGlasova = ukupnoGlasova(item.options);
        const prikazaneOpcije = item.options.slice(0, 3);
        const preostalih = item.options.length - 3;

        return (
            <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-4 border border-gray-700 mb-4">
                {/* Header */}
                <View className="flex-row justify-between items-start mb-3">
                    <View
                        className={`px-3 py-1 rounded-full ${
                            item.isActive ? 'bg-green-600/20 border border-green-500/30' : 'bg-gray-600/20 border border-gray-500/30'
                        }`}
                    >
                        <Text
                            className={`text-xs font-pbold ${item.isActive ? 'text-green-400' : 'text-gray-400'}`}
                        >
                            {item.isActive ? 'AKTIVAN' : 'NEAKTIVAN'}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-gray-400 text-xs font-pregular">{vremeOd(item.createdAt)}</Text>
                        <Text className="text-white font-pbold text-sm">{totalGlasova} glasova</Text>
                    </View>
                </View>

                {/* Question */}
                <Text className="text-white text-base font-psemibold mb-3" numberOfLines={3}>
                    {item.question}
                </Text>

                {/* Options with progress */}
                <View className="mb-4 space-y-2">
                    {prikazaneOpcije.map((opcija, idx) => {
                        const procenat = totalGlasova > 0 ? Math.round((opcija.votes / totalGlasova) * 100) : 0;
                        return (
                            <View key={idx}>
                                <View className="flex-row justify-between mb-1">
                                    <Text className="text-gray-300 font-pmedium text-sm flex-1 mr-2">{opcija.text}</Text>
                                    <Text className="text-gray-400 font-pbold text-sm">{procenat}%</Text>
                                </View>
                                <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <View
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{ width: `${procenat}%` }}
                                    />
                                </View>
                            </View>
                        );
                    })}
                    {preostalih > 0 && (
                        <Text className="text-gray-500 font-pregular text-xs italic mt-1">
                            +{preostalih} dodatn{preostalih > 1 ? 'ih' : 'a'} opcija
                        </Text>
                    )}
                </View>

                {/* Actions */}
                <View className="flex-row justify-end gap-2 border-t border-gray-700 pt-3">
                    <TouchableOpacity
                        onPress={() => prebaciStatus(item._id)}
                        className={`px-4 py-1.5 rounded-full ${
                            item.isActive ? 'bg-red-600/20 border border-red-500/30' : 'bg-green-600/20 border border-green-500/30'
                        }`}
                    >
                        <Text
                            className={`text-xs font-pmedium ${item.isActive ? 'text-red-400' : 'text-green-400'}`}
                        >
                            {item.isActive ? 'Deaktiviraj' : 'Aktiviraj'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => otvoriAnalitiku(item._id)}
                        className="px-4 py-1.5 rounded-full bg-indigo-600/20 border border-indigo-500/30"
                    >
                        <Text className="text-indigo-400 text-xs font-pmedium">Analitika</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // ----- Main render -----
    return (
        <SafeAreaView className="flex-1 bg-gray-950">
            {/* Header */}
            <View className="relative overflow-hidden bg-gray-900 pb-6 pt-8 px-5 border-b border-gray-800">
                <View className="absolute inset-0">
                    <View className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl" />
                    <View className="absolute -bottom-6 -left-6 w-28 h-28 bg-teal-500/10 rounded-full blur-3xl" />
                </View>
                <View className="items-center">
                    <MaterialCommunityIcons name="poll" size={44} color="#818cf8" />
                    <Text className="text-white text-2xl font-pbold mt-2">Ankete</Text>
                    <Text className="text-gray-400 text-sm font-pregular mt-1 text-center">
                        Kreiraj ankete, analiziraj rezultate i upravljaj statusima
                    </Text>
                </View>
            </View>

            {/* Filters and search */}
            <View className="px-4 pt-5 pb-2">
                {/* Filter row */}
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row bg-gray-800 rounded-full p-1">
                        {['All', 'Active', 'Inactive'].map((f) => (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-full ${
                                    filter === f ? 'bg-indigo-600' : ''
                                }`}
                            >
                                <Text
                                    className={`text-sm font-pmedium ${
                                        filter === f ? 'text-white' : 'text-gray-400'
                                    }`}
                                >
                                    {f === 'All' ? 'Svi' : f === 'Active' ? 'Aktivni' : 'Neaktivni'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity
                        onPress={() => setModalOtvoren(true)}
                        className="bg-indigo-600 px-4 py-2 rounded-full flex-row items-center"
                    >
                        <MaterialCommunityIcons name="plus" size={16} color="white" />
                        <Text className="text-white font-psemibold ml-1 text-sm">Novi Poll</Text>
                    </TouchableOpacity>
                </View>

                {/* Search bar */}
                <View className="flex-row items-center bg-gray-800 rounded-xl px-3 mb-4">
                    <MaterialCommunityIcons name="magnify" size={18} color="#9ca3af" />
                    <TextInput
                        className="flex-1 h-10 text-white ml-2 font-pregular"
                        placeholder="Pretraži ankete..."
                        placeholderTextColor="#6b7280"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                    {searchTerm !== '' && (
                        <TouchableOpacity onPress={() => setSearchTerm('')}>
                            <MaterialCommunityIcons name="close" size={18} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Poll grid */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#818cf8" />
                </View>
            ) : (
                <FlatList
                    data={filtriraneAnkete}
                    keyExtractor={(item) => item._id}
                    renderItem={renderPoll}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    ListEmptyComponent={
                        <Text className="text-gray-500 text-center mt-10 font-pregular">Nema pronađenih anketa</Text>
                    }
                />
            )}

            {/* ===== Create Poll Modal ===== */}
            <Modal visible={modalOtvoren} transparent animationType="fade" onRequestClose={() => setModalOtvoren(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <View className="flex-1 justify-center items-center bg-black/70 p-4">
                        <View className="w-full max-w-md bg-gray-900 rounded-2xl p-5 border border-gray-700">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-white text-lg font-pbold">Kreiraj anketu</Text>
                                <TouchableOpacity onPress={() => setModalOtvoren(false)}>
                                    <MaterialCommunityIcons name="close" size={22} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>

                            {error ? (
                                <View className="bg-red-900/30 rounded-lg p-3 mb-3">
                                    <Text className="text-red-400 font-pregular text-sm">{error}</Text>
                                </View>
                            ) : null}

                            <ScrollView className="space-y-4" contentContainerStyle={{ paddingBottom: 16 }}>
                                {/* Pitanje */}
                                <View>
                                    <Text className="text-gray-300 font-pmedium text-sm mb-1">Pitanje</Text>
                                    <TextInput
                                        className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white font-pregular"
                                        value={novaAnketa.pitanje}
                                        onChangeText={(t) => setNovaAnketa((prev) => ({ ...prev, pitanje: t }))}
                                        placeholder="Unesite pitanje..."
                                        placeholderTextColor="#6b7280"
                                    />
                                </View>

                                {/* Opcije */}
                                <Text className="text-gray-300 font-pmedium text-sm">Opcije</Text>
                                {novaAnketa.opcije.map((op, idx) => (
                                    <View key={idx} className="flex-row items-center gap-2">
                                        <TextInput
                                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white font-pregular"
                                            value={op}
                                            onChangeText={(t) => promeniOpciju(idx, t)}
                                            placeholder={`Opcija ${idx + 1}`}
                                            placeholderTextColor="#6b7280"
                                        />
                                        {novaAnketa.opcije.length > 2 && (
                                            <TouchableOpacity onPress={() => ukloniOpciju(idx)}>
                                                <MaterialCommunityIcons name="close" size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                                <TouchableOpacity
                                    onPress={dodajOpciju}
                                    className="flex-row items-center bg-gray-800 py-2 px-4 rounded-lg self-start"
                                >
                                    <MaterialCommunityIcons name="plus" size={16} color="#a5b4fc" />
                                    <Text className="text-indigo-300 font-pmedium ml-2">Dodaj opciju</Text>
                                </TouchableOpacity>

                                {/* Datum isteka */}
                                <View>
                                    <Text className="text-gray-300 font-pmedium text-sm mb-1">Datum isteka</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(true)}
                                        className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 flex-row justify-between"
                                    >
                                        <Text className="text-white font-pregular">
                                            {novaAnketa.istice
                                                ? new Intl.DateTimeFormat('sr-Latn-RS', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }).format(novaAnketa.istice)
                                                : 'Odaberi datum'}
                                        </Text>
                                        <MaterialCommunityIcons name="calendar" size={18} color="#9ca3af" />
                                    </TouchableOpacity>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={novaAnketa.istice || new Date()}
                                            mode="datetime"
                                            display="default"
                                            onChange={onDateChange}
                                        />
                                    )}
                                </View>
                            </ScrollView>

                            <View className="flex-row justify-end gap-3 mt-4">
                                <TouchableOpacity
                                    onPress={() => setModalOtvoren(false)}
                                    className="px-5 py-2 rounded-full border border-gray-600"
                                >
                                    <Text className="text-gray-300 font-pmedium">Odustani</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={kreirajAnketu}
                                    disabled={creating}
                                    className={`px-5 py-2 rounded-full ${creating ? 'bg-gray-600' : 'bg-indigo-600'}`}
                                >
                                    <Text className="text-white font-psemibold">{creating ? 'Kreiranje...' : 'Kreiraj'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ===== Analytics Modal ===== */}
            <Modal visible={analitikaOtvoren} transparent animationType="fade" onRequestClose={() => setAnalitikaOtvoren(false)}>
                <View className="flex-1 justify-center items-center bg-black/70 p-4">
                    <View className="w-full max-w-xl bg-gray-900 rounded-2xl p-5 border border-gray-700 max-h-[85%]">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-white text-lg font-pbold">Analitika ankete</Text>
                            <TouchableOpacity onPress={() => setAnalitikaOtvoren(false)}>
                                <MaterialCommunityIcons name="close" size={22} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {loadingAnalitika ? (
                            <ActivityIndicator size="large" color="#818cf8" className="my-10" />
                        ) : analitikaPoll ? (
                            <ScrollView>
                                {/* Question & meta */}
                                <View className="mb-4 border-b border-gray-700 pb-3">
                                    <Text className="text-white font-psemibold text-base mb-2">{analitikaPoll.question}</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        <View className="bg-gray-800 rounded-full px-3 py-1">
                                            <Text className="text-gray-300 text-xs">Status: <Text className="font-pbold">{analitikaPoll.isActive ? 'Aktivan' : 'Neaktivan'}</Text></Text>
                                        </View>
                                        <View className="bg-gray-800 rounded-full px-3 py-1">
                                            <Text className="text-gray-300 text-xs">Kreirao: <Text className="font-pbold">{analitikaPoll.createdBy}</Text></Text>
                                        </View>
                                        <View className="bg-gray-800 rounded-full px-3 py-1">
                                            <Text className="text-gray-300 text-xs">Kreirano: <Text className="font-pbold">{formatirajDatum(analitikaPoll.createdAt)}</Text></Text>
                                        </View>
                                        <View className="bg-gray-800 rounded-full px-3 py-1">
                                            <Text className="text-gray-300 text-xs">Ističe: <Text className="font-pbold">{formatirajDatum(analitikaPoll.expiresAt)}</Text></Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Options table */}
                                <Text className="text-white font-psemibold mb-2">Opcije i glasovi</Text>
                                <View className="border border-gray-700 rounded-lg overflow-hidden mb-4">
                                    <View className="flex-row bg-gray-800 px-3 py-2">
                                        <Text className="flex-1 text-gray-300 font-pmedium text-xs">Opcija</Text>
                                        <Text className="w-16 text-gray-300 font-pmedium text-xs text-center">Glasova</Text>
                                        <Text className="w-16 text-gray-300 font-pmedium text-xs text-right">%</Text>
                                    </View>
                                    {analitikaPoll.options.map((opt, idx) => {
                                        const total = ukupnoGlasova(analitikaPoll.options);
                                        const procenat = total > 0 ? ((opt.votes / total) * 100).toFixed(1) : 0;
                                        return (
                                            <View key={idx} className="flex-row px-3 py-2 border-t border-gray-700">
                                                <Text className="flex-1 text-white font-pregular text-xs">{opt.text}</Text>
                                                <Text className="w-16 text-white font-pregular text-xs text-center">{opt.votes}</Text>
                                                <Text className="w-16 text-white font-pregular text-xs text-right">{procenat}%</Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* Voters */}
                                <Text className="text-white font-psemibold mb-2">Lista glasača ({analitikaPoll.voters?.length || 0})</Text>
                                {analitikaPoll.voters?.length > 0 ? (
                                    <View className="border border-gray-700 rounded-lg overflow-hidden mb-2">
                                        <View className="flex-row bg-gray-800 px-3 py-2">
                                            <Text className="flex-1 text-gray-300 font-pmedium text-xs">Korisnik</Text>
                                            <Text className="text-gray-300 font-pmedium text-xs">Vreme glasanja</Text>
                                        </View>
                                        {analitikaPoll.voters.map((glasac, idx) => (
                                            <View key={idx} className="flex-row px-3 py-2 border-t border-gray-700">
                                                <Text className="flex-1 text-white font-pregular text-xs">{glasac.username || 'Nepoznat'}</Text>
                                                <Text className="text-white font-pregular text-xs">{formatirajDatum(glasac.votedAt)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <Text className="text-gray-500 font-pregular text-xs italic bg-gray-800/50 p-3 rounded-lg">Još niko nije glasao.</Text>
                                )}
                            </ScrollView>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default PollManagerScreen;