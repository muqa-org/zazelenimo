'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { getProjectProgressBGColor } from '@/app/helpers/projectHelper';

import AddToCart from '@/app/components/cart/AddToCart';
import { FundedApplication } from '@allo/kit';

type ProjectSidebarProps = {
	application: FundedApplication;
};

export default function ProjectSidebar({ application }: ProjectSidebarProps) {
	const t = useTranslations('project');
	const [donationAmount, setDonationAmount] = useState(10);

	// You can adjust this
	const estimatedMatch = Math.round(donationAmount * 28.6);

	let progressColor = getProjectProgressBGColor(application.fundedPercentage);

	const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDonationAmount(Number(e.target.value));
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/[^0-9]/g, '');
		if (value === '') {
			setDonationAmount(0);
		} else {
			setDonationAmount(parseInt(value, 10));
		}
	};

	return (
		<>
			<div className='mb-4 hidden h-2 w-full rounded-full bg-[#E2E2E2] lg:block'>
				<div
					className={`h-full rounded-full ${progressColor}`}
					style={{ width: `${application.fundedPercentage}%` }}
				></div>
			</div>
			<h2 className='mt-3 text-[32px] text-[#09CE78]'>€ {application.fundedAmount}</h2>
			<h4 className='leading-normal text-gray'>
				{t('funded', { amount: application.targetAmount })}
			</h4>
			<h3 className='mt-8 text-[32px] leading-normal text-[#3F3F3F]'>67</h3>
			<h4 className='leading-normal text-gray'>{t('backers')}</h4>
			<h3 className='mt-8 text-[32px] leading-normal text-[#3F3F3F]'>34</h3>
			<h4 className='leading-normal text-gray'>{t('daysGo')}</h4>

			<div className='mt-8 border-t border-borderGray pt-8'>
				<div className='mb-6 flex flex-row items-center justify-between'>
					<label htmlFor='donation-slider' className='text-xs text-black'>
						{t('donationAmount')}
					</label>
					<input
						type='range'
						id='donation-slider'
						min='0'
						max='100'
						value={donationAmount}
						onChange={handleSliderChange}
						className='h-2 w-2/6 appearance-none'
						style={{
							background: `linear-gradient(to right, #39A56A ${donationAmount}%, black ${donationAmount}%)`,
						}}
					/>
					<div className="relative">
						<span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray">€</span>
						<input
							type='text'
							id='donation-amount'
							value={donationAmount}
							onChange={handleInputChange}
							className='w-20 rounded-md border border-borderGray px-2 py-2 pl-6 text-left text-sm text-black focus:outline-none'
						/>
					</div>
				</div>

				<div className='mb-6 flex items-center justify-between'>
					<label className='text-xs text-black'>{t('estimatedMatch')}</label>
					<input
						type='text'
						value={`€ ${estimatedMatch}`}
						readOnly
						className='w-20 rounded-md border border-borderGray px-2 py-2 text-left text-sm text-grayLight focus:outline-none'
					/>
				</div>
				<AddToCart application={application} amount={donationAmount} variant='text' />
			</div>
		</>
	);
}
