import { FundedApplication } from '@allo/kit';
import React from 'react';

import AddToCart from '@/app/components/cart/AddToCart';
import { getProjectProgressBGColor } from '@/app/helpers/projectHelper';

type ProjectMapInfoWindowProps = {
	application: FundedApplication;
};

export default function ProjectMapInfoWindow({
	application,
}: ProjectMapInfoWindowProps) {
	const progressColor = getProjectProgressBGColor(application.fundedPercentage);

	return (
		<div className='rounded-lg bg-white p-0 shadow-lg'>
			<div className='mb-4 h-1.5 w-full rounded-full bg-gray'>
				<div
					className={`h-full rounded-full ${progressColor}`}
					style={{ width: `${application.fundedPercentage}%` }}
				></div>
			</div>
			<div className='flex items-center justify-between'>
				<h3 className='text-xl font-medium text-primaryBlack'>
					{application.name}
				</h3>
				<div className='ml-4'>
					<AddToCart variant='icon' application={application} />
				</div>
			</div>
			<p className='text-base text-gray'>
				{application.fundedPercentage}% funded ({application.fundedAmount} €)
			</p>
		</div>
	);
}
