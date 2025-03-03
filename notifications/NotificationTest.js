import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, schedulePushNotification, testPushNotification } from './PushNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationTest() {
  const [pushToken, setPushToken] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`[${timestamp}] ${message}`, ...prevLogs]);
    console.log(message);
  };

  useEffect(() => {
    checkNotificationStatus();
    getStoredToken();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationStatus(status);
      addLog(`Notification permission status: ${status}`);
    } catch (error) {
      addLog(`Error checking notification status: ${error.message}`);
    }
  };

  const getStoredToken = async () => {
    try {
      const token = await AsyncStorage.getItem('pushToken');
      if (token) {
        setPushToken(token);
        addLog(`Retrieved stored token: ${token}`);
      } else {
        addLog('No push token found in storage');
      }
    } catch (error) {
      addLog(`Error retrieving token: ${error.message}`);
    }
  };

  const requestPermissions = async () => {
    try {
      addLog('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationStatus(status);
      addLog(`New permission status: ${status}`);
      
      if (status === 'granted') {
        generateToken();
      } else {
        addLog('Permission not granted');
      }
    } catch (error) {
      addLog(`Error requesting permissions: ${error.message}`);
    }
  };

  const generateToken = async () => {
    try {
      addLog('Generating new push token...');
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        addLog(`New token generated: ${token}`);
      } else {
        addLog('Failed to generate token');
      }
    } catch (error) {
      addLog(`Error generating token: ${error.message}`);
    }
  };

  const sendLocalNotification = async () => {
    try {
      addLog('Sending local notification...');
      const notificationId = await schedulePushNotification(
        'Test Local Notification',
        'This is a test notification sent locally',
        { testData: 'test' }
      );
      addLog(`Local notification sent with ID: ${notificationId}`);
    } catch (error) {
      addLog(`Error sending local notification: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const checkDeviceInfo = async () => {
    try {
      const isDevice = await Notifications.isDevicePushTokenRegisteredAsync();
      addLog(`Is device registered for push: ${isDevice}`);
      
      // Check notification channels on Android
      if (Platform.OS === 'android') {
        const channels = await Notifications.getNotificationChannelsAsync();
        addLog(`Notification channels: ${JSON.stringify(channels.map(c => c.id))}`);
      }
    } catch (error) {
      addLog(`Error checking device info: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notification Test</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Permission Status:</Text>
        <Text style={styles.value}>{notificationStatus || 'Unknown'}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Push Token:</Text>
        <Text style={styles.value} numberOfLines={2} ellipsizeMode="middle">
          {pushToken || 'No token available'}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="Request Permissions" onPress={requestPermissions} />
        <Button title="Generate Token" onPress={generateToken} />
        <Button title="Send Local Notification" onPress={sendLocalNotification} />
        <Button title="Check Device Info" onPress={checkDeviceInfo} />
        <Button title="Clear Logs" onPress={clearLogs} />
      </View>
      
      <Text style={styles.logsTitle}>Logs:</Text>
      <ScrollView style={styles.logs}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    width: 120,
  },
  value: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 8,
  },
  logsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logs: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 4,
  },
  logText: {
    fontSize: 12,
    marginBottom: 4,
  },
}); 