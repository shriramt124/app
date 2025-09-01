
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createInitialAdmin } from '../services/firebaseService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginType, setLoginType] = useState('user'); // 'admin' or 'user'

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '666062081284-gra8sgmg1em9uuletstafh2hr4snlshv.apps.googleusercontent.com',
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });

    // Setup admin on app start
    setupAdminIfNeeded();
  }, []);

  const setupAdminIfNeeded = async () => {
    try {
      await createInitialAdmin();
    } catch (error) {
      console.log('Admin setup check failed:', error);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword('shriramt.124@gmail.com', '198118113Ram@');
      const user = userCredential.user;
      
      // Check if user exists in firestore and is admin
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
        // If admin doesn't exist in firestore, create the document
        await firestore().collection('users').doc(user.uid).set({
          uid: user.uid,
          name: 'Administrator',
          displayName: 'Administrator',
          email: 'shriramt.124@gmail.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
          isInitialAdmin: true,
        });
      }
      
      navigation.replace('Home');
    } catch (error) {
      console.error('Admin login error:', error);
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'Admin user not found. Setting up admin account...');
        // Try to create the admin user
        try {
          await createInitialAdmin();
          Alert.alert('Success', 'Admin account created. Please try logging in again.');
        } catch (setupError) {
          Alert.alert('Error', 'Failed to setup admin account. Please contact support.');
        }
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Invalid admin password.');
      } else {
        Alert.alert('Error', 'Admin login failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Check if user exists in firestore and is not admin
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          await auth().signOut();
          Alert.alert('Error', 'Admin users should use "Login as Admin" option');
          return;
        }
      }
      
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', 'User login failed. Please check your credentials or contact admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;
      
      // Check if user document exists, if not create one as regular user
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        await firestore().collection('users').doc(user.uid).set({
          name: user.displayName || '',
          email: user.email,
          photoURL: user.photoURL || '',
          provider: 'google',
          role: 'user', // Always create as regular user
          createdAt: new Date().toISOString(),
        });
      }
      
      navigation.replace('Home');
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
        <Text style={styles.title}>Stock Management</Text>
        <Text style={styles.subtitle}>Choose your login method</Text>
        
        {/* Login Type Selector */}
        <View style={styles.loginTypeContainer}>
          <TouchableOpacity 
            style={[styles.loginTypeButton, loginType === 'admin' && styles.activeLoginType]}
            onPress={() => setLoginType('admin')}
          >
            <Icon name="admin-panel-settings" size={20} color={loginType === 'admin' ? '#fff' : '#4a80f5'} />
            <Text style={[styles.loginTypeText, loginType === 'admin' && styles.activeLoginTypeText]}>
              Login as Admin
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.loginTypeButton, loginType === 'user' && styles.activeLoginType]}
            onPress={() => setLoginType('user')}
          >
            <Icon name="person" size={20} color={loginType === 'user' ? '#fff' : '#4a80f5'} />
            <Text style={[styles.loginTypeText, loginType === 'user' && styles.activeLoginTypeText]}>
              Login as User
            </Text>
          </TouchableOpacity>
        </View>

        {loginType === 'admin' ? (
          <View style={styles.adminLoginContainer}>
            <Text style={styles.adminLoginText}>
              Admin Login - Credentials are pre-filled
            </Text>
            
            <TextInput
              style={[styles.input, styles.adminInput]}
              placeholder="Admin Email"
              placeholderTextColor="#999"
              value="shriramt.124@gmail.com"
              editable={false}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={[styles.input, styles.adminInput]}
              placeholder="Admin Password"
              placeholderTextColor="#999"
              value="198118113Ram@"
              editable={false}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={styles.adminButton}
              onPress={handleAdminLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="admin-panel-settings" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Login as Admin</Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text style={styles.adminNoteText}>
              Note: These are the default admin credentials
            </Text>
          </View>
        ) : (
          <View style={styles.userLoginContainer}>
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
            
            <TouchableOpacity 
              style={styles.button}
              onPress={handleUserLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="person" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Login as User</Text>
                </>
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
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.contactAdminText}>
              Don't have an account? Contact admin to create one for you.
            </Text>
          </View>
        )}
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
  loginTypeContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 4,
  },
  loginTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activeLoginType: {
    backgroundColor: '#4a80f5',
  },
  loginTypeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4a80f5',
  },
  activeLoginTypeText: {
    color: '#fff',
  },
  adminLoginContainer: {
    alignItems: 'center',
  },
  adminLoginText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  adminInput: {
    backgroundColor: '#f8f9fa',
    color: '#666',
    fontWeight: '500',
  },
  adminNoteText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 15,
    fontSize: 12,
    fontStyle: 'italic',
  },
  adminButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  userLoginContainer: {
    // No additional styles needed
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    marginBottom: 20,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  contactAdminText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default LoginScreen;
