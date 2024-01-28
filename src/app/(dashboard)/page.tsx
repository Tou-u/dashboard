import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MainNav } from "./components/main-nav";
import { Search } from "./components/search";
import { UserNav } from "./components/user-nav";

export default async function Home() {
  const { user } = await validateRequest();
  if (!user) return redirect("/login");

  return (
    <>
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav user={user} />
          </div>
        </div>
      </div>
      <div>
        <strong>{JSON.stringify(user, null, 2)}</strong>
      </div>
    </>
  );
}
