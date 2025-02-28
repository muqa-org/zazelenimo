'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MuqaConnectButton from '@/app/components/MuqaConnectButton';

export default function SignIn() {
	const { data: session, status } = useSession();
	const router = useRouter();

	// Redirect to home if already authenticated
	useEffect(() => {
		if (status === 'authenticated') {
			router.push('/');
		}
	}, [status, router]);

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
			<div className='w-full max-w-md space-y-8'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
						Sign in to your account
					</h2>
					<p className='mt-2 text-center text-sm text-gray-600'>
						Connect your wallet to continue
					</p>
				</div>
				<div className='mt-8 flex justify-center'>
					<MuqaConnectButton className='w-full' />
				</div>
			</div>
		</div>
	);
}
