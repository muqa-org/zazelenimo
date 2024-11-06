'use client'
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import icons from '../common/Icons';
import { DocumentationLink, ForumLink } from '@/app/config';

export default function FooterLinks() {
	const t = useTranslations('footer');

	return (
		<div className='flex flex-col md:flex-row items-center gap-2 md:gap-10'>
			<Link
				href={DocumentationLink}
				className='flex items-center gap-2 font-medium leading-6 text-primaryBlack hover:text-blue'
				target='_blank'
			>
				{t('documentation')}
				<Image
					width='20'
					height='20'
					alt='Top Right Arrow'
					src={icons.topRightArrowIcon}
				/>
			</Link>
			<Link
				href={ForumLink}
				className='flex items-center gap-2 font-medium leading-6 text-primaryBlack hover:text-blue'
			>
				{t('forum')}
				<Image
					width='18'
					height='18'
					alt='Top Right Arrow'
					src={icons.topRightArrowIcon}
				/>
			</Link>
		</div>
	);
}
