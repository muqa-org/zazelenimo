import Image from 'next/image';
import icons from '@/app/components/common/Icons';

export default function FormErrorMessage({ message }: { message: string | null }) {
	return (
		<div className='mt-1 inline-flex max-w-2xl items-start text-xs font-bold text-darkRed md:text-sm'>
			<Image
				src={icons.errorIcon}
				alt='Warning'
				width={15}
				height={15}
				className='mr-2 mt-0 inline-block md:mt-[2px]'
			/>
			{message}
		</div>
	);
}
