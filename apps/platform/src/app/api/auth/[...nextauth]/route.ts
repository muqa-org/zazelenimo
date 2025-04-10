import { NextRequest } from 'next/server';
import NextAuth from 'next-auth/next';

import authOptions from '@/lib/next-auth/web3-provider/auth-options';

// Below duplicated interface from next-auth/next because it's not exported
interface RouteHandlerContext {
	params: { nextauth: string[] };
}

const handler = async function auth(
	req: NextRequest,
	context: RouteHandlerContext,
) {
	const isDefaultSigninPage =
		req.method === 'GET' && req?.nextUrl.search.includes('signin');

	// Below to skip showing the default signin page
	// because it is handled via web3 provider
	if (isDefaultSigninPage) {
		authOptions.providers.pop();
	}

	return NextAuth(req, context, authOptions);
};

export { handler as GET, handler as POST };
