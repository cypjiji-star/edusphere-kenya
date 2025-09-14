
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { cache } from 'react';

const defaultProfile = {
    name: 'EduSphere Kenya',
    motto: 'Empowering Education for All',
    logoUrl: 'https://picsum.photos/seed/default-logo/200',
    coverImageUrl: 'https://picsum.photos/seed/default-cover/1200/1800',
};

// Use React's cache function to memoize the data fetching for a given schoolId
export const getSchoolProfile = cache(async (schoolId?: string) => {
    if (!schoolId) {
        return defaultProfile;
    }

    try {
        const profileRef = doc(firestore, 'schoolProfile', schoolId);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
            const data = profileSnap.data();
            return {
                name: data.name || defaultProfile.name,
                motto: data.motto || defaultProfile.motto,
                logoUrl: data.logoUrl || defaultProfile.logoUrl,
                coverImageUrl: data.coverImageUrl || defaultProfile.coverImageUrl,
            };
        } else {
            return defaultProfile;
        }
    } catch (error) {
        console.error("Error fetching school profile:", error);
        return defaultProfile;
    }
});
