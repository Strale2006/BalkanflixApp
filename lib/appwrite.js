import { Client, Account, ID, Avatars } from 'react-native-appwrite';

export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.bfx.aora',
    projectId: '678bb5e800279645aa05',
    databaseId: '678bb7bd001ad9297729',
    userCollectionId: '678bb7d80021a39cb8d2',
    videoCollectionId: '678bb7fe0020eb76b4fa',
    storageId: '678bb9090020e55747f6'
}

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint) // Your Appwrite Endpoint
    .setProject(appwriteConfig.projectId) // Your project ID
    .setPlatform(appwriteConfig.platform) // Your application ID or bundle ID.
;

const account = new Account(client);
const avatars = new Avatars(client)

export const createUser  = async (email, password, username) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, username);
        if(!newAccount) throw new Error;
        const avatarUrl = avatars.getInitials(username);

        await signIn()
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
}
export async function signIn(email, password) {

}