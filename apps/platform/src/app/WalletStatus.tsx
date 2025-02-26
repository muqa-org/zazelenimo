'use client';

import { ReactNode } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useEffect, useState } from 'react';

function Datum({
	title,
	value,
	children,
}: {
	title: string;
	value?: string;
	children?: ReactNode;
}) {
	return (
		<div>
			<span className='mr-2 text-sm font-semibold'>{title}</span>
			{value ? <span className='text-xs'>{value}</span> : children!}
		</div>
	);
}

const isHidden = process.env.NEXT_PUBLIC_SHOW_WALLET_STATUS !== 'true';

export function WalletStatus() {
	// Always call hooks at the top level, regardless of conditions
	const [isClient, setIsClient] = useState(false);
	const { connectors, connect } = useConnect();
	const account = useAccount();

	useEffect(() => {
		setIsClient(true);
	}, []);

	// Return null after calling all hooks if conditions aren't met
	if (isHidden || !isClient) return null;

	return (
		<div className='top-30 border-gray-200 fixed left-0 h-auto w-auto bg-white px-4 py-2 opacity-80'>
			<Datum title='STATUS' value={account?.status} />
			<Datum title='CONNECTOR' value={account?.connector?.name} />
			<Datum title='CHAIN' value={account?.chain?.name} />
			<Datum title='AVAILABLE CONNECTORS'>
				<ul>
					{connectors.map(connector => (
						<li key={connector.uid} className='text-xs'>
							<button
								key={connector.uid}
								onClick={() => connect({ connector })}
							>
								{connector.name}
							</button>
						</li>
					)) ?? []}
				</ul>
			</Datum>
			<Datum title='CONNECTED ADDRESSES'>
				<ul>
					{account?.addresses?.map(address => (
						<li key={address} className='text-xs'>
							{address}
						</li>
					)) ?? []}
				</ul>
			</Datum>
		</div>
	);
}
