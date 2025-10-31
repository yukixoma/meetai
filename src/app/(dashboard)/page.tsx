import { HomeView } from "@/modules/home/ui/views/home-view";
import { authenticator } from "@/components/authenticator";
import { HomeHeader } from "@/modules/home/ui/components/home-header";

const Page = async () => {
    /** Security checking */
    await authenticator();

    /** Return view if security checking passed*/
    return (
        <>
            <HomeHeader />
            <HomeView />
        </>
    );
};

export default Page;
