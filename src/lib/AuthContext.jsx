import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password, fullName) {
        return createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                await updateProfile(user, { displayName: fullName });

                // Create user doc in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    id: user.uid,
                    email: user.email,
                    full_name: fullName,
                    role: 'user',
                    created_date: new Date().toISOString()
                });

                // Create initial empty health profile
                await setDoc(doc(db, "health_profiles", user.uid), {
                    user_id: user.uid,
                    blood_type: 'Unknown',
                    allergies: [],
                    medications: [],
                    medical_conditions: [],
                    emergency_contacts: []
                });

                return user;
            });
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
