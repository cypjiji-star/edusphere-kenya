
import { Suspense } from 'react';
import TeamDetailsClient from './TeamDetailsClient';

export const dynamicParams = false;

// Generate static params for pre-rendering
export async function generateStaticParams() {
  // In a real application, you would fetch this data from your database
  // For demonstration purposes, we'll return an empty array
  return [];
}

export default function TeamDetailsPage({ params }: { params: { teamId: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamDetailsClient params={params} />
    </Suspense>
  );
}
