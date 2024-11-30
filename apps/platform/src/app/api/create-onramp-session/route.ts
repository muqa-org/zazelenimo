import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const OnrampSessionResource = Stripe.StripeResource.extend({
	create: Stripe.StripeResource.method({
		method: 'POST',
		path: 'crypto/onramp_sessions',
	}),
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
	apiVersion: '2024-06-20',
});

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request, { params }: { params: any }) {
	const { transaction_details } = await req.json();

	let clientSecret = '';

	const apiKey = process.env.STRIPE_SECRET_KEY || '';
	const url = 'https://api.stripe.com/v1/crypto/onramp_sessions';

	const requestData = new URLSearchParams();
	requestData.append('customer_ip_address', '8.8.8.8');
	// requestData.append(
	// 	'wallet_addresses[solana]',
	// 	'0x495A28448A06B0DF634750EB062311dDC40B3ae5',
	// );
	// requestData.append('destination_networks[]', 'solana');
	// requestData.append('destination_currencies[]', 'usdc');
	// requestData.append('destination_network', 'solana');
	// requestData.append('destination_currency', 'usdc');
	// requestData.append('destination_amount', '10');
	requestData.append(
		'wallet_addresses[ethereum]',
		'0x495A28448A06B0DF634750EB062311dDC40B3ae5',
	);
	requestData.append('destination_networks[]', 'ethereum');
	requestData.append('destination_currencies[]', 'usdc');
	requestData.append('destination_network', 'ethereum');
	requestData.append('destination_currency', 'usdc');
	requestData.append('destination_amount', '6');

	const headers = {
		Authorization: `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
		'Content-Type': 'application/x-www-form-urlencoded',
	};

	const requestOptions = {
		method: 'POST',
		headers: headers,
		body: requestData,
	};

	await fetch(url, requestOptions)
		.then(response => response.json())
		.then(data => {
			clientSecret = data.client_secret;
		})
		.catch(error => {
			console.error('Error creating onramp session:', error);
		});

	return NextResponse.json(
		{
			clientSecret: clientSecret,
		},
		{
			headers: corsHeaders,
		},
	);
}
