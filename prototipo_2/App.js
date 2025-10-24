import React, { useState, useEffect } from 'react';
import { Text, ActivityIndicator, View, StyleSheet, Button, Platform } from 'react-native'; // Import Platform
import { NavigationContainer, useNavigation } from '@react-navigation/native'; // Import useNavigation
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Firebase Imports ---
import { auth } from './services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from './services/firebaseService'; // Function to check profile

// --- Screen Imports ---
// Asegúrate de que las rutas relativas sean correctas desde App.js
import NotificationsScreen from './screens/NotificationsScreen';
import NotesScreen from './screens/NotesScreen';
import SchedulerScreen from './screens/SchedulerScreen';
import TrackerScreen from './screens/TrackerScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import CompleteProfileScreen from './screens/CompleteProfile'; // Ensure filename is correct, should likely be './screens/CompleteProfileScreen'
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen'; // Import EditProfileScreen

// Import HomeScreen if you have one
// import HomeScreen from './screens/HomeScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ----------------------------------------------------------------
// Component for the Header Profile Button
// ----------------------------------------------------------------
function HeaderProfileButton() {
  const navigation = useNavigation(); // Hook to get navigation object
  return (
    <View style={{ marginRight: 10 }}> {/* Add some margin */}
        <Button
            onPress={() => navigation.navigate('Profile')} // Navigate to Profile screen
            title="Perfil"
            color={Platform.OS === 'ios' ? '#fff' : '#3498db'} // Adjust color as needed
        />
    </View>
  );
}


// ----------------------------------------------------------------
// 1. MAIN TAB NAVIGATOR (MainTabs)
// ----------------------------------------------------------------
function MainTabs() {
    const insets = useSafeAreaInsets();
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#3498db',
                tabBarInactiveTintColor: '#7f8c8d',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e0e0e0',
                    paddingTop: 5,
                    paddingBottom: insets.bottom,
                    height: 60 + insets.bottom,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                headerStyle: { backgroundColor: '#3498db' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerRight: () => <HeaderProfileButton />, // Use the button component
            }}
        >
            {/* If you have a main "Home" tab, add it here */}
            {/* <Tab.Screen name="Home" component={HomeScreen} options={{...}} /> */}
            <Tab.Screen
                name="Programar"
                component={SchedulerScreen}
                options={{
                    tabBarIcon: ({ size }) => (<Text style={{ fontSize: size }}>💊</Text>),
                    title: '💊 Medicamentos',
                }}
            />
            <Tab.Screen
                name="Seguimiento"
                component={TrackerScreen}
                options={{
                    tabBarIcon: ({ size }) => (<Text style={{ fontSize: size }}>📊</Text>),
                    title: '📊 Seguimiento',
                }}
            />
            <Tab.Screen
                name="Notas"
                component={NotesScreen}
                options={{
                    tabBarIcon: ({ size }) => (<Text style={{ fontSize: size }}>📝</Text>),
                    title: '📝 Mis Notas',
                }}
            />
            <Tab.Screen
                name="Notificaciones"
                component={NotificationsScreen}
                options={{
                    tabBarIcon: ({ size }) => (<Text style={{ fontSize: size }}>🔔</Text>),
                    title: '🔔 Notificaciones',
                }}
            />
        </Tab.Navigator>
    );
}

// ----------------------------------------------------------------
// 2. MAIN APP STACK (AppStack) - Includes Tabs, Profile, and Edit Profile
// ----------------------------------------------------------------
function AppStack() {
    return (
        <Stack.Navigator>
            {/* The MainTabs component is the primary screen */}
            <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }} // Hide Stack header for the tabs screen
            />
            {/* Profile screen is part of this stack */}
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Mi Perfil', // Header title for this screen
                    headerStyle: { backgroundColor: '#3498db' }, // Consistent style
                    headerTintColor: '#fff',
                }}
            />
             {/* Edit Profile screen is also part of this stack */}
             <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{
                    title: 'Editar Perfil',
                    headerStyle: { backgroundColor: '#3498db' },
                    headerTintColor: '#fff',
                }}
            />
             {/* You can add other non-tab screens here */}
        </Stack.Navigator>
    );
}


// ----------------------------------------------------------------
// 3. AUTHENTICATION STACK (AuthStack) - Handles Login/Register
// ----------------------------------------------------------------
function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: true, title: 'Registro' }}/>
        </Stack.Navigator>
    );
}

// ----------------------------------------------------------------
// 4. PROFILE COMPLETION STACK (ProfileCompletionStack) - For new users
// ----------------------------------------------------------------
function ProfileCompletionStack() {
    return (
         <Stack.Navigator>
             <Stack.Screen
                name="CompleteProfile"
                component={CompleteProfileScreen}
                options={{
                    title: 'Completa tu Perfil',
                    headerStyle: { backgroundColor: '#3498db' },
                    headerTintColor: '#fff',
                }}
            />
            {/* If profile completion involves multiple steps, add them here */}
         </Stack.Navigator>
    );
}

// ----------------------------------------------------------------
// 5. MAIN APP COMPONENT - Handles auth state and navigation logic
// ----------------------------------------------------------------
export default function App() {
    const [user, setUser] = useState(null); // Stores Firebase auth user object
    const [loading, setLoading] = useState(true); // Loading state for auth check
    const [isProfileComplete, setIsProfileComplete] = useState(false); // Tracks profile status

    useEffect(() => {
        // Listener for Firebase authentication state changes
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true); // Start loading when auth state might change
            setUser(currentUser); // Update user state

            if (currentUser) {
                // If user is logged in, check their profile status in Firestore
                try {
                    const profile = await getUserProfile(currentUser.uid);
                    // Profile is complete if it exists and has the 'profileComplete' flag set to true
                    if (profile && profile.profileComplete === true) {
                        setIsProfileComplete(true);
                    } else {
                        setIsProfileComplete(false); // Profile doesn't exist or isn't marked complete
                    }
                } catch (error) {
                    console.error("App.js: Error checking profile:", error);
                    setIsProfileComplete(false); // Assume incomplete on error
                }
            } else {
                // If user is logged out, reset profile status
                setIsProfileComplete(false);
            }
            setLoading(false); // Finish loading after checking everything
        });

        // Cleanup function to remove the listener when the component unmounts
        return () => unsubscribe();
    }, []); // Empty dependency array ensures this runs only once on mount

    // Show loading indicator while checking auth state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    // Render the appropriate navigator based on auth state and profile status
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                {/* --- Conditional Navigation Logic --- */}
                {user ? ( // Is there a logged-in user?
                    isProfileComplete ? ( // Is their profile complete?
                        <AppStack /> // Yes -> Show main app (Tabs + Profile + Edit)
                    ) : ( // No -> Profile is incomplete
                        <ProfileCompletionStack /> // Show the profile completion flow
                    )
                ) : ( // No -> User is not logged in
                    <AuthStack /> // Show the Login/Register flow
                )}
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

// Basic styles for the loading container
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

