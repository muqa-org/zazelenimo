'use client';

import { useTranslations } from 'next-intl';

import Container from '@/app/components/Container';
import { MUQALink } from '@/app/config';

export default function HomepageBanner() {
	const t = useTranslations('homeAbout');

	return (
		<div className='mx-5 py-8 pb-20 sm:mx-0'>
			<Container className='mx-auto text-center'>
				<h2 className='mb-8 text-4xl font-normal text-primaryBlack sm:text-5xl'>
					{t('title')}
				</h2>
				<div className='mx-auto text-xl text-grayDark lg:w-4/6 lg:px-20'>
					<p className='mb-6'>{t('firstParagraph')}</p>
					<p>{t('secondParagraph')}</p>
					<p>
						{t.rich('secondParagraph', {
							link: chunks => (
								<a href={MUQALink} target='_blank' className='text-green hover:opacity-85'>
									{chunks}
								</a>
							),
						})}
					</p>
				</div>
			</Container>
		</div>
	);
}
