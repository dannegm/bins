import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/layout';
import { Footer } from '@/components/layout/footer';
import { ProfileHeader } from '@/components/user/profile-header';
import { ProfileBins } from '@/components/user/profile-bins';
import { getProfile } from '@/services/profiles';
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
                .select('*, bin_files(count)')
                .eq('author_id', uuid)
                .order('updated_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!uuid,
    });

export const UserPage = () => {
    const { uuid } = useParams({ strict: false });
    const { data: profile, isLoading: profileLoading } = useProfileData(uuid);
    const { data: bins = [], isLoading: binsLoading } = useProfileBins(uuid);

    return (
        <Layout>
            <div className='flex h-full flex-col'>
                <div className='flex flex-1 flex-col overflow-y-auto'>
                    <ProfileHeader profile={profile} bins={bins} isLoading={profileLoading} />
                    <div className='flex flex-col gap-8 p-8'>
                        <ProfileBins bins={bins} isLoading={binsLoading} />
                    </div>
                </div>
                <Footer />
            </div>
        </Layout>
    );
};
