import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useStore } from '../store/useStore';

export interface ShopProfile {
  id: string;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  gstin: string | null;
}

const DEFAULT_PROFILE: ShopProfile = {
  id: '',
  name: 'More Jewellers',
  tagline: 'Premium Gold & Silver Jewellery',
  phone: '6281 218 824',
  email: 'morejewellers45@gmail.com',
  address: 'Main Road, Mehkar - 585416, Tq. Bhalki, Dist. Bidar, Karnataka',
  gstin: null,
};

interface ProfileContextType {
  profile: ShopProfile;
  isLoading: boolean;
  refetchProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: DEFAULT_PROFILE,
  isLoading: false,
  refetchProfile: () => {},
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['shop-profile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const profile: ShopProfile = data?.data || DEFAULT_PROFILE;

  const refetchProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['shop-profile'] });
  };

  return (
    <ProfileContext.Provider value={{ profile, isLoading, refetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
