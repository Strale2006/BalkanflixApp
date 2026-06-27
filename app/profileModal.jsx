// app/modal.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Image, ScrollView,
    TextInput, Dimensions, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import { useGlobalContext } from '../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const imageLists = {
    banner: [
        'https://images.balkanflix.com/Banner1.webp',
        'https://images.balkanflix.com/Banner2.webp',
        'https://images.balkanflix.com/Banner3.webp',
        'https://images.balkanflix.com/Banner4.webp',
        'https://images.balkanflix.com/Banner5.webp',
    ],
    pfp: {
        Naruto: [
            'https://images.balkanflix.com/narutopfp1.webp',
            'https://images.balkanflix.com/narutopfp2.webp',
            'https://images.balkanflix.com/narutopfp3.webp',
            'https://images.balkanflix.com/narutopfp4.webp',
            'https://images.balkanflix.com/narutopfp5.jpg',
            'https://images.balkanflix.com/narutopfp6.jpg',
            'https://images.balkanflix.com/narutopfp7.jpg',
            'https://images.balkanflix.com/narutopfp8.jpg',
            'https://images.balkanflix.com/narutopfp9.jpg',
            'https://images.balkanflix.com/narutopfp10.jpg',
            'https://images.balkanflix.com/narutopfp11.jpg',
            'https://images.balkanflix.com/narutopfp12.jpg',
            'https://images.balkanflix.com/narutopfp13.jpg',
            'https://images.balkanflix.com/narutopfp14.jpg',
            'https://images.balkanflix.com/narutopfp15.jpg',
            'https://images.balkanflix.com/narutopfp16.jpg',
            'https://images.balkanflix.com/narutopfp17.jpg',
            'https://images.balkanflix.com/narutopfp18.jpg',
            'https://images.balkanflix.com/narutopfp19.jpg',
            'https://images.balkanflix.com/narutopfp20.jpg',
            'https://images.balkanflix.com/narutopfp21.jpg',
            'https://images.balkanflix.com/narutopfp22.jpg',
            'https://images.balkanflix.com/narutopfp23.jpg',
            'https://images.balkanflix.com/narutopfp24.jpg',
            'https://images.balkanflix.com/narutopfp25.jpg',
            'https://images.balkanflix.com/narutopfp26.jpg',
            'https://images.balkanflix.com/narutopfp27.jpg',
        ],
        BlueLock: [
            'https://images.balkanflix.com/blpfp1.jpg',
            'https://images.balkanflix.com/blpfp2.jpg',
            'https://images.balkanflix.com/blpfp3.jpg',
            'https://images.balkanflix.com/blpfp4.jpg',
            'https://images.balkanflix.com/blpfp5.jpg',
            'https://images.balkanflix.com/blpfp6.jpg',
            'https://images.balkanflix.com/blpfp7.jpg',
            'https://images.balkanflix.com/blpfp8.jpg',
            'https://images.balkanflix.com/blpfp9.jpg',
            'https://images.balkanflix.com/blpfp10.jpg',
            'https://images.balkanflix.com/blpfp11.jpg',
            'https://images.balkanflix.com/blpfp12.jpg',
            'https://images.balkanflix.com/blpfp13.jpg',
        ],
        JJK: [
            'https://images.balkanflix.com/jjpfp1.jpg',
            'https://images.balkanflix.com/jjpfp2.jpg',
            'https://images.balkanflix.com/jjpfp3.jpg',
            'https://images.balkanflix.com/jjpfp4.jpg',
            'https://images.balkanflix.com/jjpfp5.jpg',
            'https://images.balkanflix.com/jjpfp6.jpg',
        ],
        DragonBall: [
            'https://images.balkanflix.com/dbpfp1.jpg',
            'https://images.balkanflix.com/dbpfp2.jpg',
            'https://images.balkanflix.com/dbpfp3.jpg',
            'https://images.balkanflix.com/dbpfp4.jpg',
            'https://images.balkanflix.com/dbpfp5.jpg',
            'https://images.balkanflix.com/dbpfp6.jpg',
            'https://images.balkanflix.com/dbpfp7.jpg',
            'https://images.balkanflix.com/dbpfp8.jpg',
            'https://images.balkanflix.com/dbpfp9.jpg',
            'https://images.balkanflix.com/dbpfp10.jpg',
            'https://images.balkanflix.com/dbpfp11.jpg',
            'https://images.balkanflix.com/dbpfp12.jpg',
            'https://images.balkanflix.com/dbpfp13.jpg',
            'https://images.balkanflix.com/dbpfp14.jpg',
            'https://images.balkanflix.com/dbpfp15.jpg',
            'https://images.balkanflix.com/dbpfp16.jpg',
            'https://images.balkanflix.com/dbpfp17.webp',
            'https://images.balkanflix.com/dbpfp18.jpg',
        ],
        Jojo: [
            'https://images.balkanflix.com/jojopfp1.webp',
            'https://images.balkanflix.com/jojopfp2.webp',
            'https://images.balkanflix.com/jojopfp3.webp',
        ],
        OnePiece: [
            'https://images.balkanflix.com/onepiecepfp1.webp',
            'https://images.balkanflix.com/onepiecepfp2.webp',
            'https://images.balkanflix.com/onepiecepfp3.webp',
        ],
        Bleach: ['https://images.balkanflix.com/bleachpfp1.webp'],
        Berserk: [
            'https://images.balkanflix.com/berserkpfp1.webp',
            'https://images.balkanflix.com/berserkpfp2.webp',
        ],
        Ostalo: [
            'https://images.balkanflix.com/yugiohpfp1.webp',
            'https://images.balkanflix.com/hogurashipfp1.webp',
            'https://images.balkanflix.com/kakeguruipfp1.webp',
            'https://images.balkanflix.com/blackcloverpfp1.webp',
        ],
    },
};

