import { AuthForm, validateRequest, createAccount } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default async function Page() {
  const { user } = await validateRequest();
  if (user) return redirect("/");

  return (
    <div className="lg:p-8">
      <AuthForm action={createAccount} type="signup">
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          Create an account
        </h1>
        <Label className="flex flex-col gap-2">
          Enter your name
          <div className="flex gap-1">
            <Input placeholder="first name" name="firstName" />
            <Input placeholder="last name" name="lastName" />
          </div>
        </Label>
        <Label className="flex flex-col gap-2">
          Enter your email
          <Input placeholder="name@mail.com" name="email" />
        </Label>
        <Label className="flex flex-col gap-2">
          Enter your password
          <Input type="password" placeholder="••••••••" name="password" />
        </Label>
      </AuthForm>
    </div>
  );
}
