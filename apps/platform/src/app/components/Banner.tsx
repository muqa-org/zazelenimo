import Link from 'next/link';

import images from '@/app/components/common/Images';
import { CodaFormProjectLink } from '@/app/config';

const Banner = ({
	message,
	buttonText,
}: {
	message: string;
	buttonText: string;
}) => {
	return (
		<div
			className='flex flex-col items-center justify-between rounded-[30px] bg-cover bg-center bg-no-repeat px-12 py-8 md:flex-row'
			style={{ backgroundImage: `url(${images.bannerBg})` }}
		>
			<h2 className='mb-16 text-center text-4xl font-normal text-white sm:mb-0 md:text-left'>
				{message}
			</h2>
			<Link
				href={CodaFormProjectLink}
				className='rounded-md bg-white px-4 py-2 text-base font-normal text-green shadow-md hover:bg-green-50'
			>
				{buttonText}
			</Link>
		</div>
	);
};

export default Banner;
