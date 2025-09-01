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
  const [currentUser, setCurrentUser] = useState(null); // This seems redundant with 'user' based on the edit
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // New state for role

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
            setCurrentUser(userData); // Keep original name for compatibility if needed elsewhere
            setUserRole(userData.role); // Set the user role
          } else {
            // If user document doesn't exist, create one with default role
            const defaultUserData = {
              uid: authUser.uid,
              email: authUser.email,
              name: authUser.displayName || 'User', // Use displayName or default
              role: 'user', // Default role
              createdAt: new Date().toISOString(),
            };
            await firestore().collection('users').doc(authUser.uid).set(defaultUserData);
            setUser(defaultUserData); // Set primary user state
            setCurrentUser(defaultUserData); // Keep original name
            setUserRole('user'); // Set the user role
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to null if error occurs
          setUser(null);
          setCurrentUser(null);
          setUserRole(null);
        }
      } else {
        // User is signed out
        setUser(null);
        setCurrentUser(null);
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
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  };

  // Context value
  const value = {
    user, // Exporting the primary user state
    currentUser, // Keeping for potential backward compatibility, though 'user' is preferred
    userRole, // Exporting the user role
    loading,
    isAdmin, // Exporting the isAdmin check
    logout, // Exporting the logout function
    // Removed setCurrentUser from context value as it's managed internally and 'setUser' is preferred
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Render children only when loading is false */}
    </AuthContext.Provider>
  );
};
```import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await firestore().collection('users').doc(authUser.uid).get();
          if (userDoc.exists) {
            const userData = {
              uid: authUser.uid,
              email: authUser.email,
              ...userDoc.data(),
            };
            setUser(userData);
            setCurrentUser(userData);
            setUserRole(userData.role);
          } else {
            const newUserData = {
              uid: authUser.uid,
              email: authUser.email,
              name: authUser.displayName || 'User',
              role: 'user',
              createdAt: new Date().toISOString(),
            };
            await firestore().collection('users').doc(authUser.uid).set(newUserData);
            setUser(newUserData);
            setCurrentUser(newUserData);
            setUserRole('user');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
          setCurrentUser(null);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = () => {
    return userRole === 'admin';
  };

  const logout = async () => {
    try {
      await auth().signOut();
      setUser(null);
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    currentUser,
    userRole,
    loading,
    isAdmin,
    logout,
    setCurrentUser, 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};