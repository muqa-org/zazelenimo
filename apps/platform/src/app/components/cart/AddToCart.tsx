import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Noto_Sans } from 'next/font/google';

import icons from '@/app/components/common/Icons';
import { FundedApplication } from '@allo/kit';
import { useCart } from '@/lib/util/context/cart.context';

const notoSans = Noto_Sans({
	subsets: ['latin'],
	weight: ['400'],
	style: ['normal'],
	display: 'swap',
});

interface AddButtonProps {
	application: FundedApplication
	amount?: number;
	className?: string;
	variant: 'icon' | 'text';
}


export default function AddToCart({ application, amount, className, variant }: AddButtonProps) {
	const t = useTranslations('cart');
	const { addItem } = useCart();

	const addToCart = () => {
		addItem(application, amount);
	}

	return (
		<button
			className={`${className} ${notoSans.className} active:scale-75 transition-transform`}
			onClick={addToCart}
		>
			{variant === 'icon' ? (
				<Image
					src={icons.cartIconGreen}
					alt='Add to cart'
					width={18}
					height={15}
					className='mx-2 my-1'
				/>
			) : (
				<span className='flex flex-row items-center justify-between rounded-md bg-green px-5 py-3 text-base text-white hover:opacity-85 active:bg-green/90'>
					<span>
						<Image
							src={icons.cartIconWhite}
							alt='Add to cart'
							width={18}
							height={15}
							className='mr-4'
						/>
					</span>
					{t('addCart')}
				</span>
			)}
		</button>
	);
}
