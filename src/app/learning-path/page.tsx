import { AppHeader } from '@/components/layout/header';
import { AppFooter } from '@/components/layout/footer';
import { LearningPathForm } from './learning-path-form';
import { Sparkles } from 'lucide-react';

export default function LearningPathPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Sparkles className="h-12 w-12 text-accent" />
              <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Personalized Learning Path Generator
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Fill out the form below to generate a custom learning path for a student using our advanced AI.
              </p>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <LearningPathForm />
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
