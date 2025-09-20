import { HomeView } from "@/modules/home/ui/views/home-view";
import { authenticator } from "@/components/authenticator";

const Page = async () => {
    /** Security checking */
    await authenticator();

    /** Return view if security checking passed*/
    return <HomeView />;
};

export default Page;
