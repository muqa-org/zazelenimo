'use client';

import { useTranslations } from 'next-intl';

import Container from '@/app/components/Container';
import HomepageRoundBoxes from '@/app/components/homepage/HomepageRoundBoxes';
import { MuqaConnectButton } from '../MuqaConnectButton';

export default function HomepageIntro() {
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
				<HomepageRoundBoxes />
				<div className='mt-10'>
					<button className='rounded-xl bg-green text-base font-normal px-10 py-3 text-white hover:opacity-85'>
						{t('buttonTitle')}
					</button>
				</div>
			</Container>
		</div>
	);
}
