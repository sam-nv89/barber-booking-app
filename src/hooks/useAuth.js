import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { useTMA } from '@/components/providers/TMAProvider';

export const useAuth = () => {
    const { user: tmaUser, isLoaded: isTMALoaded } = useTMA();
    const { setUser, setSalonSettings } = useStore();
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (!isTMALoaded) return;

        const syncUser = async () => {
            try {
                // If no TMA user (browser dev mode), we might want a mock user or just stay anon
                // For now, let's assume we need a tg_id.
                // In dev mode without TMA, use a mock ID or fallback from localStorage if it exists
                const tgId = tmaUser?.id || 123456789; // Fallback for dev

                // 1. Check if master exists
                const { data: profile, error } = await supabase
                    .from('master_profiles')
                    .select('*')
                    .eq('tg_id', tgId)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                    console.error('Error fetching profile:', error);
                    throw error;
                }

                if (profile) {
                    // User exists - sync store
                    console.log('Found Supabase Profile:', profile);
                    setUser({
                        ...profile,
                        role: 'master', // Enforce master role for now or read from DB
                        telegramId: profile.tg_id
                    });
                    if (profile.settings) {
                        setSalonSettings(profile.settings);
                    }
                    setIsAuthenticated(true);
                } else {
                    // User does not exist - Create new
                    console.log('Creating new Supabase Profile for ID:', tgId);
                    const newProfile = {
                        tg_id: tgId,
                        name: tmaUser?.first_name || 'Master',
                        avatar_url: tmaUser?.photo_url || null,
                        settings: { currency: '₸', workHours: { start: '10:00', end: '20:00' } } // Defaults
                    };

                    const { data: createdUser, error: createError } = await supabase
                        .from('master_profiles')
                        .insert([newProfile])
                        .select()
                        .single();

                    if (createError) throw createError;

                    if (createdUser) {
                        setUser({
                            ...createdUser,
                            role: 'master',
                            telegramId: createdUser.tg_id
                        });
                        setIsAuthenticated(true);
                    }
                }

                // After auth logic (login or register), trigger data sync
                // We use setTimeout to allow store state to settle first if needed
                setTimeout(() => {
                    useStore.getState().fetchCloudData();
                }, 100);

            } catch (err) {
                console.error('Auth sequence failed:', err);
                // Fallback: If network fails, maybe we just trust localStorage? 
                // For now, let's not block access but log error.
            } finally {
                setIsAuthLoading(false);
            }
        };

        syncUser();

    }, [isTMALoaded, tmaUser, setUser, setSalonSettings]);

    return { isAuthLoading, isAuthenticated };
};
