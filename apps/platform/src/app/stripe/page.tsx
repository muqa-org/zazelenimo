'use client';

import { loadStripeOnramp } from '@stripe/crypto';
import {
	CryptoElements,
	OnrampElement,
} from '@/app/stripe/StripeCryptoElements';
import Container from '@/app/components/Container';
import React, { useEffect, useState } from 'react';

const stripeOnrampPromise = loadStripeOnramp(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

export default function Stripe() {
	// const clientSecret = process.env.STRIPE_SECRET_KEY || '';

	const [clientSecret, setClientSecret] = useState('');
	const [message, setMessage] = useState('');

	useEffect(() => {
		// Fetches an onramp session and captures the client secret
		fetch(`/api/create-onramp-session`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				transaction_details: {
					destination_currency: 'usdc',
					destination_exchange_amount: '0.0001',
					destination_network: 'gnosis',
				},
			}),
		})
			.then(res => res.json())
			.then(data => {
				console.log('data', data);
				setClientSecret(data.clientSecret);
			});
	}, []);

	const onChange = React.useCallback(({ session }: any) => {
		setMessage(`OnrampSession is now in ${session.status} state.`);
	}, []);

	return (
		<section className='py-4 pb-32'>
			<Container className='mx-auto mb-6 flex flex-wrap justify-between gap-1 px-5 py-5 lg:gap-10'>
				<h1 className='w-full pb-4 pt-4 text-center text-[28px] font-normal leading-normal text-primaryBlack md:text-4xl lg:border-b lg:border-borderGrayLight lg:pb-10 lg:pt-10 lg:text-left'>
					STRIPE TEST
				</h1>
				<CryptoElements stripeOnramp={stripeOnrampPromise}>
					<OnrampElement clientSecret={clientSecret} appearance={{}} />
				</CryptoElements>
			</Container>
		</section>
	);
}
