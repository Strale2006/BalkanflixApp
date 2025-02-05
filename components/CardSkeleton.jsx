import React from 'react';
import { View, ActivityIndicator } from 'react-native';

const CardSkeleton = () => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#E50914" />
        </View>
    );
};

const styles = {
    container: {
        aspectRatio: 0.7,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    }
};

export default CardSkeleton;