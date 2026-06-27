import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Modal,
    FlatList,
    Alert,
    Dimensions,
    Image,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import ViewShot from 'react-native-view-shot';
import { logoSmall } from '../../constants/images';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------- Instagram Story Preview (identičan sajtu) ----------
const InstagramStoryPreview = React.forwardRef(
    ({ imageUrl, title, episode, translator }, ref) => (
        <ViewShot ref={ref} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
            <View style={previewStyles.container}>
                {/* Pozadinska slika */}
                <Image
                    source={{ uri: `https://images.balkanflix.com/${imageUrl}` }}
                    style={previewStyles.bgImage}
                    resizeMode="cover"
                />
                {/* Tamni overlay */}
                <View style={previewStyles.overlay} />

                {/* Glavni sadržaj */}
                <View style={previewStyles.content}>
                    {/* Logo gore levo */}
                    <Image source={logoSmall} style={previewStyles.logo} resizeMode="contain" />

                    {/* Donji deo: poster + informacije */}
                    <View style={previewStyles.bottom}>
                        {/* Poster u belom ramu */}
                        <Image
                            source={{ uri: `https://images.balkanflix.com/${imageUrl}` }}
                            style={previewStyles.poster}
                            resizeMode="cover"
                        />

                        {/* Naslov serije + play ikonica */}
                        <View style={previewStyles.titleRow}>
                            <MaterialCommunityIcons name="play-circle" size={36} color="#ef4444" />
                            <Text style={previewStyles.title} numberOfLines={2}>
                                {title}
                            </Text>
                        </View>

                        {/* Epizoda */}
                        <Text style={previewStyles.episode}>Epizoda {episode}</Text>

                        {/* Prevodilac (ako postoji) */}
                        {translator ? (
                            <View style={previewStyles.translatorRow}>
                                <MaterialCommunityIcons name="account" size={18} color="#ccc" />
                                <Text style={previewStyles.translator}>{translator}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>
        </ViewShot>
    )
);

const previewStyles = StyleSheet.create({
    container: {
        width: 500,
        height: 889, // 9:16
        backgroundColor: '#0a0a0a',
        overflow: 'hidden',
    },
    bgImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.75,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 30,
    },
    logo: {
        width: 150,
        height: 50,
    },
    bottom: {
        // sve je pri dnu
    },
    poster: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#ffffff',
        marginBottom: 15,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: {
        flex: 1,
        fontFamily: 'Poppins_700Bold',
        color: '#fff',
        fontSize: 22,
        marginLeft: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    episode: {
        fontFamily: 'Poppins_600SemiBold',
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
        marginLeft: 44, // poravnanje sa naslovom
    },
    translatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    translator: {
        fontFamily: 'Poppins_500Medium',
        color: '#ccc',
        fontSize: 14,
        marginLeft: 6,
    },
});

// ---------- Glavni ekran ----------
const StoryMakerScreen = () => {
    // State i funkcije su identične prethodnoj verziji
    const [seriesList, setSeriesList] = useState([]);
    const [formData, setFormData] = useState({
        selectedSeries: '',
        episode: '',
        translator: '',
        imageUrl: '',
        title: '',
    });
    const [generisanStory, setGenerisanStory] = useState(false);
    const [showSeriesPicker, setShowSeriesPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const storyRef = useRef(null);

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const { data } = await axios.get(
                    'https://balkanflix-server.up.railway.app/api/content/getTitlesForUploadEpisodes'
                );
                setSeriesList(data.series);
            } catch (error) {
                console.error('Error fetching series:', error);
                Alert.alert('Greška', 'Neuspešno učitavanje serijala.');
            }
        };
        fetchSeries();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'selectedSeries') {
                const selected = seriesList.find(s => s.title === value);
                if (selected) {
                    updated.imageUrl = selected.img;
                    updated.title = selected.title;
                }
            }
            return updated;
        });
    };

    const handleGenerate = () => {
        if (!formData.selectedSeries || !formData.episode) {
            Alert.alert('Greška', 'Serijal i epizoda su obavezni.');
            return;
        }
        setGenerisanStory(true);
    };

    const handleExport = async () => {
        if (!storyRef.current) return;
        try {
            const uri = await storyRef.current.capture();
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Podeli Instagram Story',
                });
            } else {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status === 'granted') {
                    await MediaLibrary.saveToLibraryAsync(uri);
                    Alert.alert('Uspeh', 'Slika sačuvana u galeriju!');
                } else {
                    Alert.alert('Greška', 'Nije dozvoljen pristup galeriji.');
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Greška', 'Neuspešan eksport.');
        }
    };

    const selectedSeriesTitle =
        seriesList.find(s => s.title === formData.selectedSeries)?.title || 'Odaberi serijal...';

    return (
        <SafeAreaView className="flex-1 bg-gray-950">
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header */}
                <View className="relative overflow-hidden bg-gray-900 pb-6 pt-8 px-5 border-b border-gray-800">
                    <View className="absolute inset-0">
                        <View className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
                        <View className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
                    </View>
                    <View className="items-center">
                        <MaterialCommunityIcons name="instagram" size={44} color="#e1306c" />
                        <Text className="text-white text-2xl font-pbold mt-2">Instagram Story Generator</Text>
                        <Text className="text-gray-400 text-sm font-pregular mt-1 text-center">
                            Kreiraj privlačan Instagram Story za Balkanflix
                        </Text>
                    </View>
                </View>

                <View className="p-4 space-y-6">
                    {/* Form Card */}
                    <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-5 border border-gray-700">
                        <Text className="text-white text-lg font-psemibold mb-4">Podaci za story</Text>

                        <Text className="text-gray-300 font-pmedium text-sm mb-1">Serijal</Text>
                        <TouchableOpacity
                            onPress={() => setShowSeriesPicker(true)}
                            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 flex-row justify-between items-center mb-4"
                        >
                            <Text className="text-white font-pregular" numberOfLines={1}>
                                {selectedSeriesTitle}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#9ca3af" />
                        </TouchableOpacity>

                        <View className="flex-row gap-3 mb-4">
                            <View className="flex-1">
                                <Text className="text-gray-300 font-pmedium text-sm mb-1">Epizoda</Text>
                                <TextInput
                                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-pregular"
                                    keyboardType="numeric"
                                    value={formData.episode}
                                    onChangeText={val => handleInputChange('episode', val)}
                                    placeholder="npr. 5"
                                    placeholderTextColor="#6b7280"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-300 font-pmedium text-sm mb-1">Prevodilac</Text>
                                <TextInput
                                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-pregular"
                                    value={formData.translator}
                                    onChangeText={val => handleInputChange('translator', val)}
                                    placeholder="Ime prevodioca"
                                    placeholderTextColor="#6b7280"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleGenerate}
                            className="bg-indigo-600 py-3 rounded-xl items-center mb-3"
                        >
                            <Text className="text-white font-psemibold">Generiši Story</Text>
                        </TouchableOpacity>
                        {generisanStory && (
                            <TouchableOpacity
                                onPress={handleExport}
                                className="bg-pink-600 py-3 rounded-xl items-center"
                            >
                                <Text className="text-white font-psemibold">Sačuvaj / Podeli</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Preview */}
                    {generisanStory && (
                        <View className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-5 border border-gray-700">
                            <Text className="text-white text-lg font-psemibold mb-4">Pregled</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <InstagramStoryPreview
                                    ref={storyRef}
                                    imageUrl={formData.imageUrl}
                                    title={formData.title || formData.selectedSeries}
                                    episode={formData.episode}
                                    translator={formData.translator}
                                />
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modal za izbor serijala */}
            <Modal visible={showSeriesPicker} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/70 p-4">
                    <View className="w-4/5 max-h-96 bg-gray-900 rounded-2xl p-4 border border-gray-700">
                        <Text className="text-white text-lg font-pbold mb-3 text-center">Izaberi serijal</Text>
                        <FlatList
                            data={seriesList}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        handleInputChange('selectedSeries', item.title);
                                        setShowSeriesPicker(false);
                                    }}
                                    className={`p-3 rounded-lg mb-1 ${
                                        formData.selectedSeries === item.title
                                            ? 'bg-indigo-600/20 border border-indigo-400'
                                            : 'bg-gray-800'
                                    }`}
                                >
                                    <Text className="text-white font-pmedium">{item.title}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text className="text-gray-400 text-center mt-4 font-pregular">Nema serijala</Text>
                            }
                        />
                        <TouchableOpacity onPress={() => setShowSeriesPicker(false)} className="mt-3 py-2">
                            <Text className="text-gray-400 text-center font-pmedium">Zatvori</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default StoryMakerScreen;