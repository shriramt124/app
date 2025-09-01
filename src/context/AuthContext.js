import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Primary user state
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // State for role

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth().onAuthStateChanged(async (authUser) => {
      if (authUser) {
        // User is signed in
        try {
          // Get additional user data from Firestore
          const userDoc = await firestore().collection('users').doc(authUser.uid).get();
          if (userDoc.exists) {
            const userData = {
              uid: authUser.uid,
              email: authUser.email,
              ...userDoc.data(),
            };
            setUser(userData); // Set primary user state
            setUserRole(userData.role); // Set the user role
          } else {
            // If user document doesn't exist, create one with default role
            const newUserData = {
              uid: authUser.uid,
              email: authUser.email,
              name: authUser.displayName || 'User', // Use displayName or default
              role: 'user', // Default role
              createdAt: new Date().toISOString(),
            };
            await firestore().collection('users').doc(authUser.uid).set(newUserData);
            setUser(newUserData); // Set primary user state
            setUserRole('user'); // Set the user role
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to null if error occurs
          setUser(null);
          setUserRole(null);
        }
      } else {
        // User is signed out
        setUser(null);
        setUserRole(null);
      }
      setLoading(false); // Set loading to false once auth state is determined
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Function to check if the current user is an admin
  const isAdmin = () => {
    return userRole === 'admin';
  };

  // Logout function
  const logout = async () => {
    try {
      await auth().signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  };

  // Context value
  const value = {
    user, // Exporting the primary user state
    currentUser: user, // For backward compatibility, though 'user' is preferred
    userRole, // Exporting the user role
    loading,
    isAdmin, // Exporting the isAdmin check
    logout, // Exporting the logout function
    setUser, // For external user updates if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};