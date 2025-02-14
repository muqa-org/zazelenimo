import Image from 'next/image';

import icons from './common/Icons';

interface RoundBoxProps {
	title: string;
	startDate: Date;
	endDate: Date;
}

export default function RoundPhase({ title, startDate, endDate }: RoundBoxProps) {
	const now = new Date();
	let type = 'future';

	if (new Date(endDate) < now) {
		type = 'past';
	} else if (new Date(startDate) <= now && new Date(endDate) >= now) {
		type = 'current';
	}

	let bgColor = type === 'past' ? 'bg-[#77b995]' : 'bg-white';
	bgColor = type === 'current' ? 'bg-green' : bgColor;

	let titleColor = type === 'past' ? 'text-white' : 'text-grayLight';
	titleColor = type === 'current' ? 'text-white' : titleColor;

	const formattedDateTime = `${startDate.getDate()}.${startDate.getMonth() + 1}. - ${endDate.getDate()}.${endDate.getMonth() + 1}.${endDate.getFullYear()}. | ${endDate.getHours()}:${String(endDate.getMinutes()).padStart(2, '0')} h`;

	return (
		<div
			className={`flex w-full items-center justify-between rounded-lg border border-gray-300 ${bgColor} ${titleColor} mb-3.5 px-2.5 py-2`}
		>
			<div className='relative w-full'>
				<h4 className='mb-2 text-base font-bold'>{title}</h4>
				{/* <p className='text-sm font-medium'>{formattedDateTime}</p> */}
				{type === 'past' && (
					<span className='absolute right-1 top-1 block h-[18px] w-[18px]'>
						<Image
							width='18'
							height='18'
							alt='Confirmed Icon White'
							src={icons.confirmedIconWhite}
						/>
					</span>
				)}
				{type === 'current' && (
					<span className='absolute right-1 top-1 block h-4 w-4 rounded-full bg-[#28F875]'></span>
				)}
				{type === 'future' && (
					<span className='absolute right-1 top-1 block h-4 w-4 rounded-full border border-gray'></span>
				)}
			</div>
		</div>
	);
}
