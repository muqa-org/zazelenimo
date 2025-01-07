import { RoundPhase as RoundPhaseType } from '@muqa/db';

import { useTranslations } from 'next-intl';

import RoundPhase from '@/app/components/RoundPhase';

type HomepageRoundBoxesProps = {
	phases: RoundPhaseType[];
};

export default function HomepageRoundBoxes({
	phases,
}: HomepageRoundBoxesProps) {
	const t = useTranslations('round');

	return (
		<div className='mt-10 flex w-full flex-col items-center justify-center gap-2 p-5 pb-1.5 lg:flex-row'>
			{phases.map(phase => (
				<RoundPhase
					key={phase.id}
					title={t(`round${phase.title}`)}
					//startDate={new Date(phase.startDate)}
					//endDate={new Date(phase.endDate)}
				/>
			))}
		</div>
	);
}
