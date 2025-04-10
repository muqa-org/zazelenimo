import {
	upsertUserNonce,
	getUserWithNonce,
	createUserWithNonce,
} from '@muqa/db';
import { isAddress } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateBody } from '@/lib/util/auth';

import crypto from 'crypto';

const WalletNonceRequestSchema = z.object({
	address: z.string().refine(isAddress, { message: 'Invalid address' }),
});

export type WalletNonceRequestDTO = z.infer<typeof WalletNonceRequestSchema>;
export type WalletNonceResponse = {
	nonce: string;
};

const NONCE_EXPIRATION = 60 * 60 * 1000; // 1 hour

function generateNonceData() {
	const nonce = crypto.randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + NONCE_EXPIRATION);
	return { nonce, expiresAt };
}

export async function POST(req: NextRequest) {
	const body = await req.json();
	const result = validateBody(body, WalletNonceRequestSchema);
	if (result.error) {
		return NextResponse.json({ error: result.error.message }, { status: 400 });
	}

	const { address } = result.data as WalletNonceRequestDTO;

	const user = await getUserWithNonce(address);
	const nonceData = generateNonceData();

	if (user) {
		await upsertUserNonce(user, nonceData);
	} else {
		await createUserWithNonce(address, nonceData);
	}

	return NextResponse.json({ nonce: nonceData.nonce });
}
