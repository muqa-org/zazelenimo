'use client';

import prisma from '@muqa/db';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import Container from '@/app/components/Container';
import HomepageRoundBoxes from '@/app/components/homepage/HomepageRoundBoxes';

import { CodaFormProjectLink } from '@/app/config/config';
type HomepageIntroProps = {
	phases: prisma.RoundPhase[];
};

export default function HomepageIntro({ phases }: HomepageIntroProps) {
	const t = useTranslations('round');

	return (
		<div className='bg-[#F0FEF7] py-36'>
			<Container className='mx-auto flex flex-col items-center justify-center px-5'>
				<h1 className='mb-7 text-center text-5xl font-normal uppercase text-primaryBlack'>
					{t('timeline')}
				</h1>
				<div className='text-center text-xl font-normal text-gray'>
					{t('timelinePeriod')}
				</div>
				<HomepageRoundBoxes phases={phases} />
				<div className='mt-10'>
					<Link
						href={CodaFormProjectLink}
						target='_blank'
						className='rounded-xl bg-green px-10 py-3 text-base font-normal text-white hover:opacity-85'
					>
						{t('buttonTitle')}
					</Link>
				</div>
			</Container>
		</div>
	);
}
