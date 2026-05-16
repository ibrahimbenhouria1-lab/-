import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where, setDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  loginWithCode: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUser({ uid: firebaseUser.uid, ...docSnap.data() } as User);
          } else {
            // Check if we have a hardcoded bypass or cached link
            const cachedCode = localStorage.getItem('cached_auth_code');
            if (cachedCode === 'ADMIN2026') {
               try {
                 await setDoc(userRef, {
                   name: 'المدير الرئيسي',
                   role: 'admin',
                   status: 'active',
                   email: firebaseUser.email || 'admin@newgaterobot.com',
                   createdAt: serverTimestamp()
                 }, { merge: true });
               } catch (err) {
                 console.error("Critical: Failed to create admin doc", err);
                 handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
               }
            } else {
               setUser(null);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user doc:", error);
          setLoading(false);
        });

        return () => unsubscribeDoc();
      } else {
        const cachedCode = localStorage.getItem('cached_auth_code');
        if (cachedCode) {
          loginWithCode(cachedCode).catch(() => setLoading(false));
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error:", error);
      setLoading(false);
    }
  };

  const loginWithCode = async (code: string): Promise<boolean> => {
    const cleanCode = code.toUpperCase().trim();
    if (!cleanCode) return false;
    
    try {
      setLoading(true);
      
      // Ensure we are signed in anonymously to have a session ID
      let firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        try {
          const authResult = await signInAnonymously(auth);
          firebaseUser = authResult.user;
        } catch (authErr: any) {
          console.error("Auth Exception:", authErr);
          if (authErr.code === 'auth/admin-restricted-operation') {
             // We'll handle this in the UI by throwing a specific error
             const setupError = new Error('FIREBASE_SETUP_REQUIRED');
             (setupError as any).code = authErr.code;
             throw setupError;
          }
          throw authErr;
        }
      }

      const uid = firebaseUser!.uid;

      // 1. MASTER ADMIN BYPASS (Hardcoded for first-time setup or emergency)
      if (cleanCode === 'ADMIN2026') {
        const userRef = doc(db, 'users', uid);
        try {
          await setDoc(userRef, {
            name: 'المدير الرئيسي',
            role: 'admin',
            status: 'active',
            email: 'admin@newgaterobot.com',
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
        }
        
        localStorage.setItem('cached_auth_code', cleanCode);
        return true;
      }

      // 2. CHECK DATABASE FOR ACCESS CODE
      const codeRef = doc(db, 'access_codes', cleanCode);
      let codeSnap;
      try {
        codeSnap = await getDoc(codeRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `access_codes/${cleanCode}`);
      }

      if (codeSnap.exists()) {
        const codeData = codeSnap.data();
        const role = codeData.role;
        const name = codeData.name || (role === 'teacher' ? 'معلم جديد' : 'ولي أمر جديد');
        
        const userRef = doc(db, 'users', uid);
        try {
          await setDoc(userRef, {
            name,
            role,
            status: 'active',
            linkedCode: cleanCode,
            studentIds: codeData.studentIds || [],
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
        }

        localStorage.setItem('cached_auth_code', cleanCode);
        return true;
      }

      localStorage.removeItem('cached_auth_code');
      setLoading(false);
      return false;
    } catch (error: any) {
      console.error("Login Error:", error);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('cached_auth_code');
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, loginWithCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
