import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { useTMA } from '@/components/providers/TMAProvider';
import { useDebugStore } from '@/components/ui/DebugConsole';

export const useAuth = () => {
    const { telegramUser: tmaUser, ready: isTMALoaded } = useTMA();
    const { setUser, setSalonSettings } = useStore();
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // [DEBUG] Check TMA status
        // useDebugStore.getState().addLog('info', 'Auth Effect Triggered', { isTMALoaded, hasUser: !!tmaUser });

        if (!isTMALoaded) {
            // useDebugStore.getState().addLog('warn', 'TMA Not Loaded Yet');
            return;
        }

        const syncUser = async () => {
            useDebugStore.getState().addLog('info', 'Starting Auth Sync', { tgId: tmaUser?.id });
            try {
                const tgId = tmaUser?.id || 123456789;

                const { data: profile, error } = await supabase
                    .from('master_profiles')
                    .select('*')
                    .eq('tg_id', tgId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    useDebugStore.getState().addLog('error', 'Auth: Profile Fetch Error', error);
                    throw error;
                }

                if (profile) {
                    useDebugStore.getState().addLog('success', 'Auth: Profile Found', profile.name);

                    // [SYNC] Self-heal: If DB has default/old name but we have real Telegram data, update DB
                    if (tmaUser && (tmaUser.firstName !== profile.name || tmaUser.photoUrl !== profile.avatar_url)) {
                        const updates = {};
                        if (tmaUser.firstName && tmaUser.firstName !== 'Master') updates.name = tmaUser.firstName;
                        if (tmaUser.photoUrl) updates.avatar_url = tmaUser.photoUrl;

                        if (Object.keys(updates).length > 0) {
                            useDebugStore.getState().addLog('info', 'Auth: Syncing Telegram Data to DB', updates);
                            await supabase.from('master_profiles').update(updates).eq('id', profile.id);
                            // Update local profile object so UI reflects it immediately
                            if (updates.name) profile.name = updates.name;
                            if (updates.avatar_url) profile.avatar_url = updates.avatar_url;
                        }
                    }

                    setUser({
                        ...profile,
                        role: 'master',
                        telegramId: profile.tg_id
                    });
                    if (profile.settings) {
                        setSalonSettings(profile.settings);
                    }
                    setIsAuthenticated(true);
                } else {
                    useDebugStore.getState().addLog('info', 'Auth: Creating New Profile');
                    const newProfile = {
                        tg_id: tgId,
                        name: tmaUser?.first_name || 'Master',
                        avatar_url: tmaUser?.photo_url || null,
                        settings: { currency: '₸', workHours: { start: '10:00', end: '20:00' } }
                    };

                    const { data: createdUser, error: createError } = await supabase
                        .from('master_profiles')
                        .insert([newProfile])
                        .select()
                        .single();

                    if (createError) throw createError;

                    if (createdUser) {
                        useDebugStore.getState().addLog('success', 'Auth: Profile Created');
                        setUser({
                            ...createdUser,
                            role: 'master',
                            telegramId: createdUser.tg_id
                        });
                        setIsAuthenticated(true);
                    }
                }

                setTimeout(() => {
                    useStore.getState().fetchCloudData();
                }, 100);

            } catch (err) {
                console.error('Auth sequence failed:', err);
                useDebugStore.getState().addLog('error', 'Auth Failed', err.message);
            } finally {
                useDebugStore.getState().addLog('info', 'Auth Loading Finished');
                setIsAuthLoading(false);
            }
        };

        syncUser();

    }, [isTMALoaded, tmaUser, setUser, setSalonSettings]);

    return { isAuthLoading, isAuthenticated };
};
