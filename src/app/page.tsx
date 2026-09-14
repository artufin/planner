'use client';

import dynamic from 'next/dynamic';

const PlannerApp = dynamic(() => import('@/features/planner/components/PlannerApp'), { ssr: false });

export default function Home() {
    return <PlannerApp />;
}
