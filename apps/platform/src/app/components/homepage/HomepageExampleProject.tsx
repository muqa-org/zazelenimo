'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import Container from '@/app/components/Container';
import images from '@/app/components/common/Images';

export default function HomepageExampleProject() {
	const t = useTranslations('home');

	return (
		<div className='bg-cover bg-center bg-no-repeat px-4 pt-7 leading-normal'>
			<Container className='mx-auto flex flex-col'>
				<h4 className='mb-3 text-center text-base font-normal text-grayDark'>
					{t('exampleProjectSubtitle')}
				</h4>
				<h2 className='mb-5 text-center text-4xl font-normal text-primaryBlack'>
					{t('exampleProjectTitle')}
				</h2>
				<div className='mx-0 mt-10 grid grid-cols-1 sm:gap-14 sm:p-6 sm:mx-4 lg:mx-20 lg:grid-cols-3'>
					<div className='relative col-span-1 rounded lg:static mb-6 sm:mb-0'>
						<Image
							width='325'
							height='325'
							alt='Park Sample Image'
							src={images.parkSample}
							className='h-auto w-full rounded-[30px] shadow-md'
						/>
						<div className='absolute bottom-2 left-auto right-2 lg:hidden'>
							<Image
								width='120'
								height='120'
								alt='Park Sample Image'
								src={images.mapSample}
								className='h-auto w-full rounded-[30px] shadow-md'
							/>
						</div>
					</div>

					<div className='col-span-1 hidden lg:block'>
						<Image
							width='325'
							height='325'
							alt='Park Sample Image'
							src={images.mapSample}
							className='h-auto w-full rounded-[30px] shadow-md'
						/>
					</div>

					<div className='col-span-1'>
						<div className='text-left text-base text-grayDark'>
							<p>
								<strong>{t('exampleNeighborhood')}:</strong> {t('exampleProjectNeighborhood')}
							</p>
							<p>
								<strong>{t('exampleStreet')}:</strong> {t('exampleProjectStreet')}
							</p>
							<p>
								<strong>{t('exampleLocationDescription')}:</strong> {t('exampleProjectLocation')}
							</p>
							<p className='mt-4'>
								<strong>{t('exampleProjectDescription')}:</strong> {t('exampleProjectDescriptionText')}
							</p>
						</div>
					</div>
				</div>
			</Container>
		</div>
	);
}
