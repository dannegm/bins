import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/layout';
import { Footer } from '@/components/layout/footer';
import { ProfileHeader } from '@/components/user/profile-header';
import { ProfileBins } from '@/components/user/profile-bins';
import { ProfileSharedBins } from '@/components/user/profile-shared-bins';
import { getProfile } from '@/services/profiles';
import { useIdentity } from '@/hooks/use-identity';
import { supabase } from '@/services/supabase';

const useProfileData = uuid =>
    useQuery({
        queryKey: ['profile', uuid],
        queryFn: () => getProfile(uuid),
        enabled: !!uuid,
    });

const useProfileBins = uuid =>
    useQuery({
        queryKey: ['profile-bins', uuid],
        queryFn: async () => {
            const { data, error } = await supabase()
                .from('bins')
                .select('*, bin_files(language)')
                .eq('author_id', uuid)
                .order('updated_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!uuid,
    });

const useSharedWithMe = (currentUuid, profileUuid) =>
    useQuery({
        queryKey: ['profile-shared-with-me', currentUuid, profileUuid],
        queryFn: async () => {
            const { data, error } = await supabase()
                .from('bin_collaborators')
                .select('bin:bins(*, bin_files(language))')
                .eq('user_id', currentUuid)
                .eq('bins.author_id', profileUuid)
                .order('joined_at', { ascending: false });
            if (error) throw error;
            return data?.map(r => r.bin).filter(Boolean) ?? [];
        },
        enabled: !!currentUuid && !!profileUuid && currentUuid !== profileUuid,
    });

export const UserPage = () => {
    const { uuid } = useParams({ strict: false });
    const { user } = useIdentity();
    const { data: profile, isLoading: profileLoading } = useProfileData(uuid);
    const { data: bins = [], isLoading: binsLoading } = useProfileBins(uuid);
    const { data: sharedBins = [] } = useSharedWithMe(user?.uuid, uuid);

    return (
        <Layout>
            <div className='flex h-full flex-col'>
                <div className='flex flex-1 flex-col overflow-y-auto'>
                    <ProfileHeader profile={profile} bins={bins} isLoading={profileLoading} />
                    <div className='flex flex-col gap-8 p-8'>
                        <ProfileBins bins={bins} isLoading={binsLoading} />
                        <ProfileSharedBins bins={sharedBins} />
                    </div>
                </div>
                <Footer />
            </div>
        </Layout>
    );
};
