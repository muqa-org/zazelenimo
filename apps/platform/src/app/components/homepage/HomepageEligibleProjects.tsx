'use client';

import { useTranslations } from 'next-intl';

import Container from '@/app/components/Container';

export default function HomepageEligibleProjects() {
	const t = useTranslations('eligibleProjects');

	const eligibleProjects = [
		{
			title: t('public'),
			criteria: [
				{ label: t('publicPrivate'), eligible: false },
				{ label: t('publicStreet'), eligible: true },
			],
		},
		{
			title: t('can'),
			criteria: [
				{ label: t('canHuge'), eligible: false },
				{ label: t('canSmall'), eligible: true },
			],
		},
		{
			title: t('conflicting'),
			criteria: [
				{ label: t('conflictingMiddle'), eligible: false },
				{ label: t('conflictingGreeen'), eligible: true },
			],
		},
		{
			title: t('contains'),
			criteria: [
				{ label: t('containsTrees'), eligible: true },
				{ label: t('containsBushes'), eligible: true },
				{ label: t('containsGrass'), eligible: true },
				{ label: t('containsFlowers'), eligible: true },
				{ label: t('containsBenches'), eligible: true },
				{ label: t('containsTaps'), eligible: true },
				{ label: t('containsCleanup'), eligible: true },
				{ label: t('containsDesign'), eligible: true },
			],
		},
	];

	return (
		<div className='py-10 leading-normal sm:pb-20 sm:pt-20'>
			<Container>
				<div className='flex flex-col px-5 sm:px-16 xl:px-44'>
					<h2 className='mb-12 text-center text-4xl font-semibold'>
						{t('title')}
					</h2>

					<div className='grid grid-cols-1 gap-8 lg:grid-cols-2 xl:gap-16'>
						{eligibleProjects.map((project, index) => (
							<div
								key={index}
								className={`text-xl text-gray ${
									index % 2 !== 0 ? 'lg:pl-10' : ''
								}`}
							>
								<h3 className='mb-4 text-xl font-bold uppercase text-primaryBlack'>
									{project.title}
								</h3>
								<ul
									className={`space-y-2 ${
										project.title === t('contains') ? 'flex flex-wrap' : ''
									}`}
								>
									{project.criteria.map((criterion, idx) => (
										<li
											key={idx}
											className={`flex items-center ${
												project.title === t('contains') ? 'w-1/2' : ''
											}`}
										>
											<span
												className={
													criterion.eligible ? 'text-green-500' : 'text-red-500'
												}
											>
												{criterion.eligible ? '✅' : '🚫'}
											</span>
											<span className='ml-2'>{criterion.label}</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			</Container>
		</div>
	);
}
