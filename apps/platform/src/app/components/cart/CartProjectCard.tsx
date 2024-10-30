'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import icons from '@/app/components/common/Icons';

import { getProjectProgressBGColor } from '@/app/helpers/projectHelper';
import { CartAllocation } from '@allo/kit';
import { useCart } from '@/lib/util/context/cart.context';

export default function CartProjectCard({
	item,
	variant = 'cart',
}: {
	item: CartAllocation;
	variant?: string;
}) {
	const t = useTranslations('cart');
	const [donationAmount, setDonationAmount] = useState(item.amount || 0);
	const { setAmount, removeItem } = useCart();

	let progressColor = getProjectProgressBGColor(item.project.fundedPercentage);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = e.target.value.replace(/[^0-9]/g, '') || '0';

		const amount = parseInt(value, 10);
		setAmount(item.project.id, amount);
		setDonationAmount(amount);
	};

	return (
		<div
			key={item.project.id}
			className='mb-2 flex flex-row flex-wrap items-center lg:rounded-lg lg:border lg:border-borderGrayLight lg:bg-white lg:p-4'
		>
			<Image
				width={150}
				height={95}
				src={item.project.bannerUrl ?? 'https://picsum.photos/150/95'}
				alt={item.project.name}
				className='w-full rounded-t-md lg:w-1/6 lg:rounded-md'
			/>
			<div className='w-full lg:w-4/6 lg:flex-grow lg:pl-6'>
				<div className='mb-4 h-2 w-full rounded-b bg-[#E2E2E2] lg:mt-2 lg:w-2/6 lg:rounded'>
					<div
						className={`h-full rounded-b lg:rounded ${progressColor}`}
						style={{ width: `${item.project.fundedPercentage}%` }}
					></div>
				</div>
				<h3 className='flex justify-between text-xl font-medium text-primaryBlack'>
					{item.project.name}
					<button className='inline-block lg:hidden'>
						<Image
							src={icons.trashIcon}
							alt='Trash icon'
							width={20}
							height={20}
							className='ml-4'
						/>
					</button>
				</h3>
				<p className='text-base text-gray'>
					{item.project.fundedPercentage}% {t('funded')} ({item.project.fundedAmount} €)
				</p>
			</div>
			<div className='mb-10 mt-7 flex items-center lg:mb-0 lg:mt-0'>
				{variant === 'completed' ? (
					<span>{donationAmount} €</span>
				) : (
					<>
						<div className="relative">
							<span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
							<input
								type='text'
								value={donationAmount}
								onChange={handleInputChange}
								className='w-20 rounded-md border border-borderGray px-2 py-2 pl-6 text-left text-sm text-black focus:outline-none'
							/>
						</div>
						<button
							className='lg:inline-block'
							onClick={() => removeItem(item.project.id)}>
							<Image
								src={icons.trashIcon}
								alt='Trash icon'
								width={20}
								height={20}
								className='ml-4'
							/>
						</button>
					</>
				)}
			</div>
		</div>
	);
}
