'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type ProjectListHeaderProps = {
	roundId: string;
	tabChangeHandler: (tab: string) => void;
	roundIdChangeHandler: (roundId: string) => void;
};

export default function ProjectListHeader({
	roundId,
	tabChangeHandler,
	roundIdChangeHandler,
}: ProjectListHeaderProps) {
	const t = useTranslations('projects');
	const [activeTab, setActiveTab] = useState('board');

	const allowRoundInput = process.env.NEXT_PUBLIC_ALLOW_ROUND_INPUT === 'true';

	useEffect(() => {
		if (tabChangeHandler) {
			tabChangeHandler(activeTab);
		}
	}, [activeTab, tabChangeHandler]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			roundIdChangeHandler(roundId);
		}, 800);

		return () => clearTimeout(timeout);
	}, [roundId]);

	function onRoundIdInput(e: any) {
		const value = e.target.value.replace(/([^0-9]+)/gi, '');
		roundIdChangeHandler(value);
	}

	return (
		<div className='flex w-full items-center justify-between border-b border-borderGrayLight pb-10'>
			<h1 className='w-1/4 text-[28px] font-normal leading-normal text-primaryBlack md:text-4xl'>
				{activeTab === 'board' ? t('title') : t('projectsMap')}
			</h1>
			<div className='controls flex items-center gap-2'>
				{allowRoundInput && (
					<div className='flex'>
						<input
							placeholder='Round id'
							value={roundId}
							onChange={onRoundIdInput}
							className='flex h-8 w-30 rounded-md border border-input border-borderGreen px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
						/>
					</div>
				)}
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
