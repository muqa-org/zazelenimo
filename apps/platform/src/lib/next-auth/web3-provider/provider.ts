import CredentialsProvider from 'next-auth/providers/credentials';

import authorize from './authorize';

const Web3CredentialsProvider = CredentialsProvider({
	name: 'Web3 Credentials Auth',
	credentials: {
		address: { label: 'Public Address', type: 'text' },
		signedNonce: { label: 'Signed Nonce', type: 'text' },
	},
	authorize,
});

export default Web3CredentialsProvider;
