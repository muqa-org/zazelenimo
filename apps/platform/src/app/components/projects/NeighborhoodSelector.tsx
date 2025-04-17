'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import icons from '@/app/components/common/Icons';
import { neighborhoods } from '@/app/config';

type NeighborhoodSelectorProps = {
	onChange: (neighborhoods: string[]) => void;
};

export default function NeighborhoodSelector({
	onChange,
}: NeighborhoodSelectorProps) {
	const t = useTranslations('projects');
	const [isOpen, setIsOpen] = useState(false);

	const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(
		[],
	);

	const handleCheckboxChange = (neighborhood: string) => {
		setSelectedNeighborhoods((prevSelected: string[]) =>
			prevSelected.includes(neighborhood)
				? prevSelected.filter((item: string) => item !== neighborhood)
				: [...prevSelected, neighborhood],
		);
	};

	useEffect(() => {
		onChange(selectedNeighborhoods);
	}, [selectedNeighborhoods]);

	return (
		<div className='space-y-2'>
			<h3 className='mb-5 hidden text-base font-medium text-primaryBlack lg:block'>
				{t('neighborhood')}
			</h3>
			<h3 className='mb-5 block lg:hidden'>
				<button
					onClick={() => setIsOpen(!isOpen)}
					className='mb-6 flex w-full flex-row items-center justify-between rounded border border-borderGray bg-white px-4 py-2 text-[#999999]'
				>
					<span>{t('filterNeighborhood')}</span>
					<Image
						width='13'
						height='8'
						alt='Arrow Down Icon'
						src={icons.arrowDownIconGray}
						className='ml-2'
					/>
				</button>
			</h3>
			<div className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
				{neighborhoods.map(neighborhood => (
					<label
						key={neighborhood}
						className='mb-2 flex cursor-pointer items-center'
					>
						<input
							type='checkbox'
							className='peer hidden'
							checked={selectedNeighborhoods.includes(neighborhood)}
							onChange={() => handleCheckboxChange(neighborhood)}
						/>
						<span className='flex h-5 w-5 items-center justify-center rounded-md border border-borderGrayMedium bg-[#EFEFEF] peer-checked:border-borderGrayMedium peer-checked:bg-green peer-focus:ring-2 peer-focus:ring-green'>
							{selectedNeighborhoods.includes(neighborhood) && (
								<Image
									src={icons.checkedIcon}
									alt='Add to cart'
									width={10}
									height={8}
								/>
							)}
						</span>
						<span
							className={`${selectedNeighborhoods.includes(neighborhood) ? 'text-green' : 'text-primaryBlack'} ml-2 hover:text-green`}
						>
							{neighborhood}
						</span>
					</label>
				))}
			</div>
		</div>
	);
}
