import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { HomeView } from "@/modules/home/ui/views/home-view";

const Page = async () => {
    /** Security checking */
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    /** Return view if security checking passed*/
    return <HomeView />;
};

export default Page;
