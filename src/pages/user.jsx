import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/layout';
import { Footer } from '@/components/layout/footer';
import { ProfileHeader } from '@/components/user/profile-header';
import { ProfileBins } from '@/components/user/profile-bins';
import { ProfileSharedBins } from '@/components/user/profile-shared-bins';
import { getProfile } from '@/services/profiles';
import { VISIBILITY } from '@/constants/visibility';
import { useIdentity } from '@/hooks/use-identity';
import { useSettings } from '@/hooks/use-settings';
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
    const [profileBinsView, setProfileBinsView] = useSettings('binView.profileBins');
    const [profileSharedBinsView, setProfileSharedBinsView] = useSettings('binView.profileSharedBins');

    const isOwnProfile = user?.uuid === uuid;
    const displayBins = isOwnProfile ? bins : bins.filter(b => b.visibility === VISIBILITY.PUBLIC);

    return (
        <Layout>
            <div className='flex h-full flex-col'>
                <div className='flex flex-1 flex-col overflow-y-auto'>
                    <ProfileHeader profile={profile} bins={displayBins} isLoading={profileLoading} />
                    <div className='flex flex-col gap-8 p-8'>
                        <ProfileBins bins={displayBins} isLoading={binsLoading} view={profileBinsView} onViewChange={setProfileBinsView} />
                        <ProfileSharedBins bins={sharedBins} view={profileSharedBinsView} onViewChange={setProfileSharedBinsView} />
                    </div>
                </div>
                <Footer />
            </div>
        </Layout>
    );
};
