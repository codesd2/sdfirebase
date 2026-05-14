import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface User {
  uid: string;
  email: string | null;
  role: string;
  name?: string;
  phone?: string;
  address?: {
    flat?: string;
    apartment?: string;
    street?: string;
    city?: string;
    pincode?: string;
    googleMapsLink?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  signup: (email: string, password: string, profileData: Partial<User>) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isAdmin: false,
  login: async () => {},
  signup: async () => {},
  loginWithEmail: async () => {},
  logout: async () => {},
  updateProfile: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        let profile: Partial<User> = {};
        
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            profile = userDoc.data() as User;
          } else {
            // Initialize user in Firestore if they don't exist
            const initialRole = firebaseUser.email === 'itssanjaydutta@gmail.com' ? 'admin' : 'user';
            profile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: initialRole,
              name: firebaseUser.displayName || '',
            };
            // Note: We don't save to firestore here to avoid overhead on every login check, 
            // but we could. For now, we just use the initial state.
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: profile.role || 'user',
          ...profile
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      throw error;
    }
  };

  const signup = async (email: string, password: string, profileData: Partial<User>) => {
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
    
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    const fullProfile = {
      ...profileData,
      uid,
      email,
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', uid), fullProfile);
    setUser(fullProfile as User);
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await auth.signOut();
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', user.uid), {
      ...user,
      ...data,
      uid: user.uid,
      email: user.email,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin: user?.role === 'admin',
      login,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
