
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { loginUser, checkUserRole, createInitialAdmin } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('user'); // 'admin' or 'user'
  const { currentUser } = useAuth();

  // Create initial admin user when component mounts
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        await createInitialAdmin();
      } catch (error) {
        console.log('Admin initialization error:', error);
      }
    };
    initializeAdmin();
  }, []);

  const handleAdminLogin = () => {
    setLoginType('admin');
    setEmail('shriramt.124@gmail.com');
    setPassword('198118113Ram@');
  };

  const handleUserLogin = () => {
    setLoginType('user');
    setEmail('');
    setPassword('');
  };

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        // Get user data from Firestore to check role
        const roleResult = await checkUserRole(result.user.uid);
        
        if (roleResult.success) {
          const userRole = roleResult.role;
          
          // Check if user role matches login type
          if (loginType === 'admin' && userRole !== 'admin') {
            Alert.alert('Access Denied', 'You do not have admin privileges');
            return;
          }
          
          Alert.alert('Success', `Welcome ${userRole === 'admin' ? 'Admin' : 'User'}!`, [
            {
              text: 'OK',
              onPress: () => navigation.replace('Home'),
            },
          ]);
        } else {
          Alert.alert('Error', `Could not verify user role: ${roleResult.error || 'Unknown error'}`);
        }
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Stock Management</Text>
        <Text style={styles.subtitle}>Login to your account</Text>
        
        {/* Login Type Selection */}
        <View style={styles.loginTypeContainer}>
          <Text style={styles.loginTypeLabel}>Login as:</Text>
          <View style={styles.loginTypeButtons}>
            <TouchableOpacity 
              style={[styles.loginTypeButton, loginType === 'admin' && styles.loginTypeButtonActive]}
              onPress={handleAdminLogin}
            >
              <Icon name="admin-panel-settings" size={20} color={loginType === 'admin' ? '#fff' : '#4a80f5'} />
              <Text style={[styles.loginTypeText, loginType === 'admin' && styles.loginTypeTextActive]}>
                Admin
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.loginTypeButton, loginType === 'user' && styles.loginTypeButtonActive]}
              onPress={handleUserLogin}
            >
              <Icon name="person" size={20} color={loginType === 'user' ? '#fff' : '#4a80f5'} />
              <Text style={[styles.loginTypeText, loginType === 'user' && styles.loginTypeTextActive]}>
                User
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loginType === 'admin' && (
          <View style={styles.adminNotice}>
            <Icon name="info" size={16} color="#4a80f5" />
            <Text style={styles.adminNoticeText}>
              Admin credentials are pre-filled. Click Login to continue.
            </Text>
          </View>
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={loginType === 'user'}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={loginType === 'user'}
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Login as {loginType === 'admin' ? 'Admin' : 'User'}
            </Text>
          )}
        </TouchableOpacity>
        
        {loginType === 'user' && (
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
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
    marginBottom: 20,
  },
  loginTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  loginTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  loginTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a80f5',
    backgroundColor: '#fff',
  },
  loginTypeButtonActive: {
    backgroundColor: '#4a80f5',
  },
  loginTypeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4a80f5',
  },
  loginTypeTextActive: {
    color: '#fff',
  },
  adminNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  adminNoticeText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#1976d2',
    flex: 1,
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
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
  },
  registerLink: {
    color: '#4a80f5',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
