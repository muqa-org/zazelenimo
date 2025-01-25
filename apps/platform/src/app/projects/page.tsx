'use client';

import { useEffect, useMemo, useState } from 'react';
import { LoadScript, Libraries } from '@react-google-maps/api';

import Container from '@/app/components/Container';
import ProjectListHeader from '@/app/components/projects/ProjectListHeader';
import ProjectList from '@/app/components/projects/ProjectList';
import { comethConfig, FundedApplication, useApplications, Application, ApplicationStatus, useDebounce } from '@allo/kit';
import ProjectListMap from '@/app/components/projects/ProjectListMap';
import { neighborhoods } from '../config';
import { useRoundId } from '../contexts/roundIdContext';
import dummyApplications from '@/data/sample_content/applications.json';

const libraries: Libraries = [];

const USE_DUMMY_DATA = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true';

function extendApplicationData(applications: Application[]): FundedApplication[] {
	const fundedPercentages = applications.map(() => Math.floor(Math.random() * 100));
	return applications.map((app, index) => ({
		...app,
		neighborhood: neighborhoods[index]!,
		fundedAmount: app.contributors?.amount!,
	 	fundedPercentage: fundedPercentages[index]!,
		targetAmount: (fundedPercentages[index]! / 100) * app.contributors?.amount!,
	}));
}

export default function DiscoverProjectsPage() {
	const [activeTab, setActiveTab] = useState('board');

	const { roundId } = useRoundId();
	const debouncedRoundId = useDebounce(roundId, 800);

	const query = useMemo(() => ({
		where: {
			roundId: { equals: debouncedRoundId },
			status: { equals: 'APPROVED' as ApplicationStatus },
			chainId: { equals: comethConfig.chain.id },
		},
	}), [debouncedRoundId]);

	const { data, refetch, isError, error } = useApplications(query, extendApplicationData);

	const extendedDummyApplications = extendApplicationData(dummyApplications as Application[]);

	const apps = USE_DUMMY_DATA
		? extendedDummyApplications
		: data;

	if (isError) {
		console.error(error);
	}

	useEffect(() => {
		console.log('debouncedRoundId', debouncedRoundId);
		refetch();
	}, [debouncedRoundId, refetch]);

	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
	};

	return (
		<section className='py-4'>
			<Container className='mx-auto mb-6 flex flex-col justify-between gap-10 px-5 py-5'>
				<LoadScript
					googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''}
					libraries={libraries}>

					<ProjectListHeader tabChangeHandler={handleTabChange} />
					{apps && (
						<>
							{activeTab === 'board' && <ProjectList applications={apps} />}
							{activeTab === 'map' && <ProjectListMap applications={apps} />}
						</>
					)}
				</LoadScript>
			</Container>
		</section>
	);
}
