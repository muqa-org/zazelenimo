'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type ProjectListHeaderProps = {
	tabChangeHandler: (tab: string) => void;
};

export default function ProjectListHeader({
	tabChangeHandler,
}: ProjectListHeaderProps) {
	const t = useTranslations('projects');
	const [activeTab, setActiveTab] = useState('board');

	const allowRoundInput = process.env.NEXT_PUBLIC_ALLOW_ROUND_INPUT === 'true';

	useEffect(() => {
		if (tabChangeHandler) {
			tabChangeHandler(activeTab);
		}
	}, [activeTab, tabChangeHandler]);

	return (
		<div className='flex w-full items-center justify-between border-b border-borderGrayLight pb-10'>
			<h1 className='w-1/4 text-[28px] font-normal leading-normal text-primaryBlack md:text-4xl'>
				{activeTab === 'board' ? t('title') : t('projectsMap')}
			</h1>
			<div className='controls flex items-center gap-2'>
				<div className='flex h-8 space-x-1 overflow-hidden rounded-md border border-borderGreen p-0'>
					<button
						onClick={() => setActiveTab('map')}
						className={`px-3 py-[2px] text-xs font-medium uppercase leading-none ${activeTab === 'map' ? 'bg-green text-white' : 'bg-white text-green'}`}
					>
						{t('map')}
					</button>
					<button
						onClick={() => setActiveTab('board')}
						className={`px-3 py-[2px] text-xs font-medium uppercase leading-none ${activeTab === 'board' ? 'bg-green text-white' : 'bg-white text-green'}`}
					>
						{t('board')}
					</button>
				</div>
			</div>
		</div>
	);
}
