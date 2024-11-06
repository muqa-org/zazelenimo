import Image from 'next/image';
import Link from 'next/link';

import AddToCart from '@/app/components/cart/AddToCart';
import { getProjectProgressBGColor } from '@/app/helpers/projectHelper';
import { FundedApplication } from '@allo/kit';

interface ProjectCardProps {
	application: FundedApplication;
	className?: string;
}

export default function ProjectCard({
	application,
	className,
}: ProjectCardProps) {
	let progressColor = getProjectProgressBGColor(application.fundedPercentage);

	return (
		<div className={`${className} flex h-full flex-col gap-1 overflow-hidden`}>
			<div className='relative mb-2'>
				<Image
					width='330'
					height='135'
					src={application.bannerUrl ?? 'https://picsum.photos/150/95'}
					alt='Project Image'
					className='w-full rounded-t-md'
				/>
				<div className='h-1.5 rounded-b-md bg-white'>
					<div
						className={`h-1.5 rounded-b-md ${progressColor}`}
						style={{ width: application.fundedPercentage + '%' }}
					></div>
				</div>
			</div>
			<div className='px-0 pb-1 pt-2'>
				<h3 className='flex items-center justify-between gap-1'>
					<Link
						href={`projects/${application.id}`}
						className='text-xl font-medium leading-normal text-primaryBlack hover:text-green'
					>
						{application.name}
					</Link>
					<AddToCart variant='icon' application={application} />
				</h3>
			</div>
			<div className='text-base text-gray'>
				{application.fundedPercentage}% funded (${application.fundedAmount} €)
			</div>
		</div>
	);
}
