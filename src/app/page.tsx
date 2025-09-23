"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, Sparkles, Users, Palette } from "lucide-react";
import { AppHeader } from "@/components/layout/header";
import { AppFooter } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const getImage = (id: string) => {
  const image = PlaceHolderImages.find((img) => img.id === id);
  if (!image) return { src: "", width: 0, height: 0, alt: "", hint: "" };

  // Check if the URL is from picsum to parse dimensions
  if (image.imageUrl.includes("picsum.photos")) {
    const parts = image.imageUrl.split("/");
    const height = parseInt(parts[parts.length - 1], 10);
    const width = parseInt(parts[parts.length - 2], 10);
    return {
      src: image.imageUrl,
      width,
      height,
      alt: image.description,
      hint: image.imageHint,
    };
  }

  // For other images, like postimg.cc, use predefined dimensions if needed
  if (id === "hero") {
    return {
      src: image.imageUrl,
      width: 1200,
      height: 800,
      alt: image.description,
      hint: image.imageHint,
    };
  }

  // Default fallback for other non-picsum images
  const width = 600;
  const height = 400;
  return {
    src: image.imageUrl,
    width,
    height,
    alt: image.description,
    hint: image.imageHint,
  };
};

const featureCards = [
  {
    icon: <Lock className="h-6 w-6 text-primary" />,
    title: "Secure School Portals",
    description:
      "Each institution receives a dedicated, isolated instance with its own private database. This single-tenant architecture guarantees that your student and financial data is completely secure and segregated, providing the highest level of privacy and control.",
    imageId: "feature-portal",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Role-Based Access",
    description:
      "Our platform offers distinct, tailored dashboards for every user role. Administrators gain a comprehensive overview of school operations, teachers receive powerful tools for class and grade management, and parents get a clear, concise window into their child's academic life.",
    imageId: "feature-roles",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    title: "AI-Powered Learning",
    description:
      "Go beyond traditional teaching methods. Our advanced AI analyzes student performance data to generate truly personalized learning paths, identifying knowledge gaps and recommending specific resources, activities, and assessments to help every student succeed.",
    imageId: "feature-ai",
  },
  {
    icon: <Palette className="h-6 w-6 text-primary" />,
    title: "Portal Customization",
    description:
      "Fully integrate your school's brand identity. Administrators can effortlessly customize logos, color palettes, and fonts, transforming the portal into a seamless and professional extension of your institution. This reinforces school pride and community.",
    imageId: "feature-brand",
  },
];

export default function Home() {
  const heroImage = getImage("hero");
  const missionImage = getImage("mission");
  const aictaImage = getImage("ai-cta");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40 bg-secondary/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-primary sm:text-5xl xl:text-6xl/none">
                    Empowering Kenya's Future
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    EduSphere is a premium, all-in-one education data system
                    designed for Kenyan schools, fostering growth, and enabling
                    personalized learning.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login">
                      Access Your Portal
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#features">Explore Features</Link>
                  </Button>
                </div>
              </div>
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                width={heroImage.width}
                height={heroImage.height}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-lg"
                data-ai-hint={heroImage.hint}
                priority
              />
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="text-accent-foreground border-accent bg-accent/10"
                >
                  Premium Features
                </Badge>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                  A New Standard for Education Management
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides the tools and security your institution
                  needs to thrive in the digital age.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-6 py-12 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4">
              {featureCards.map((feature) => {
                const image = getImage(feature.imageId);
                return (
                  <Card
                    key={feature.title}
                    className="group h-full transform-gpu overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <CardHeader className="p-0">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        width={image.width}
                        height={image.height}
                        data-ai-hint={image.hint}
                        className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-2">
                        <div className="mt-1 flex-shrink-0">{feature.icon}</div>
                        <CardTitle className="font-headline text-xl">
                          {feature.title}
                        </CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="about"
          className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30"
        >
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <h2 className="font-headline text-3xl font-bold tracking-tighter text-primary md:text-4xl/tight">
                Our Mission: To Revolutionize Education in Kenya
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We believe in the power of technology to unlock potential.
                EduSphere Kenya was born from a desire to provide Kenyan schools
                with a world-class, secure, and intuitive platform that puts
                students and educators first.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src={missionImage.src}
                alt={missionImage.alt}
                width={missionImage.width}
                height={missionImage.height}
                className="mx-auto rounded-xl object-cover shadow-lg"
                data-ai-hint={missionImage.hint}
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Experience the Future of Learning
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Use our generative AI to create personalized learning paths that
                cater to each student's unique needs. Try it now.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button
                asChild
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/learning-path">
                  Generate a Learning Path
                  <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
