import { Client, Account, ID, Avatars, Databases, Query } from 'react-native-appwrite';
// import apiClient from './apiClient';
// import AsyncStorage from '@react-native-async-storage/async-storage';


export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.balkanflix.app',
    projectId: '6634fe5f003caa952872',
    databaseId: '6634ff8f0015b74e49fc',
    collectionId: '6634ff980007def9f6f8',
    devCollectionId: '677faa88003d48e77d9f',
    userCollectionId: '678bb7d80021a39cb8d2',
    videoCollectionId: '678bb7fe0020eb76b4fa',
    storageId: '678bb9090020e55747f6'
}

// Init your React Native SDK
export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform)
;

const account = new Account(client);
const avatars = new Avatars(client)
export const databases = new Databases(client)

export const createUser  = async (email, password, username) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, username);
        if(!newAccount) throw new Error;
        const avatarUrl = avatars.getInitials(username);

        await signIn(email, password)

        const newUser = await databases.createDocument(
            appwriteConfig.databaseId, 
            appwriteConfig.userCollectionId, 
            ID.unique(),
            {
                accountId: newAccount.$id,
                email,
                username,
                avatar: avatarUrl
            }
        )   

        return newUser;
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
}

// export const registerUser = async (username, email, password) => {
//     try {
//       // Step 1: Register the user
//       const registrationResponse = await apiClient.post('/auth/register', {
//         username,
//         email,
//         password,
//       });
  
//       if (!registrationResponse.data.success) {
//         throw new Error('Registration failed');
//       }
  
//       // Step 2: Automatically log the user in
//       const loginResponse = await apiClient.post('/auth/login', {
//         email,
//         password,
//       });
  
//       const { token, user } = loginResponse.data;
  
//       // Step 3: Save the token locally
//       await AsyncStorage.setItem('authToken', token);
  
//       return { user, token }; // Return user data and token for further use
//     } catch (error) {
//       console.error('Error in registerUser:', error);
//       throw error.response?.data || error.message;
//     }
// };

// export const loginUser = async (email, password) => {
//     try {
//         const response = await apiClient.post('/auth/login', {
//             email,
//             password,
//         });

//         const { token, user } = response.data;

//         // Save the token locally
//         await AsyncStorage.setItem('authToken', token);

//         return { user, token };
//     } catch (error) {
//         console.error('Error in loginUser:', error);
//         throw error.response?.data || error.message;
//     }
// };

// export const logoutUser = async () => {
//     try {
//         // Step 1: Remove the auth token from AsyncStorage
//         await AsyncStorage.removeItem('authToken');

//         // Step 2: Clear user data in context (handled in GlobalProvider)
//     } catch (error) {
//         console.error('Error in logoutUser:', error);
//         throw error.message;
//     }
// };

// export const getUser = async (token) => {
//   try {
//     const response = await apiClient.get("/private", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return response.data;
//   } catch (error) {
//     console.error('Error fetching current user:', error.message || error);
//     throw error;
//   }
// };

export const signIn = async (email, password) => {
    try {
        const session = await account.createEmailSession(email, password);

        return session;
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();

        if(!currentAccount) throw new Error('No user found');

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0]
    } catch (error) {
        console.log(error);
    }
}

export const getAllPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.videoCollectionId
        )

        return posts.documents;
    } catch (error) {
        console.log(error);
    }
}

export const getLatestPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.videoCollectionId,
            [Query.orderDesc('$createdAt', Query.limit(7))]
        )

        return posts.documents;
    } catch (error) {
        console.log(error);
    }
}

export const searchPosts = async (query) => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.videoCollectionId,
            [Query.search('title', query)]
        )

        return posts.documents;
    } catch (error) {
        console.log(error);
    }
}

export const getUserPosts = async (userId) => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.videoCollectionId,
            [Query.equal('creator', userId)]
        )

        return posts.documents;
    } catch (error) {
        console.log(error);
    }
}

export const signOut = async () => {
    try {
        const session = await account.deleteSession('current');

        return session;
    } catch (error) {
        throw new Error(error)
    }
}

