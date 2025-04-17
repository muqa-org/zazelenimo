import CredentialsProvider from 'next-auth/providers/credentials';

import authorize from './authorize';

const Web3CredentialsProvider = CredentialsProvider({
	name: 'Web3 Credentials Auth',
	credentials: {
		walletAddress: { label: 'Wallet Address', type: 'text' },
		signedNonce: { label: 'Signed Nonce', type: 'text' },
		challenge: { label: 'Challenge', type: 'text' },
	},
	authorize,
});

export default Web3CredentialsProvider;
