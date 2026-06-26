import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Modal,
    Alert,
    ActivityIndicator,
    FlatList,
    Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://balkanflix-server.up.railway.app/api';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DeveloperProfile = () => {
    // ===== State (unchanged) =====
    const [userData, setUserData] = useState(null);
    const [recentTranslations, setRecentTranslations] = useState([]);
    const [highestRole, setHighestRole] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [totalEarned, setTotalEarned] = useState('');
    const [earningsData, setEarningsData] = useState(null);
    const [translators, setTranslators] = useState([]);
    const [editedEarnings, setEditedEarnings] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [episodeValue, setEpisodeValue] = useState(0);
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [manualAddAmount, setManualAddAmount] = useState('');
    const [manualAddTranslator, setManualAddTranslator] = useState('');
    const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [savingRoles, setSavingRoles] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newRoles, setNewRoles] = useState([]);
    const [customRoleInput, setCustomRoleInput] = useState('');

    // ===== Helper: get auth token (unchanged) =====
    const getAuthHeaders = useCallback(async () => {
        const token = await AsyncStorage.getItem('authToken');
        return {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        };
    }, []);

    // ===== Fetch initial data (unchanged) =====
    useEffect(() => {
        const getPrivateData = async () => {
            try {
                const config = await getAuthHeaders();
                const { data } = await axios.get(`${API_URL}/private`, config);
                setUserData(data);

                const hierarchy = ['admin', 'coordinator', 'moderator', 'translator'];
                const userRoles = data.roles || [];
                setHighestRole(hierarchy.find(role => userRoles.includes(role)) || '');
            } catch (e) {
                console.error(e);
            }
        };

        const getRecentTranslations = async () => {
            try {
                const config = await getAuthHeaders();
                const { data } = await axios.get(`${API_URL}/translations/getRecentTranslations`, config);
                setRecentTranslations(data.recentTranslations || []);
            } catch (e) {
                console.error(e);
            }
        };

        getPrivateData();
        getRecentTranslations();
    }, []);

    // ===== Earnings calculation (unchanged) =====
    const handleInputChange = (text) => setTotalEarned(text);

    const calculateEarnings = async () => {
        const num = Number(totalEarned);
        if (!num || isNaN(num) || num <= 0) {
            Alert.alert('Greška', 'Molimo unesite validnu sumu za zaradu.');
            return;
        }
        setLoading(true);
        try {
            const config = await getAuthHeaders();
            const { data } = await axios.post(`${API_URL}/translations/findWorth`, { total: num }, config);
            setEarningsData(data);
            setTranslators(data.preview || []);
            setEpisodeValue(data.vrednostEpizode);
            setShowPreview(true);
        } catch (e) {
            console.error(e);
            Alert.alert('Greška', 'Došlo je do greške pri računanju zarade.');
        } finally {
            setLoading(false);
        }
    };

    // ===== Manual edit / redistribute (unchanged) =====
    const handleManualEdit = (translatorId, newEarned) => {
        if (isNaN(newEarned) || newEarned < 0) return;
        setEditedEarnings(prev => ({ ...prev, [translatorId]: newEarned }));
        redistributeEarnings(translatorId, newEarned);
    };

    const redistributeEarnings = (editedTranslatorId, newEarned) => {
        if (!earningsData || !translators.length) return;
        const edited = translators.find(t => t.id === editedTranslatorId);
        if (!edited) return;
        const oldEarned = edited.earned;
        const diff = newEarned - oldEarned;
        const others = translators.filter(t => t.id !== editedTranslatorId);
        const totalOtherEpisodes = others.reduce((sum, t) => sum + t.brojPrevoda, 0);
        if (totalOtherEpisodes === 0) return;
        const adjustmentPerEpisode = -diff / totalOtherEpisodes;
        const updated = translators.map(t => {
            if (t.id === editedTranslatorId) {
                return { ...t, earned: newEarned };
            }
            const adj = adjustmentPerEpisode * t.brojPrevoda;
            return { ...t, earned: parseFloat(Math.max(0, t.earned + adj).toFixed(2)) };
        });
        setTranslators(updated);
    };

    const distributeToOthers = (id) => {
        const translator = translators.find(t => t.id === id);
        if (!translator || translator.earned <= 0) return;
        const amount = translator.earned;
        const others = translators.filter(t => t.id !== id);
        const totalEpisodes = others.reduce((sum, t) => sum + t.brojPrevoda, 0);
        if (totalEpisodes === 0) {
            Alert.alert('Info', 'Nema drugih prevodilaca za raspodelu!');
            return;
        }
        const amountPerEpisode = amount / totalEpisodes;
        const updated = translators.map(t => {
            if (t.id === id) return { ...t, earned: 0 };
            return { ...t, earned: parseFloat((t.earned + amountPerEpisode * t.brojPrevoda).toFixed(2)) };
        });
        setTranslators(updated);
        setEditedEarnings(prev => ({ ...prev, [id]: 0 }));
    };

    const removeEarnings = (id) => {
        const updated = translators.map(t => t.id === id ? { ...t, earned: 0 } : t);
        setTranslators(updated);
        setEditedEarnings(prev => ({ ...prev, [id]: 0 }));
    };

    const addManualEarnings = () => {
        const amount = Number(manualAddAmount);
        if (!manualAddTranslator || !amount || isNaN(amount) || amount <= 0) {
            Alert.alert('Greška', 'Odaberite prevodioca i unesite validan iznos.');
            return;
        }
        const updated = translators.map(t => {
            if (t.id === manualAddTranslator) {
                return { ...t, earned: parseFloat((t.earned + amount).toFixed(2)) };
            }
            return t;
        });
        setTranslators(updated);
        setEditedEarnings(prev => ({ ...prev, [manualAddTranslator]: true }));
        setManualAddAmount('');
        setManualAddTranslator('');
        setShowManualAdd(false);
    };

    const resetManualEdits = () => {
        if (earningsData) {
            setTranslators(earningsData.preview);
            setEditedEarnings({});
            setEpisodeValue(earningsData.vrednostEpizode);
        }
    };

    const confirmAndDistribute = async () => {
        Alert.alert(
            'Potvrda',
            'Da li ste sigurni da želite da potvrdite zarade i resetujete epizode?',
            [
                { text: 'Otkaži', style: 'cancel' },
                {
                    text: 'Da',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const config = await getAuthHeaders();
                            const payload = {
                                translators: translators.map(t => ({ id: t.id, earned: t.earned })),
                                totalEarned: Number(totalEarned),
                                episodeValue,
                            };
                            const { data } = await axios.post(`${API_URL}/translations/confirmDistribution`, payload, config);
                            if (data.status === 'success') {
                                Alert.alert('Uspeh', 'Zarade su uspešno raspoređene i epizode resetovane!');
                                closeModal();
                                const { data: newData } = await axios.get(`${API_URL}/private`, config);
                                setUserData(newData);
                            }
                        } catch (e) {
                            console.error(e);
                            Alert.alert('Greška', 'Došlo je do greške pri potvrđivanju zarada.');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setShowPreview(false);
        setTotalEarned('');
        setEarningsData(null);
        setTranslators([]);
        setEditedEarnings({});
        setShowManualAdd(false);
        setManualAddAmount('');
        setManualAddTranslator('');
    };

    // ===== User search & role management (unchanged) =====
    useEffect(() => {
        if (searchQuery.length < 2) {
            setUsers([]);
            setLoadingUsers(false);
            return;
        }
        const search = async () => {
            try {
                setLoadingUsers(true);
                const config = await getAuthHeaders();
                const { data } = await axios.get(`${API_URL}/auth/search?q=${encodeURIComponent(searchQuery)}`, config);
                setUsers(data.korisnici || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingUsers(false);
            }
        };
        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const selectedUser = users.find(u => u._id === selectedUserId);

    const openUserSearchModal = () => setIsUserSearchModalOpen(true);
    const closeUserSearchModal = () => {
        setIsUserSearchModalOpen(false);
        setSearchQuery('');
        setSelectedUserId(null);
        setNewRoles([]);
        setCustomRoleInput('');
        setSaveError(null);
    };

    const selectUser = (id) => {
        setSelectedUserId(id);
        setNewRoles([]);
    };

    const toggleRole = (role) => {
        setNewRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    };

    const addCustomRole = () => {
        const trimmed = customRoleInput.trim();
        if (trimmed && !newRoles.includes(trimmed)) {
            setNewRoles([...newRoles, trimmed]);
            setCustomRoleInput('');
        }
    };

    const removeNewRole = (role) => {
        setNewRoles(newRoles.filter(r => r !== role));
    };

    const saveUserRoles = async () => {
        if (!selectedUserId || newRoles.length === 0) return;
        setSavingRoles(true);
        setSaveError(null);
        let updatedUsers = [...users];
        const userIndex = updatedUsers.findIndex(u => u._id === selectedUserId);
        if (userIndex === -1) return;
        const currentRoles = [...(updatedUsers[userIndex].roles || [])];
        try {
            const config = await getAuthHeaders();
            for (const roleName of newRoles) {
                if (!currentRoles.includes(roleName)) {
                    const response = await axios.post(`${API_URL}/auth/addRole/${selectedUserId}`, { role: roleName }, config);
                    if (!response.data.success) throw new Error(response.data.message || 'Greška');
                    currentRoles.push(roleName);
                }
            }
            updatedUsers[userIndex] = { ...updatedUsers[userIndex], roles: currentRoles };
            setUsers(updatedUsers);
            setNewRoles([]);
            closeUserSearchModal();
        } catch (error) {
            console.error(error);
            setSaveError(error.response?.data?.message || 'Došlo je do greške pri čuvanju rola.');
        } finally {
            setSavingRoles(false);
        }
    };

    // ===== Derived data =====
    const totalEarnings = translators.reduce((sum, t) => sum + t.earned, 0);
    const expectedTotal = earningsData?.fond || 0;

    if (!userData) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-950">
                <ActivityIndicator size="large" color="#06b6d4" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-950" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* ====== HERO SECTION with blobs ====== */}
            <View className="relative overflow-hidden bg-gray-900 pb-6 pt-10 px-5 border-b border-gray-800">
                {/* Background blobs */}
                <View className="absolute inset-0">
                    <View className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
                    <View className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl" />
                </View>

                {/* Profile info */}
                <View className="items-center">
                    <Image
                        source={{ uri: userData.pfp }}
                        className="w-24 h-24 rounded-full border-3 border-cyan-400"
                    />
                    <Text className="text-white text-2xl font-pbold mt-3">
                        {userData.username}
                    </Text>
                    <View className="bg-cyan-500/20 px-3 py-1 rounded-full mt-1">
                        <Text className="text-cyan-400 text-sm font-psemibold capitalize">
                            {highestRole}
                        </Text>
                    </View>
                    <Text className="text-gray-400 text-sm font-pregular mt-1">
                        Član od{' '}
                        {userData.createdAt
                            ? new Date(userData.createdAt).toLocaleDateString('sr-RS')
                            : '...'}
                    </Text>
                </View>

                {/* Stats */}
                <View className="flex-row justify-around mt-6">
                    <View className="items-center bg-gray-800/50 p-4 rounded-2xl w-[45%]">
                        <MaterialCommunityIcons name="web" size={24} color="#06b6d4" />
                        <Text className="text-gray-400 text-xs mt-1 font-pregular">Prevoda</Text>
                        <Text className="text-white text-xl font-pbold">{userData.brojPrevoda}</Text>
                    </View>
                    <View className="items-center bg-gray-800/50 p-4 rounded-2xl w-[45%]">
                        <MaterialCommunityIcons name="wallet" size={24} color="#10b981" />
                        <Text className="text-gray-400 text-xs mt-1 font-pregular">Balans</Text>
                        <Text className="text-green-400 text-xl font-pbold">${userData.balance}</Text>
                    </View>
                </View>
            </View>

            {/* ====== MAIN CONTENT ====== */}
            <View className="p-4 space-y-5">
                {/* Recent Translations (if translator) */}
                {recentTranslations.length > 0 && (
                    <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-4 border border-gray-700">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-cyan-500/20 p-2 rounded-full">
                                <MaterialCommunityIcons name="television" size={18} color="#06b6d4" />
                            </View>
                            <Text className="text-white text-lg font-psemibold ml-3">Skoriji prevodi</Text>
                        </View>
                        {recentTranslations.map(prevod => (
                            <View key={prevod._id} className="flex-row bg-gray-900/50 rounded-xl p-3 mb-2">
                                <Image
                                    source={{ uri: `https://images.balkanflix.com/${prevod.img}` }}
                                    className="w-14 h-20 rounded-lg"
                                />
                                <View className="ml-3 flex-1 justify-between">
                                    <View>
                                        <Text className="text-white font-psemibold text-sm">{prevod.seriesTitle}</Text>
                                        <Text className="text-gray-300 font-pregular text-xs">Epizoda {prevod.episodeNumber}</Text>
                                    </View>
                                    <Text className="text-green-400 text-xs font-pregular">✓ Završeno</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Balance Card */}
                <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-4 border border-gray-700">
                    <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center">
                            <View className="bg-green-500/20 p-2 rounded-full">
                                <MaterialCommunityIcons name="wallet" size={18} color="#10b981" />
                            </View>
                            <Text className="text-white ml-3 font-psemibold">Tvoj Balans</Text>
                        </View>
                        <Text className="text-green-400 text-xl font-pbold">${userData.balance}</Text>
                    </View>
                    <Text className="text-gray-400 text-xs font-pregular ml-12">Dostupno za primenu</Text>
                </View>

                {/* Admin Panel (only for admins) */}
                {highestRole === 'admin' && (
                    <View>
                        <Text className="text-white text-lg font-psemibold mb-3">Admin Panel</Text>
                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                onPress={() => setIsModalOpen(true)}
                                className="flex-1 bg-red-600/10 border border-red-500/30 rounded-2xl p-4 items-center"
                            >
                                <MaterialCommunityIcons name="alert-circle" size={24} color="#ef4444" />
                                <Text className="text-red-400 mt-2 text-center font-pmedium">Reset Meseca</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={openUserSearchModal}
                                className="flex-1 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-4 items-center"
                            >
                                <MaterialCommunityIcons name="account" size={24} color="#6366f1" />
                                <Text className="text-indigo-400 mt-2 text-center font-pmedium">Korisnici</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Redeem Rewards */}
                <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-4 border border-gray-700">
                    <Text className="text-white text-lg font-pbold mb-4">Pokupi Nagradu</Text>
                    <View className="space-y-3">
                        {[
                            { icon: 'lightning-bolt', color: '#fbbf24', title: 'Discord Nitro', desc: '1 mesec' },
                            { icon: 'gamepad-variant', color: '#2563eb', title: 'Steam', desc: 'Igrica po izboru' },
                            { icon: 'gamepad-variant', color: '#7c3aed', title: 'Epic Games', desc: 'Igrica po izboru' },
                            { icon: 'gift', color: '#dc2626', title: 'Netflix', desc: '1 mesec' },
                            { icon: 'gift', color: '#1db954', title: 'Spotify Premium', desc: '1 mesec' },
                        ].map((reward, idx) => (
                            <View key={idx} className="flex-row items-center bg-gray-900/50 rounded-xl p-3">
                                <MaterialCommunityIcons name={reward.icon} size={22} color={reward.color} />
                                <View className="ml-3">
                                    <Text className="text-white font-pmedium">{reward.title}</Text>
                                    <Text className="text-gray-400 text-xs font-pregular">{reward.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* ====== EARNINGS MODAL (dark style) ====== */}
            <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={closeModal}>
                <View className="flex-1 justify-center items-center bg-black/70 p-4">
                    <View className="w-full max-h-[90%] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
                        <View className="flex-row justify-between items-center p-4 border-b border-gray-700">
                            <Text className="text-white text-lg font-pbold">Mesečni Obračun Zarade</Text>
                            <TouchableOpacity onPress={closeModal}>
                                <MaterialCommunityIcons name="close" size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {!showPreview ? (
                            <View className="p-4">
                                <Text className="text-gray-300 mb-2 font-pregular">Unesite ukupnu mesečnu zaradu:</Text>
                                <View className="flex-row items-center bg-gray-800 rounded-lg px-3 mb-4">
                                    <TextInput
                                        className="flex-1 h-12 text-white font-pregular"
                                        placeholder="Npr. 1000"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="numeric"
                                        value={totalEarned}
                                        onChangeText={handleInputChange}
                                    />
                                    <Text className="text-gray-400 font-pregular">$</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={calculateEarnings}
                                    disabled={loading}
                                    className={`py-3 rounded-lg ${loading ? 'bg-gray-700' : 'bg-cyan-600'}`}
                                >
                                    <Text className="text-white text-center font-psemibold">
                                        {loading ? 'Računam...' : 'Izračunaj Zarade'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 20 }}>
                                {/* Summary cards */}
                                <View className="flex-row flex-wrap justify-between mb-4">
                                    {[
                                        { label: 'Ukupna Zarada', value: `$${Number(totalEarned).toFixed(2)}` },
                                        { label: 'Za Održavanje (25%)', value: `$${earningsData?.odrzavanje.toFixed(2)}` },
                                        { label: 'Fond za Nagrade', value: `$${earningsData?.fond.toFixed(2)}`, color: 'text-green-400' },
                                        { label: 'Vrednost Epizode', value: `$${episodeValue.toFixed(2)}` },
                                    ].map((item, idx) => (
                                        <View key={idx} className="bg-gray-800 rounded-lg p-3 w-[48%] mb-2">
                                            <Text className="text-gray-400 text-xs font-pregular">{item.label}</Text>
                                            <Text className={`text-lg font-pbold ${item.color || 'text-white'}`}>{item.value}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Manual Add Toggle */}
                                {!showManualAdd ? (
                                    <TouchableOpacity
                                        onPress={() => setShowManualAdd(true)}
                                        className="flex-row items-center justify-center bg-gray-800 py-2 rounded-lg mb-4"
                                    >
                                        <MaterialCommunityIcons name="plus" size={16} color="white" />
                                        <Text className="text-white ml-2 font-pmedium">Dodaj Ručno</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View className="bg-gray-800 p-3 rounded-lg mb-4">
                                        <Text className="text-white mb-2 font-psemibold">Ručno Dodaj Zaradu</Text>
                                        <ScrollView horizontal className="mb-2">
                                            {translators.map(t => (
                                                <TouchableOpacity
                                                    key={t.id}
                                                    onPress={() => setManualAddTranslator(t.id)}
                                                    className={`px-3 py-1 rounded-full mr-2 ${
                                                        manualAddTranslator === t.id ? 'bg-cyan-600' : 'bg-gray-700'
                                                    }`}
                                                >
                                                    <Text className="text-white text-sm font-pmedium">{t.username}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                        <View className="flex-row items-center bg-gray-700 rounded-lg px-3 mb-2">
                                            <TextInput
                                                className="flex-1 h-10 text-white font-pregular"
                                                placeholder="Iznos"
                                                placeholderTextColor="#9ca3af"
                                                keyboardType="numeric"
                                                value={manualAddAmount}
                                                onChangeText={setManualAddAmount}
                                            />
                                            <Text className="text-gray-400 font-pregular">$</Text>
                                        </View>
                                        <View className="flex-row gap-2">
                                            <TouchableOpacity onPress={addManualEarnings} className="flex-1 bg-cyan-600 py-2 rounded-lg">
                                                <Text className="text-white text-center font-psemibold">Dodaj</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setShowManualAdd(false)} className="flex-1 bg-gray-600 py-2 rounded-lg">
                                                <Text className="text-white text-center font-pmedium">Otkaži</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* Table header */}
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-white font-psemibold">Pregled Zarada</Text>
                                    <TouchableOpacity onPress={resetManualEdits} className="flex-row items-center">
                                        <MaterialCommunityIcons name="refresh" size={16} color="#9ca3af" />
                                        <Text className="text-gray-400 ml-1 font-pmedium">Resetuj</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-gray-400 text-xs mb-2 font-pregular">
                                    Fond: ${expectedTotal.toFixed(2)} | Trenutni zbir: ${totalEarnings.toFixed(2)}
                                    {Math.abs(totalEarnings - expectedTotal) > 0.01 && (
                                        <Text className="text-red-400"> (Razlika: ${(totalEarnings - expectedTotal).toFixed(2)})</Text>
                                    )}
                                </Text>

                                {/* Translator rows */}
                                {translators.map(t => (
                                    <View key={t.id} className="flex-row items-center bg-gray-800 rounded-lg p-3 mb-2">
                                        <View className="flex-1">
                                            <Text className="text-white font-pmedium">
                                                {t.username}
                                                {t.id === userData?._id && <Text className="text-gray-400 font-pregular"> (Vi)</Text>}
                                            </Text>
                                            <Text className="text-gray-400 text-xs font-pregular">{t.brojPrevoda} epizoda</Text>
                                        </View>
                                        <View className="flex-row items-center bg-gray-700 rounded px-2 w-24">
                                            <TextInput
                                                className="flex-1 h-8 text-white text-right font-pregular"
                                                keyboardType="numeric"
                                                value={t.earned.toFixed(2)}
                                                onChangeText={(val) => handleManualEdit(t.id, parseFloat(val) || 0)}
                                            />
                                            <Text className="text-gray-400 font-pregular">$</Text>
                                        </View>
                                        <View className="flex-row ml-2 gap-1">
                                            <TouchableOpacity
                                                onPress={() => distributeToOthers(t.id)}
                                                disabled={t.earned <= 0}
                                                className="p-1"
                                            >
                                                <MaterialCommunityIcons
                                                    name="share-variant"
                                                    size={16}
                                                    color={t.earned <= 0 ? '#4b5563' : '#60a5fa'}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => removeEarnings(t.id)}
                                                disabled={t.earned <= 0}
                                                className="p-1"
                                            >
                                                <MaterialCommunityIcons
                                                    name="delete"
                                                    size={16}
                                                    color={t.earned <= 0 ? '#4b5563' : '#ef4444'}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        {editedEarnings[t.id] && (
                                            <Text className="text-yellow-400 text-xs ml-1 font-pregular">Izmenjeno</Text>
                                        )}
                                    </View>
                                ))}

                                {/* Totals */}
                                <View className="bg-gray-800 rounded-lg p-3 mt-4">
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-300 font-pregular">Ukupno Epizoda:</Text>
                                        <Text className="text-white font-pmedium">{earningsData?.ukupnoEpizoda}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-300 font-pregular">Fond za Nagrade:</Text>
                                        <Text className="text-white font-pmedium">${expectedTotal.toFixed(2)}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-300 font-pregular">Trenutni Zbir:</Text>
                                        <Text className={`font-pbold ${Math.abs(totalEarnings - expectedTotal) > 0.01 ? 'text-red-400' : 'text-green-400'}`}>
                                            ${totalEarnings.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                {Math.abs(totalEarnings - expectedTotal) > 0.01 && (
                                    <View className="flex-row items-center bg-red-900/30 rounded-lg p-2 mt-3">
                                        <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
                                        <Text className="text-red-400 ml-2 text-xs font-pregular flex-1">
                                            Zbir zarada se ne poklapa sa fondom!
                                        </Text>
                                    </View>
                                )}

                                <View className="flex-row justify-between mt-4">
                                    <TouchableOpacity onPress={() => setShowPreview(false)} className="bg-gray-700 py-3 px-6 rounded-lg">
                                        <Text className="text-white font-pmedium">Nazad</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={confirmAndDistribute}
                                        disabled={loading || Math.abs(totalEarnings - expectedTotal) > 0.01}
                                        className={`py-3 px-6 rounded-lg ${
                                            loading || Math.abs(totalEarnings - expectedTotal) > 0.01 ? 'bg-gray-700' : 'bg-green-600'
                                        }`}
                                    >
                                        <Text className="text-white font-psemibold">
                                            {loading ? 'Potvrđujem...' : 'Potvrdi i Raspodeli'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ====== USER SEARCH MODAL (dark style) ====== */}
            <Modal visible={isUserSearchModalOpen} transparent animationType="fade" onRequestClose={closeUserSearchModal}>
                <View className="flex-1 justify-center items-center bg-black/70 p-4">
                    <View className="w-full h-[80%] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
                        <View className="flex-row justify-between items-center p-4 border-b border-gray-700">
                            <Text className="text-white text-lg font-pbold">Upravljanje korisnicima</Text>
                            <TouchableOpacity onPress={closeUserSearchModal}>
                                <MaterialCommunityIcons name="close" size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                        <View className="flex-row flex-1">
                            {/* Left side - user list */}
                            <View className="w-2/5 border-r border-gray-700 p-3">
                                <View className="flex-row items-center bg-gray-800 rounded-lg px-3 mb-3">
                                    <MaterialCommunityIcons name="magnify" size={18} color="#9ca3af" />
                                    <TextInput
                                        className="flex-1 h-10 text-white ml-2 font-pregular"
                                        placeholder="Pretraži..."
                                        placeholderTextColor="#6b7280"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                </View>
                                <FlatList
                                    data={users}
                                    keyExtractor={item => item._id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            onPress={() => selectUser(item._id)}
                                            className={`p-2 rounded-lg mb-1 ${
                                                selectedUserId === item._id ? 'bg-cyan-500/20 border border-cyan-400' : 'bg-gray-800'
                                            }`}
                                        >
                                            <Image source={{ uri: item.pfp }} className="w-8 h-8 rounded-full mb-1" />
                                            <Text className="text-white text-sm font-psemibold" numberOfLines={1}>{item.username}</Text>
                                            <Text className="text-gray-400 text-xs font-pregular" numberOfLines={1}>{item.email}</Text>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        loadingUsers ? (
                                            <ActivityIndicator color="#06b6d4" className="mt-4" />
                                        ) : (
                                            <Text className="text-gray-400 text-center mt-4 font-pregular">Nema rezultata</Text>
                                        )
                                    }
                                />
                            </View>
                            {/* Right side - user details */}
                            <View className="flex-1 p-3">
                                {!selectedUser ? (
                                    <Text className="text-gray-400 text-center mt-10 font-pregular">Izaberite korisnika</Text>
                                ) : (
                                    <ScrollView>
                                        <View className="items-center mb-4">
                                            <Image source={{ uri: selectedUser.pfp }} className="w-16 h-16 rounded-full" />
                                            <Text className="text-white text-lg font-pbold mt-2">{selectedUser.username}</Text>
                                            <Text className="text-gray-400 font-pregular">{selectedUser.email}</Text>
                                            <Text className="text-gray-400 font-pregular">Discord ID: {selectedUser.discordId || 'Nema'}</Text>
                                            <View className="flex-row flex-wrap mt-2">
                                                {selectedUser.roles?.map(role => (
                                                    <View key={role} className="bg-gray-700 rounded-full px-2 py-1 mr-1 mb-1">
                                                        <Text className="text-white text-xs font-pmedium">{role}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                        <Text className="text-white font-psemibold mb-2">Dodaj role</Text>
                                        <View className="flex-row flex-wrap">
                                            {['VIP', 'Donator', 'OG', 'Premium'].map(role => (
                                                <TouchableOpacity
                                                    key={role}
                                                    onPress={() => toggleRole(role)}
                                                    className={`px-3 py-1 rounded-full mr-2 mb-2 ${
                                                        newRoles.includes(role) ? 'bg-cyan-600' : 'bg-gray-700'
                                                    }`}
                                                >
                                                    <Text className="text-white text-sm font-pmedium">{role}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <View className="flex-row items-center mt-2">
                                            <TextInput
                                                className="flex-1 bg-gray-800 h-10 rounded-lg px-3 text-white font-pregular"
                                                placeholder="Custom rola"
                                                placeholderTextColor="#6b7280"
                                                value={customRoleInput}
                                                onChangeText={setCustomRoleInput}
                                            />
                                            <TouchableOpacity onPress={addCustomRole} className="ml-2 bg-cyan-600 p-2 rounded-lg">
                                                <MaterialCommunityIcons name="plus" size={20} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                        {newRoles.length > 0 && (
                                            <View className="mt-2">
                                                <Text className="text-gray-400 text-xs mb-1 font-pregular">Role za dodavanje:</Text>
                                                <View className="flex-row flex-wrap">
                                                    {newRoles.map(role => (
                                                        <View key={role} className="flex-row items-center bg-cyan-500/20 rounded-full px-2 py-1 mr-1 mb-1">
                                                            <Text className="text-cyan-400 text-xs font-pmedium">{role}</Text>
                                                            <TouchableOpacity onPress={() => removeNewRole(role)} className="ml-1">
                                                                <MaterialCommunityIcons name="close" size={12} color="#f87171" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                        {saveError && (
                                            <View className="flex-row items-center mt-2">
                                                <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
                                                <Text className="text-red-400 ml-1 text-xs font-pregular">{saveError}</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            onPress={saveUserRoles}
                                            disabled={savingRoles || newRoles.length === 0}
                                            className={`mt-4 py-2 rounded-lg ${
                                                savingRoles || newRoles.length === 0 ? 'bg-gray-700' : 'bg-green-600'
                                            }`}
                                        >
                                            <Text className="text-white text-center font-psemibold">
                                                {savingRoles ? 'Čuvanje...' : 'Sačuvaj role'}
                                            </Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

export default DeveloperProfile;