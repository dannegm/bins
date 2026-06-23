import { useQueryState, parseAsString } from 'nuqs';
import { Layout } from '@/components/layout/layout';
import { Footer } from '@/components/layout/footer';
import { TipsCarousel } from '@/components/system/tips-carousel';
import { HomeHeader } from '@/components/home/home-header';
import { MyBins } from '@/components/home/my-bins';
import { SharedBins } from '@/components/home/shared-bins';
import { useSettings } from '@/hooks/use-settings';

export const HomePage = () => {
    const [myBinsView, setMyBinsView] = useSettings('binView.myBins');
    const [sharedBinsView, setSharedBinsView] = useSettings('binView.sharedBins');
    const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));

    return (
        <Layout>
            <div className='flex h-full flex-col'>
                <div className='flex flex-1 flex-col overflow-y-auto'>
                    <div className='flex flex-col gap-8 p-8'>
                        <HomeHeader search={search} onSearchChange={setSearch} />
                        <TipsCarousel />
                        <MyBins view={myBinsView} onViewChange={setMyBinsView} search={search} />
                        <SharedBins
                            view={sharedBinsView}
                            onViewChange={setSharedBinsView}
                            search={search}
                        />
                    </div>
                    <Footer />
                </div>
            </div>
        </Layout>
    );
};
