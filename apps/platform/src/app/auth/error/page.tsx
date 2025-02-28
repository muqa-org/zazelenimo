'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const errorParam = searchParams.get('error');
		setError(errorParam);
	}, [searchParams]);

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
			<div className='w-full max-w-md space-y-8'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
						Authentication Error
					</h2>
					<div className='mt-4 rounded-md bg-red-50 p-4'>
						<div className='flex'>
							<div className='flex-shrink-0'>
								<svg
									className='h-5 w-5 text-red-400'
									viewBox='0 0 20 20'
									fill='currentColor'
								>
									<path
										fillRule='evenodd'
										d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
										clipRule='evenodd'
									/>
								</svg>
							</div>
							<div className='ml-3'>
								<h3 className='text-sm font-medium text-red-800'>
									{error || 'An error occurred during authentication'}
								</h3>
							</div>
						</div>
					</div>
				</div>
				<div className='mt-8 flex justify-center'>
					<Link
						href='/auth/signin'
						className='text-indigo-600 hover:text-indigo-500'
					>
						Try again
					</Link>
				</div>
			</div>
		</div>
	);
}
