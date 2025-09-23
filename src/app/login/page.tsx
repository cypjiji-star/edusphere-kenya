import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { AppLogo } from "@/components/ui/app-logo";
import { Avatar } from "@/components/ui/avatar";
import { LoginForm } from "./login-form";
import { DeveloperLoginForm } from "./developer-login-form";
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const defaultProfile = {
  name: "EduSphere Kenya",
  motto: "Empowering Education for All",
  logoUrl: "https://i.postimg.cc/0r1RGZvk/android-launchericon-512-512.png",
  coverImageUrl:
    "https://i.postimg.cc/1tRnvG0P/Chat-GPT-Image-Sep-16-2025-08-14-02-PM.png",
};

function LoginPageContent() {
  const profile = defaultProfile;

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      {/* Left panel – desktop only */}
      <div className="relative hidden lg:flex flex-col items-center justify-between bg-muted p-8 text-white">
        <Image
          src={profile.coverImageUrl}
          alt="School campus"
          fill
          className="absolute inset-0 h-full w-full object-cover"
          data-ai-hint="kenyan children"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/30" />

        <Link
          href="/"
          className="relative z-20 flex items-center text-lg font-medium"
        >
          <AppLogo className="h-6 w-6 mr-2" />
          EduSphere Kenya
        </Link>

        <div className="relative z-20 mt-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Avatar className="h-20 w-20 border-4 border-white/50 bg-background p-2">
              <AppLogo />
            </Avatar>
          </div>
          <h1 className="text-3xl font-bold font-headline">{profile.name}</h1>
          <p className="mt-2 text-lg italic">"{profile.motto}"</p>
          <div className="mt-8 text-sm text-white/70">
            <p>Built & Maintained By</p>
            <Link
              href="/developer-contact"
              className="font-semibold text-white hover:underline"
            >
              Derick Kisero
            </Link>
          </div>
          <p className="text-xs mt-2 text-white/50">
            © {new Date().getFullYear()} EduSphere. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel – always scrollable */}
      <div className="flex items-center justify-center bg-background min-h-[100dvh] overflow-y-auto">
        <div className="w-full max-w-sm mx-auto px-6 py-12">
          <div className="grid gap-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold font-headline text-primary">
                Sign In
              </h1>
              <p className="text-muted-foreground">
                Select your portal to access your dashboard
              </p>
            </div>

            <Tabs defaultValue="school" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="school">School Portal</TabsTrigger>
                <TabsTrigger value="developer">Developer</TabsTrigger>
              </TabsList>

              <TabsContent value="school">
                <Card className="shadow-none border-none bg-transparent">
                  <CardContent className="p-0 pt-6">
                    <Suspense>
                      <LoginForm />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="developer">
                <Card className="shadow-none border-none bg-transparent">
                  <CardContent className="p-0 pt-6">
                    <DeveloperLoginForm />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Extra space so keyboard never hides the form */}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
