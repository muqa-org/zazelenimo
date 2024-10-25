'use client';

import { useEffect, useMemo, useState } from 'react';
import { LoadScript, Libraries } from '@react-google-maps/api';

import Container from '@/app/components/Container';
import ProjectListHeader from '@/app/components/projects/ProjectListHeader';
import ProjectList from '@/app/components/projects/ProjectList';
import { comethConfig, FundedApplication, useApplications, Application, ApplicationStatus } from '@allo/kit';
import ProjectListMap from '@/app/components/projects/ProjectListMap';

const fundPercentages = [20, 50, 75, 10, 30, 45, 88, 38, 90, 85, 32, 15];

	const applications: FundedApplication[] = fundPercentages.map((fundedPercentage) => {
		const targetAmount = Math.floor(Math.random() * 10000);
		return {
			id: crypto.randomUUID(),
			name: 'Klupe od Đardina do Jokera',
			description: 'Klupe od Đardina do Jokera',
			recipient: `0x${Math.random().toString(16).slice(2, 40)}`,
			chainId: 1,
			projectId: crypto.randomUUID(),
			status: 'APPROVED',
			bannerUrl: 'https://picsum.photos/150/95',

			targetAmount,
			fundedAmount: Math.floor(targetAmount * (fundedPercentage / 100)),
			fundedPercentage,
		};
	});

// If you need some special libraries, you can add them here
const libraries: Libraries = [];

function useDebounce<T>(value: T, delay = 800) {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(timeout);
	}, [value, delay]);

	return debouncedValue;
}

export default function DiscoverRoundsPage() {
	const defaultRoundId = process.env.NEXT_PUBLIC_DEFAULT_ROUND_ID ?? '';

	const [activeTab, setActiveTab] = useState('board');
	const [roundId, setRoundId] = useState(defaultRoundId);
	const debouncedRoundId = useDebounce(roundId, 800);

	const query = useMemo(() => ({
		where: {
			roundId: { equals: debouncedRoundId },
			status: { equals: 'APPROVED' as ApplicationStatus },
			chainId: { equals: comethConfig.chain.id },
		},
	}), [debouncedRoundId]);

	const { data: apps, refetch, isError, error } = useApplications(query);

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

	const handleRoundIdChange = (roundId: string) => {
		setRoundId(roundId);
	};

	return (
		<section className='py-4'>
			<Container className='mx-auto mb-6 flex flex-col justify-between gap-10 px-5 py-5'>
				<LoadScript
					googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''}
					libraries={libraries}
				>
					<ProjectListHeader
						roundId={roundId}
						tabChangeHandler={handleTabChange}
						roundIdChangeHandler={handleRoundIdChange}
					/>
					{activeTab === 'board' && <ProjectList applications={applications} />}
					{activeTab === 'map' && <ProjectListMap applications={applications} />}
				</LoadScript>
			</Container>
		</section>
	);
}


// "use client";
// import { DiscoverRounds } from "@allo-team/kit";
// import Link from "next/link";

// export default function DiscoverRoundsPage({ params: { chainId = 1 } }) {
//   return (
//     <section>
//       <h3 className="text-lg font-semibold">Discover Rounds</h3>
//       <DiscoverRounds
//         /*
//       DiscoverRounds is a pre-made component that does most of the heavy lifting
//       in fetching and displaying rounds.

//       It fetches the rounds based on a provided query (with sane defaults) and
//       renders it (as a grid by default but easy to customize with own components).
//     */
//         query={{
//           /*
//         The query prop enables a powerful way to fetch data from the indexer.

//         For example:
//         - only rounds with these strategies (deployed contract address)
//         - order by when they were created, newest first
//         - with first and offset we can paginate the results and decide how many to show */
//           where: {
//             chainId: { in: [Number(chainId)] },
//             // Approved applications
//             applications: {
//               where: { status: { in: ["APPROVED"] } },
//               orderBy: { status: "asc" },
//             },
//           },

//           orderBy: { unique_donors_count: "desc" },
//           offset: 0,
//           first: 12,
//         }}
//         /*

//       The renderItem function lets us change what component is rendered.

//       For example:
//         - Wrap the default RoundItem component in a link  */
//         renderItem={(round, Component) => (
//           <Link href={`/${round.chainId}/rounds/${round.id}`} key={round.id}>
//             <Component {...round} />
//           </Link>
//         )}
//         /*

//       Columns let us choose how to render the rounds.

//       For example:
//       - 1 column on phones
//       - 2 columns on small to medium
//       - 3 columns on medium to large
//       - 4 columns on large and above

//       We could also set it to [1] to render as list on all screens
//       */
//         columns={[1, 2, 3]}
//       />
//     </section>
//   );
// }
