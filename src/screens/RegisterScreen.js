import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '666062081284-gra8sgmg1em9uuletstafh2hr4snlshv.apps.googleusercontent.com', // From Firebase Console
    });
  }, []);

  const handleRegister = async () => {
    if (name === '' || email === '' || password === '' || confirmPassword === '') {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      // Create user with email and password
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Check if this is the first user (make them admin)
      const usersSnapshot = await firestore().collection('users').get();
      const isFirstUser = usersSnapshot.empty;
      
      // Add user details to Firestore
      await firestore().collection('users').doc(user.uid).set({
        name,
        email,
        role: isFirstUser ? 'admin' : 'user', // First user becomes admin
        createdAt: new Date().toISOString(),
      });
      
      Alert.alert('Success', 'Account created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.replace('Home'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;
      
      // Check if user document exists, if not create one
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Check if this is the first user (make them admin)
        const usersSnapshot = await firestore().collection('users').get();
        const isFirstUser = usersSnapshot.empty;
        
        await firestore().collection('users').doc(user.uid).set({
          name: user.displayName || '',
          email: user.email,
          photoURL: user.photoURL || '',
          provider: 'google',
          role: isFirstUser ? 'admin' : 'user', // First user becomes admin
          createdAt: new Date().toISOString(),
        });
      }
      
      Alert.alert('Success', 'Account created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.replace('Home'),
        },
      ]);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Info', 'Sign in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Info', 'Sign in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play services not available');
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register to manage your stock</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              <Icon name="google" size={20} color="#4285F4" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  button: {
    backgroundColor: '#4a80f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#4a80f5',
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RegisterScreen;