'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

import icons from '@/app/components/common/Icons';

export default function LanguageSwitcher({ screen }: { screen: string }) {
	const t = useTranslations('languages');
	const locale = useLocale();

	const [isOpen, setIsOpen] = useState(false);

	const languages = [
		{ code: 'en', label: t('en') },
		{ code: 'hr', label: t('hr') },
	];

	const toggleDropdown = () => setIsOpen(!isOpen);

	const setLang = async (lang: string) => {
		const body = { lang };
		await fetch('/api/locale', { method: 'POST', body: JSON.stringify(body) });
		location.reload();
	};

	const togglerIcon =
		screen === 'mobile' ? icons.arrowDownIconGray : icons.arrowDownIconGreen;

	const globeIcon =
		screen === 'mobile' ? icons.globeIconGray : icons.globeIconGreen;

	const classNameContainer =
		screen === 'mobile'
			? 'border-borderGreenDark w-full relative inline-block text-left'
			: 'relative inline-block text-left';

	const classNameToggler =
		screen === 'mobile'
			? 'flex text-gray w-full bg-white text-xs text-[#999999] justify-between rounded-md px-3 py-2 items-center mb-6'
			: 'border-green inline-flex items-center justify-center rounded-md border px-3 py-2 text-base font-normal text-green focus:outline-none';

	const switchHolder =
		screen === 'mobile'
			? 'w-full border-borderGreen absolute right-0 mt-0 top-8 rounded-md border bg-white shadow-lg'
			: 'w-full border-borderGreen absolute right-0 mt-2 origin-top-right rounded-md border bg-white shadow-lg';

	return (
		<div className={classNameContainer}>
			<button onClick={toggleDropdown} className={classNameToggler}>
				<Image
					width='20'
					height='20'
					alt='Globe Icon'
					src={globeIcon}
					className='mr-2'
				/>
				{t(locale)}
				<Image
					width='13'
					height='8'
					alt='Arrow Down Icon'
					src={togglerIcon}
					className='ml-2'
				/>
			</button>
			{isOpen && (
				<div className={switchHolder}>
					<div className='py-1'>
						{languages.map(lang => (
							<button
								key={lang.code}
								onClick={() => setLang(lang.code)}
								className={`block px-4 py-2 text-sm ${
									locale === lang.code ? 'text-green' : 'text-primaryBlack'
								} hover:text-green`}
							>
								{lang.label}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
