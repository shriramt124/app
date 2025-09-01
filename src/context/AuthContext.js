import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Create the context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const db = firestore();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in
        console.log('Auth state changed - User signed in:', user.email);
        try {
          // Get additional user data from Firestore
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data from Firestore:', userData);
            const userWithData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              ...userData,
            };
            setCurrentUser(userWithData);
            console.log('Current user set to:', userWithData);
          } else {
            console.log('User document does not exist, creating default user');
            // If user document doesn't exist, create one with default role
            // Check if this is the admin email
            const isAdminEmail = user.email === 'shriramt.124@gmail.com';
            const defaultUserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email,
              name: isAdminEmail ? 'Administrator' : (user.displayName || user.email),
              role: isAdminEmail ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
            };
            
            await db.collection('users').doc(user.uid).set(defaultUserData);
            const userWithData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              ...defaultUserData,
            };
            setCurrentUser(userWithData);
            console.log('Default user created and set:', userWithData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          const fallbackUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: user.email === 'shriramt.124@gmail.com' ? 'admin' : 'user',
          };
          setCurrentUser(fallbackUser);
          console.log('Fallback user set:', fallbackUser);
        }
      } else {
        // User is signed out
        console.log('Auth state changed - User signed out');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const isAdmin = () => {
    const result = currentUser && currentUser.role === 'admin';
    console.log('isAdmin check:', { currentUser: currentUser?.email, role: currentUser?.role, result });
    return result;
  };

  const isUser = () => {
    return currentUser && currentUser.role === 'user';
  };

  const value = {
    currentUser,
    loading,
    isAdmin,
    isUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};