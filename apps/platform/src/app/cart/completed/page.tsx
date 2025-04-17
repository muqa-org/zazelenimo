import { Noto_Sans } from 'next/font/google';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import Container from '@/app/components/Container';
import CartProjectCard from '@/app/components/cart/CartProjectCard';
import icons from '@/app/components/common/Icons';
import { useCart } from '@/lib/util/context/cart.context';

const notoSans = Noto_Sans({
	subsets: ['latin'],
	weight: ['400'],
	style: ['normal'],
	display: 'swap',
});

export default function CartCompleted() {
	const t = useTranslations('cart');

	const { items } = useCart();

	return (
		<section className='py-4 pb-32'>
			<Container className='mx-auto mb-6 flex flex-wrap justify-between gap-1 px-5 py-5 lg:gap-10'>
				<h1 className='w-full pb-4 pt-4 text-center text-[28px] font-normal leading-tight text-primaryBlack md:text-4xl lg:border-b lg:border-borderGrayLight lg:pb-10 lg:pt-10 lg:text-left lg:leading-normal'>
					{t('donationSuccess')}
					<Image
						src={icons.partyIcon}
						width={37}
						height={37}
						alt='Party Icon'
						className='mb-3 ml-2 inline-block'
					/>
					<span className='mt-3 block px-8 text-base text-gray lg:mt-0 lg:px-0'>
						{t('resultAvailable')} Nov 15 2024
					</span>
				</h1>
				<div className='mt-4 flex w-full flex-row flex-wrap justify-between'>
					<div className='mb-8 flex w-full flex-col gap-4 lg:mb-0 lg:w-4/6'>
						{items.map(item => (
							<CartProjectCard
								key={item.project.id}
								item={item}
								variant='completed'
							/>
						))}
					</div>

					<div className='w-full pl-0 lg:w-2/6 lg:pl-24'>
						<div className='mb-10'>
							<h2 className='text-base font-normal text-gray'>
								{t('totalAmount')}
							</h2>
							<p className='mt-8 text-[32px] font-normal text-primaryBlack'>
								€ 30
							</p>
						</div>
					</div>
				</div>
			</Container>
		</section>
	);
}
