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
        try {
          // Get additional user data from Firestore
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists()) {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userDoc.data(),
            });
          } else {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              role: 'user', // Default role
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
          });
        }
      } else {
        // User is signed out
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
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