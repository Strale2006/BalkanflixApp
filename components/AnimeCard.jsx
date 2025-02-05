import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';

const MovieCard = ({ item }) => {
    return (
        <TouchableOpacity onPress={() => {/* navigation logic */}}>
            <ImageBackground
                source={{ uri: `https://raw.githubusercontent.com/Strale2006/SlikeStranice/main/${item.img}` }}
                style={styles.card}
                imageStyle={styles.image}
            >
                <Text style={styles.title}>{item.title}</Text>
            </ImageBackground>
        </TouchableOpacity>
    );
};

const styles = {
    card: {
        aspectRatio: 0.7,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        resizeMode: 'cover',
    },
    title: {
        color: 'white',
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
    }
};

export default MovieCard;