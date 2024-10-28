'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

import icons from '@/app/components/common/Icons';

import Navigation from '@/app/components/Navigation';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';

import { CodaFormProjectLink } from '@/app/config';
import MuqaConnectButton from '@/app/components/MuqaConnectButton';
import { useSession } from 'next-auth/react';
import { useCart } from '@/lib/util/context/cart.context';

export default function Header() {
	const { items } = useCart();
	const [isOpen, setIsOpen] = useState(false);
	const { data: session } = useSession();

	const t = useTranslations('navigation');

	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	if (session) {
		console.log(`Signed in as ${session.user?.name}`);
	} else {
		console.log('Not signed in');
	}

	return (
		<header className='border-b border-borderGray bg-white'>
			<div className='mx-auto flex items-center justify-between px-5 py-5'>
				<button className='text-2xl md:hidden' onClick={toggleMenu}>
					<Image width='24' height='18' alt='Menu Icon' src={icons.menuIcon} />
				</button>
				<div className='hidden md:flex'>
					<Navigation screen='desktop' />
				</div>

				<div className='ml-auto flex items-center justify-end'>
					{process.env.NEXT_PUBLIC_SHOW_CONNECT_BUTTON === 'true' && (
						<MuqaConnectButton className='mx-2 rounded-md bg-blue px-10 py-[0.55em]' />
					)}
					<div className='mx-1 hidden md:block'>
						<LanguageSwitcher screen='desktop' />
					</div>
					<Link
						href={CodaFormProjectLink}
						className='rounded-md bg-green px-10 py-[0.55em] mx-2 text-base font-normal text-white hover:opacity-85'
					>
						{t('propose')}
					</Link>
					{process.env.NEXT_PUBLIC_SHOW_CART_LINK === 'true' && (
						<Link
							href={'/cart'}
							className='flex items-center justify-center rounded-md bg-green px-2 py-[0.55em] text-base font-normal text-white hover:opacity-85 w-[70px]'
						>
							<Image
								src={icons.cartIconWhite}
								alt='Cart Icon'
								width={14}
								height={14}
								className='mr-2'
							/>
							{items.length}
						</Link>
					)}
				</div>
			</div>
			<div
				className={`${
					isOpen ? 'block' : 'hidden'
				} absolute left-0 top-0 h-full w-full md:hidden`}
			>
				<div className='flex h-full w-full flex-row'>
					<div className='h-full w-3/4 bg-green p-7'>
						<LanguageSwitcher screen='mobile' />
						<Navigation screen='mobile' />
					</div>
					<button
						onClick={toggleMenu}
						className='flex h-full w-1/4 flex-col items-center justify-start bg-black bg-opacity-80 p-7'
					>
						<Image
							width='24'
							height='18'
							alt='Menu Icon'
							src={icons.closeIconGray}
						/>
					</button>
				</div>
			</div>
		</header>
	);
}
