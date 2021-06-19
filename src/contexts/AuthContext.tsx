import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import * as Google from 'expo-google-app-auth';
import * as Apple from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthProviderProps {
  children: ReactNode;
}

interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface AuthContextData {
  user: User;
  signInWithGoogle(): Promise<void>;
  signInWithApple(): Promise<void>;
  signOut(): Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>({} as User);
  const [isLoading, setIsLoading] = useState(true);

  const userStorageKey = '@gofinances:user';
  
  async function signInWithGoogle() {
    try {
      const result = await Google.logInAsync({
        iosClientId: '194505986401-qrqt1uuv6pg7rnm29h953ko0siif3clh.apps.googleusercontent.com',
        androidClientId: '194505986401-32528cg5jkem3v9f856keegj5nogdhoe.apps.googleusercontent.com',
        scopes: ['profile', 'email']
      })

      if (result.type === 'success') {
        const userLogged = {
          id: String(result.user.id),
          name: result.user.name!,
          email: result.user.email!,
          photo: result.user.photoUrl!,
        }

        setUser(userLogged);
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(userLogged));
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async function signInWithApple() {
    try {
      const credentials = await Apple.signInAsync({
        requestedScopes: [
          Apple.AppleAuthenticationScope.FULL_NAME,
          Apple.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (credentials) {
        const name = credentials.fullName!.givenName!;
        const photo = `https://ui-avatars.com/api/?name=${name}&length=1`;

        const userLogged = {
          id: String(credentials.user),
          email: credentials.email!,
          name,
          photo,
        }

        setUser(userLogged);
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(userLogged));
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async function signOut() {
    setUser({} as User);

    await AsyncStorage.removeItem(userStorageKey);
  }

  useEffect(() => {
    async function loadUserStorageData() {
      const userStoraged = await AsyncStorage.getItem(userStorageKey);

      if (userStoraged) {
        const userLogged = JSON.parse(userStoraged) as User;
        setUser(userLogged);
      }

      setIsLoading(false);
    }

    loadUserStorageData();
  }, []);

  return(
    <AuthContext.Provider value={{ 
      user, 
      signInWithGoogle, 
      signInWithApple, 
      signOut, 
      isLoading 
    }}>
      { children }
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext);

  return context;
}