const COLUMNS = 4;
const GAP = 10;
const PFP_SIZE = (width - 32 - GAP * (COLUMNS - 1)) / COLUMNS;

// Grupiše niz u redove od N
const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

const SectionLabel = ({ title }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: '#E50914' }} />
        <Text style={{ fontSize: 13, fontFamily: 'Poppins-Bold', color: '#f1f5f9' }}>{title}</Text>
    </View>
);

export const ChangeInfoForm = () => {
    const { token, setUser, user } = useGlobalContext();

    const [pfp, setPfp]                                 = useState(user?.pfp || null);
    const [newPfp, setNewPfp]                           = useState(null);
    const [newUsername, setNewUsername]                 = useState('');
    const [newEmail, setNewEmail]                       = useState('');
    const [bannerIndex, setBannerIndex]                 = useState(0);
    const [selectedPfpCategory, setSelectedPfpCategory] = useState('JJK');
    const [pfpPickerOpen, setPfpPickerOpen]             = useState(false);
    const [saving, setSaving]                           = useState(false);

    const config = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    };

    useEffect(() => {
        if (user?.pfp) setPfp(user.pfp);
    }, [user?.pfp]);

    const fetchUser = useCallback(async () => {
        try {
            const { data } = await axios.get('https://balkanflix-server.up.railway.app/api/private', config);
            if (!newPfp) setPfp(data.pfp);
        } catch (err) {
            console.error('Server error', err);
        }
    }, [newPfp]);

    useEffect(() => { fetchUser(); }, [fetchUser]);

    const previewPfp = (url) => {
        setPfp(url);
        setNewPfp(url);
        setPfpPickerOpen(false);
    };

    const nextBanner = () => setBannerIndex(i => (i + 1) % imageLists.banner.length);
    const prevBanner = () => setBannerIndex(i => (i === 0 ? imageLists.banner.length - 1 : i - 1));

    const changeInfo = async () => {
        setSaving(true);
        const updateData = {};
        if (newUsername) updateData.newUsername = newUsername;
        if (newEmail)    updateData.newEmail    = newEmail;
        updateData.newBanner = imageLists.banner[bannerIndex];
        if (newPfp)      updateData.newPfp      = newPfp;

        try {
            const response = await axios.put(
                'https://balkanflix-server.up.railway.app/api/auth/updateProfile',
                updateData,
                config
            );
            if (response.data?.user) {
                setUser(response.data.user);
                await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
            }
            setNewUsername('');
            setNewEmail('');
            setNewPfp(null);
            router.back();
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Greška: ' + (err.response?.data?.error || 'Server error'));
        } finally {
            setSaving(false);
        }
    };

    // ── PFP Picker ────────────────────────────────────────────────────────────
    if (pfpPickerOpen) {
        const rows = chunkArray(imageLists.pfp[selectedPfpCategory], COLUMNS);

        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#101420', alignItems: 'flex-start' }}>

                {/* Header */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.07)',
                    width: '100%',
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#E50914' }} />
                        <Text style={{ fontSize: 15, fontFamily: 'Poppins-Bold', color: '#f1f5f9' }}>
                            Izaberi profilnu sliku
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setPfpPickerOpen(false)}
                        activeOpacity={0.7}
                        style={{
                            width: 34, height: 34, borderRadius: 17,
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <Feather name="x" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

                {/* Kategorije */}
                <View style={{ width: '100%' }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            gap: 6,
                            paddingHorizontal: 16,
                            paddingTop: 0,
                            paddingBottom: 0,
                            alignItems: 'flex-start',
                        }}
                    >
                    {Object.keys(imageLists.pfp).map((cat) => {
                        const active = selectedPfpCategory === cat;
                        return (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedPfpCategory(cat)}
                                activeOpacity={0.75}
                                style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 7,
                                    borderRadius: 20,
                                    backgroundColor: active ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                                    borderWidth: 0.5,
                                    borderColor: active ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)',
                                }}
                            >
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        fontSize: 12,
                                        fontFamily: 'Poppins-SemiBold',
                                        color: active ? '#f87171' : '#64748b',
                                    }}
                                >
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    </ScrollView>
                </View>

                {/* Grid — ručni redovi, uvek levo poravnanje */}
                <View style={{ width: '100%' }}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 }}
                    >
                    {rows.map((row, rowIndex) => (
                        <View
                            key={rowIndex}
                            style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP, alignItems: 'flex-start' }}
                        >
                            {row.map((url, colIndex) => {
                                const isSelected = pfp === url;
                                return (
                                    <TouchableOpacity
                                        key={colIndex}
                                        onPress={() => previewPfp(url)}
                                        activeOpacity={0.8}
                                        style={{
                                            width: PFP_SIZE,
                                            height: PFP_SIZE,
                                            borderRadius: PFP_SIZE / 2,
                                            overflow: 'hidden',
                                            borderWidth: isSelected ? 2.5 : 0.5,
                                            borderColor: isSelected ? '#E50914' : 'rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        <Image
                                            source={{ uri: url }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                        {isSelected && (
                                            <View style={{
                                                position: 'absolute', inset: 0,
                                                backgroundColor: 'rgba(229,9,20,0.25)',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Feather name="check" size={18} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                    </ScrollView>
                </View>

            </SafeAreaView>
        );
    }

    // ── Glavni ekran ──────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#101420' }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Header */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.07)',
                    marginBottom: 4,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#E50914' }} />
                        <Text style={{ fontSize: 15, fontFamily: 'Poppins-Bold', color: '#f1f5f9' }}>Uredi profil</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                        style={{
                            width: 34, height: 34, borderRadius: 17,
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <Feather name="x" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

                {/* Banner */}
                <View style={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 24 }}>
                    <SectionLabel title="Banner" />
                    <View style={{
                        height: 140, borderRadius: 16, overflow: 'hidden',
                        borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)',
                    }}>
                        <Image
                            source={{ uri: imageLists.banner[bannerIndex] }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.5)']}
                            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 }}
                        />
                        <View style={{
                            position: 'absolute', inset: 0,
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingHorizontal: 12,
                        }}>
                            <TouchableOpacity
                                onPress={prevBanner}
                                activeOpacity={0.8}
                                style={{
                                    width: 36, height: 36, borderRadius: 18,
                                    backgroundColor: 'rgba(0,0,0,0.55)',
                                    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <Feather name="chevron-left" size={18} color="#fff" />
                            </TouchableOpacity>

                            <View style={{ flexDirection: 'row', gap: 5 }}>
                                {imageLists.banner.map((_, i) => (
                                    <TouchableOpacity key={i} onPress={() => setBannerIndex(i)}>
                                        <View style={{
                                            width: i === bannerIndex ? 18 : 6,
                                            height: 6, borderRadius: 3,
                                            backgroundColor: i === bannerIndex ? '#E50914' : 'rgba(255,255,255,0.35)',
                                        }} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                onPress={nextBanner}
                                activeOpacity={0.8}
                                style={{
                                    width: 36, height: 36, borderRadius: 18,
                                    backgroundColor: 'rgba(0,0,0,0.55)',
                                    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <Feather name="chevron-right" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Profilna slika */}
                <View style={{ paddingHorizontal: 16, marginBottom: 28 }}>
                    <SectionLabel title="Profilna slika" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <TouchableOpacity
                            onPress={() => setPfpPickerOpen(true)}
                            activeOpacity={0.85}
                            style={{ position: 'relative' }}
                        >
                            <View style={{
                                width: 80, height: 80, borderRadius: 40,
                                overflow: 'hidden',
                                borderWidth: 2.5, borderColor: '#E50914',
                                shadowColor: '#E50914', shadowOpacity: 0.3, shadowRadius: 10,
                            }}>
                                {pfp
                                    ? <Image source={{ uri: pfp }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                    : <View style={{ flex: 1, backgroundColor: '#0d1117', alignItems: 'center', justifyContent: 'center' }}>
                                        <MaterialIcons name="person" size={32} color="#334155" />
                                    </View>
                                }
                            </View>
                            <View style={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: 26, height: 26, borderRadius: 13,
                                backgroundColor: '#E50914',
                                borderWidth: 2, borderColor: '#101420',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Feather name="edit-2" size={11} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontFamily: 'Poppins-SemiBold', color: '#f1f5f9', marginBottom: 2 }}>
                                {user?.username}
                            </Text>
                            <Text style={{ fontSize: 12, fontFamily: 'Poppins-Regular', color: '#475569', marginBottom: 10 }}>
                                {newPfp ? 'Nova slika izabrana ✓' : 'Klikni na sliku za izmenu'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setPfpPickerOpen(true)}
                                activeOpacity={0.8}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 6,
                                    alignSelf: 'flex-start',
                                    paddingHorizontal: 12, paddingVertical: 7,
                                    borderRadius: 20,
                                    backgroundColor: 'rgba(239,68,68,0.11)',
                                    borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.25)',
                                }}
                            >
                                <Feather name="image" size={12} color="#f87171" />
                                <Text style={{ fontSize: 12, fontFamily: 'Poppins-SemiBold', color: '#f87171' }}>
                                    Izaberi sliku
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Korisničko ime */}
                <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                    <SectionLabel title="Korisničko ime" />
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6,
                    }}>
                        <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#334155', marginBottom: 2, marginTop: 6 }}>
                            Trenutno: <Text style={{ color: '#64748b' }}>{user?.username}</Text>
                        </Text>
                        <TextInput
                            value={newUsername}
                            onChangeText={setNewUsername}
                            placeholder="Novo korisničko ime"
                            placeholderTextColor="#334155"
                            style={{
                                fontSize: 14, fontFamily: 'Poppins-Regular',
                                color: '#f1f5f9', paddingVertical: 8,
                                borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.06)',
                                marginTop: 4,
                            }}
                        />
                    </View>
                </View>

                {/* Email */}
                <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
                    <SectionLabel title="Email" />
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6,
                    }}>
                        <Text style={{ fontSize: 11, fontFamily: 'Poppins-Regular', color: '#334155', marginBottom: 2, marginTop: 6 }}>
                            Trenutno: <Text style={{ color: '#64748b' }}>{user?.email}</Text>
                        </Text>
                        <TextInput
                            value={newEmail}
                            onChangeText={setNewEmail}
                            placeholder="Novi email"
                            placeholderTextColor="#334155"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={{
                                fontSize: 14, fontFamily: 'Poppins-Regular',
                                color: '#f1f5f9', paddingVertical: 8,
                                borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.06)',
                                marginTop: 4,
                            }}
                        />
                    </View>
                </View>

                {/* Dugmad */}
                <View style={{ paddingHorizontal: 16 }}>
                    <TouchableOpacity
                        onPress={changeInfo}
                        disabled={saving}
                        activeOpacity={0.85}
                        style={{
                            paddingVertical: 14, borderRadius: 14,
                            backgroundColor: '#E50914',
                            alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'row', gap: 8,
                            shadowColor: '#E50914', shadowOpacity: 0.35, shadowRadius: 12,
                            opacity: saving ? 0.7 : 1,
                        }}
                    >
                        {saving
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Feather name="check" size={15} color="#fff" />
                        }
                        <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: '#fff' }}>
                            {saving ? 'Čuvanje...' : 'Sačuvaj promene'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.75}
                        style={{
                            marginTop: 10, paddingVertical: 13, borderRadius: 14,
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#475569' }}>Otkaži</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default ChangeInfoForm;