import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_PREFIX = 'reminder-';

// Poruke...
const TWO_DAY_TITLES = [
    'Nedostaješ Balkanflix zajednici 🔥',
    'Hej, gde si nestao? Nove epizode su izašle.',
    'Tvoje omiljene serije te čekaju!',
];
const TWO_DAY_BODIES = [
    'Pogledaj šta smo novo spremili za tebe!',
    'Vrati se i nastavi gledanje.',
    'Nove epizode su već tu.',
];

const FIVE_DAY_TITLES = [
    'Pogledaj šta je novo ove nedelje',
    'Imaš mnogo toga da nadoknadiš! 🎉',
    'Nova sezona, novi početak!',
];
const FIVE_DAY_BODIES = [
    'Vikend je stigao – opusti se uz omiljenu seriju.',
    'Spremili smo ti pregršt novih epizoda.',
    'Vreme je za maraton!',
];

const FRIDAY_TITLES = [
    'Vikend je pravo vreme za novu epizodu! 🎬',
    'Petak veče = Balkanflix vreme 🍿',
    'Spreman za vikend maraton?',
];
const FRIDAY_BODIES = [
    'Otkrij najnovije epizode na Balkanflix‑u.',
    'Pogledaj šta smo dodali ove nedelje.',
    'Vikend je – opusti se i uživaj.',
];

const MONDAY_TITLES = [
    'Nova nedelja, nove epizode! ☀️',
    'Ponedeljak je – započni dan uz Balkanflix.',
];
const MONDAY_BODIES = [
    'Šta smo novo objavili za tebe?',
    'Vikend je možda prošao, ali nove epizode su tu.',
];

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function cancelAllReminders() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(n => n.identifier.startsWith(REMINDER_PREFIX));
    for (const notif of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
    console.log(`Cancelled ${toCancel.length} old reminder(s).`);
}

async function scheduleAtDate(identifier, title, body, date) {
    await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
            title,
            body,
            data: { type: 'reminder' },
        },
        trigger: { date },
    });
}

export async function scheduleReminderNotifications() {
    try {
        // 1. Osiguraj dozvolu
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            if (newStatus !== 'granted') {
                console.log('Notification permissions not granted – skipping reminders');
                return;
            }
        }

        // 2. Ne zakazuj češće od jednom na sat
        const lastScheduleStr = await AsyncStorage.getItem('lastReminderSchedule');
        const now = new Date();
        if (lastScheduleStr) {
            const lastSchedule = new Date(lastScheduleStr);
            const hoursSince = (now - lastSchedule) / (1000 * 60 * 60);
            if (hoursSince < 1) {
                console.log('⏳ Reminders were scheduled less than 1 hour ago – skipping');
                return;
            }
        }

        // 3. Obriši sve već isporučene notifikacije (da ne izlaze pri svakom otvaranju)
        await Notifications.dismissAllNotificationsAsync();

        // 4. Otkaži stare zakazane i kreiraj nove
        await cancelAllReminders();

        // 2 dana
        const twoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        await scheduleAtDate(
            `${REMINDER_PREFIX}2days`,
            randomElement(TWO_DAY_TITLES),
            randomElement(TWO_DAY_BODIES),
            twoDays
        );

        // 5 dana
        const fiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
        await scheduleAtDate(
            `${REMINDER_PREFIX}5days`,
            randomElement(FIVE_DAY_TITLES),
            randomElement(FIVE_DAY_BODIES),
            fiveDays
        );

        // Svaki petak u 20:00
        await Notifications.scheduleNotificationAsync({
            identifier: `${REMINDER_PREFIX}friday`,
            content: {
                title: randomElement(FRIDAY_TITLES),
                body: randomElement(FRIDAY_BODIES),
                data: { type: 'reminder', url: '/sign-in' },
            },
            trigger: {
                weekday: 5,
                hour: 20,
                minute: 0,
                repeats: true,
            },
        });

        // Svaki ponedeljak u 9:00
        await Notifications.scheduleNotificationAsync({
            identifier: `${REMINDER_PREFIX}monday`,
            content: {
                title: randomElement(MONDAY_TITLES),
                body: randomElement(MONDAY_BODIES),
                data: { type: 'reminder', url: '/sign-in' },
            },
            trigger: {
                weekday: 1,
                hour: 9,
                minute: 0,
                repeats: true,
            },
        });

        await AsyncStorage.setItem('lastReminderSchedule', now.toISOString());
        console.log('Randomized reminder notifications successfully scheduled.');
    } catch (error) {
        console.error('Failed to schedule reminders:', error);
    }
}