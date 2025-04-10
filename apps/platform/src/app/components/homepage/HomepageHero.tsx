'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import Container from '@/app/components/Container';
import images from '@/app/components/common/Images';

export default function HomepageHero({ locale }: { locale: string }) {
	const t = useTranslations('home');

	const logo =
		locale === 'hr' ? images.zazelenimoLogohr : images.zazelenimoLogo;

	return (
		<div
			style={{
				backgroundImage: ` url("${images.heroGreenEye}"), url("${images.heroGreenPNG}")`,
				backgroundPosition: 'bottom right, center -155px',
				backgroundRepeat: 'no-repeat, no-repeat',
			}}
			className='bg-[length:120%,cover] bg-no-repeat px-5 pb-[25em] pt-20 sm:pb-[40em] md:pb-[40em] lg:bg-[length:auto,cover] lg:pb-[16em] lg:pt-44'
		>
			<Container className='mx-auto flex flex-col'>
				<Image width='354' height='83' alt='Zazelenimo Split Logo' src={logo} />
				<div className='w-full pt-9 text-[32px] font-normal text-white lg:w-1/3'>
					{t('heroText')}
				</div>
			</Container>
		</div>
	);
}
