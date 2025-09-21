import { AppHeader } from '@/components/layout/header';
import { AppFooter } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Mail, Building, ShieldCheck, Palette, Users, Sparkles } from 'lucide-react';
import Image from 'next/image';

const features = [
    {
        icon: Building,
        title: "Multi-Tenant Architecture",
        description: "EduSphere is built on a robust multi-tenant architecture, providing each school with its own dedicated and isolated instance. This ensures data privacy and security, preventing any cross-contamination of information between institutions."
    },
    {
        icon: Users,
        title: "Role-Based Access Control",
        description: "The system features a comprehensive role-based access control (RBAC) system. Out-of-the-box roles for Administrators, Teachers, Parents, and Students ensure that users only see the information and tools relevant to them. A developer portal allows for the creation of new roles with granular permissions."
    },
    {
        icon: Sparkles,
        title: "AI-Powered Features",
        description: "Leveraging cutting-edge generative AI, EduSphere offers intelligent tools like personalized learning path generation, AI-assisted lesson planning, and automated communication drafting. These features are designed to reduce administrative load and enhance the educational experience."
    },
    {
        icon: ShieldCheck,
        title: "Security & Auditing",
        description: "Security is paramount. All sensitive actions are logged in a detailed audit trail, accessible to administrators. The platform enforces security best practices, with options for IP whitelisting, two-factor authentication, and strict password policies to protect school data."
    },
    {
        icon: Palette,
        title: "Full Customization",
        description: "Each school portal can be fully customized to match the institution's brand identity. Administrators have control over logos, color schemes, and typography, ensuring a seamless and professional user experience for their community."
    }
];

export default function DeveloperContactPage() {
    return (
        <div className="flex min-h-screen flex-col bg-secondary/20">
            <AppHeader />
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-10 lg:grid-cols-2">
                            <div className="space-y-6">
                                <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">About the Platform & Developer</h1>
                                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                                    EduSphere Kenya is a modern, secure, and scalable school management platform designed from the ground up to meet the unique needs of Kenyan educational institutions.
                                </p>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>About the Developer</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <Image src="https://i.postimg.cc/mg8cDv6H/Whats-App-Image-2025-09-21-at-5-28-36-PM.jpg" alt="Derick Kisero" width={128} height={128} className="rounded-lg shadow-lg" />
                                            <div>
                                                <h3 className="text-xl font-semibold">Derick Kisero</h3>
                                                <p className="text-muted-foreground">Lead Full-Stack Developer</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <a href="mailto:kiseroderick4@gmail.com" className="hover:underline">kiseroderick4@gmail.com</a>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <a href="tel:0748132692" className="hover:underline">0748132692</a>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>Get Started</CardTitle>
                                        <CardDescription>
                                            Interested in bringing EduSphere to your school? Contact me today to schedule a demo and discuss how we can tailor the platform to your specific needs.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-lg">
                                            Let's work together to empower your students and streamline your school's operations.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>How EduSphere Works</CardTitle>
                                        <CardDescription>A brief overview of the platform's core architecture and features.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {features.map((feature, index) => {
                                            const Icon = feature.icon;
                                            return (
                                                <div key={index} className="flex items-start gap-4">
                                                    <Icon className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <h4 className="font-semibold">{feature.title}</h4>
                                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <AppFooter />
        </div>
    );
}
