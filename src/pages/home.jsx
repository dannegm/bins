import { Layout } from '@/components/layout/layout';
import { Footer } from '@/components/layout/footer';
import { TipsCarousel } from '@/components/system/tips-carousel';
import { HomeHeader } from '@/components/home/home-header';
import { MyBins } from '@/components/home/my-bins';
import { SharedBins } from '@/components/home/shared-bins';

export const HomePage = () => (
    <Layout>
        <div className='flex h-full flex-col'>
            <div className='flex flex-1 flex-col gap-8 overflow-y-auto p-8'>
                <HomeHeader />
                <TipsCarousel />
                <MyBins />
                <SharedBins />
            </div>
            <Footer />
        </div>
    </Layout>
);
