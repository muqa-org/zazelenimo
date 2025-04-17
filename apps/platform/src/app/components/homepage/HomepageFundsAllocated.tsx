'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import Container from '@/app/components/Container';
import Images from '@/app/components/common/Images';

export default function HomepageFundsAllocated() {
	const t = useTranslations('fundsAllocated');

	return (
		<div className='py-16 pb-12'>
			<Container className='mx-auto justify-between'>
				<div className='mx-5 mb-20 h-[1px] border-2 border-dashed border-borderGray lg:mx-0'></div>
				<div className='mx-5 flex flex-row flex-wrap items-center text-center lg:mx-32 lg:items-start lg:text-left'>
					<div className='mb-16 w-full lg:mb-0 lg:w-1/3'>
						<Image
							width={394}
							height={240}
							src={Images.contributionMatchedSample}
							alt='Contribution Matched Sample'
							className='inline-block'
						/>
					</div>
					<div className='w-full lg:w-2/3 lg:pl-24'>
						<h2 className='mb-6 text-5xl font-normal text-primaryBlack'>
							{t('title')}
						</h2>
						<div className='text-base text-grayDark'>
							<p className='mb-4'>{t('votingMechanism')}</p>
							<p>{t('allowsAnyone')}</p>
						</div>
					</div>
				</div>
			</Container>
		</div>
	);
}
