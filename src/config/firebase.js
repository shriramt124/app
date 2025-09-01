import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNmhIwy0ekGAcovomIHwo76WpzTidhRM4",
  authDomain: "stock-maintenance-app.firebaseapp.com",
  projectId: "stock-maintenance-app",
  storageBucket: "stock-maintenance-app.firebasestorage.app",
  messagingSenderId: "666062081284",
  appId: "1:666062081284:web:0cc21e164098352d729451",
  // Add your web client ID here (get this from Firebase Console > Authentication > Sign-in method > Google)
  webClientId: "666062081284-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"
};

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get Firebase instances
const db = firestore();

export { firebase, auth, db };