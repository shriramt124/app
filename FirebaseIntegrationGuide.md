# Firebase Integration Guide for Stock Maintenance App

This guide will help you set up Firebase for your React Native stock maintenance application. Follow these steps to integrate Firebase and enable real-time synchronization across multiple devices.

## Prerequisites

- Node.js and npm installed
- React Native CLI installed
- A Google account

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project"
3. Enter a project name (e.g., "Stock Maintenance App")
4. Follow the setup wizard (enable Google Analytics if needed)
5. Click "Create project"

## Step 2: Register Your App with Firebase

### For Android:

1. In the Firebase console, click on your project
2. Click the Android icon (</>) to add an Android app
3. Enter your app's package name (found in `android/app/build.gradle` under `applicationId`)
4. Enter a nickname for your app (optional)
5. Enter your app's signing certificate SHA-1 (optional for basic setup)
6. Click "Register app"
7. Download the `google-services.json` file
8. Place the file in your project's `android/app/` directory

## Step 3: Install Required Dependencies

In your React Native project, install the necessary Firebase packages:

```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
```

## Step 4: Configure Firebase in Your Project

### Android Configuration

1. Modify your project-level `android/build.gradle` file:

```gradle
buildscript {
  dependencies {
    // ... other dependencies
    classpath 'com.google.gms:google-services:4.3.15' // Add this line
  }
}
```

2. Modify your app-level `android/app/build.gradle` file:

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services' // Add this line

// ... rest of the file
```

## Step 5: Initialize Firebase in Your App

The app already has Firebase initialization in `src/config/firebase.js`. Make sure to update the configuration with your own Firebase project details:

```javascript
// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
```

## Step 6: Set Up Firestore Database

1. In the Firebase console, go to "Firestore Database"
2. Click "Create database"
3. Choose either production mode or test mode (you can change this later)
4. Select a location for your database
5. Click "Enable"

## Step 7: Set Up Firestore Security Rules

In the Firebase console, go to Firestore Database > Rules and set up basic security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write to all collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // For more granular control, you can specify rules per collection
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /productGroups/{groupId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /stockHistory/{historyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 8: Set Up Firebase Authentication

1. In the Firebase console, go to "Authentication"
2. Click "Get started"
3. Enable the "Email/Password" sign-in method
4. Click "Save"

## Step 9: Test Your Firebase Integration

1. Run your React Native app:

```bash
npx react-native run-android
```

2. Test user registration and login functionality
3. Test product management and stock operations
4. Verify real-time synchronization across multiple devices

## Firestore Data Structure

The app uses the following Firestore collections:

### Users Collection
```
users/
  {userId}/
    uid: string
    email: string
    displayName: string
    createdAt: timestamp
```

### Product Groups Collection
```
productGroups/
  {groupId}/
    name: string
    description: string
    createdAt: timestamp
```

### Products Collection
```
products/
  {productId}/
    name: string
    description: string
    mrp: number
    stock: number
    cartons: number
    groupId: string
    groupName: string
    createdAt: timestamp
    lastUpdated: timestamp
```

### Stock History Collection
```
stockHistory/
  {historyId}/
    productId: string
    productName: string
    previousStock: number
    newStock: number
    previousCartons: number
    newCartons: number
    changeAmount: number
    userId: string
    changeReason: string
    timestamp: timestamp
```

## Troubleshooting

### Common Issues

1. **Build Errors**: Make sure you have the correct versions of all dependencies and that the `google-services.json` file is in the right location.

2. **Authentication Errors**: Check that you've enabled the Email/Password sign-in method in the Firebase console.

3. **Firestore Permission Denied**: Verify your security rules in the Firebase console.

4. **Real-time Updates Not Working**: Ensure you're using the `onSnapshot` listeners correctly and that you're cleaning up listeners when components unmount.

### Getting Help

If you encounter issues with Firebase integration, consult the following resources:

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase Documentation](https://rnfirebase.io/)
- [Firebase Support](https://firebase.google.com/support)

## Next Steps

After successfully integrating Firebase, consider implementing these additional features:

1. **Offline Support**: Configure Firestore for offline persistence
2. **Cloud Functions**: Implement server-side logic for complex operations
3. **Analytics**: Track user behavior and app usage
4. **Remote Config**: Control app behavior without releasing new versions
5. **Cloud Messaging**: Implement push notifications

Congratulations! Your React Native stock maintenance app is now integrated with Firebase and ready for real-time synchronization across multiple devices.