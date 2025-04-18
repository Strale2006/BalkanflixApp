// import statusCodes along with GoogleSignin
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
  

  // Somewhere in your code
export const GoogleLogin = async () => {
try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    console.log("User Infooooooooooooo: ", response.data.user)

    const user = response.data.user;
    const { id, name, email, photo } = user;

    // Send the user info to your backend
    const result = await axios.post('https://balkanflix-server.up.railway.app/api/auth/google', {
        _id: id,
        username: name,
        email,
        pfp: photo,
        isVerified: true,
      });
  
      if (result.status === 200) {
        console.log("User authenticated and saved/updated in DB");
        
    }

    if (isSuccessResponse(response)) {
    setState({ userInfo: response.data });
    } else {
    // sign in was cancelled by user
    }
} catch (error) {
    if (isErrorWithCode(error)) {
    switch (error.code) {
        case statusCodes.IN_PROGRESS:
        // operation (eg. sign in) already in progress
        break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        // Android only, play services not available or outdated
        break;
        default:
        // some other error happened
    }
    } else {
    // an error that's not related to google sign in occurred
    }
}
};