// import axios from 'axios';

// const BASE_URL = 'https://api.connect.cometh.io';

// type verifySignatureResponse = {
// 	success: boolean;
// 	result: boolean;
// };

// // Access the API key directly from server-side environment variables
// const serverSideApiKey = process.env.ARBITRUM_SEPOLIA_COMETH_API_KEY;

// if (!serverSideApiKey) {
// 	throw new Error('ARBITRUM_SEPOLIA_COMETH_API_KEY is not set');
// }

// const api = axios.create({
// 	baseURL: BASE_URL,
// 	headers: {
// 		common: {
// 			apikey: serverSideApiKey || '',
// 		},
// 	},
// });

// export async function verifySignature(
// 	address: string,
// 	message: string,
// 	signature: string,
// ): Promise<verifySignatureResponse> {
// 	if (!serverSideApiKey) {
// 		throw new Error('Cometh API key is missing on the server.');
// 	}
// 	const body = { message, signature };
// 	console.log(`[verifySignature] Calling Cometh API for address: ${address}`);
// 	console.log(`[verifySignature] Body: ${JSON.stringify(body)}`);
// 	try {
// 		const response = await api.post(
// 			`/wallets/${address}/is-valid-signature`,
// 			body,
// 		);
// 		console.log(`[verifySignature] Response: ${JSON.stringify(response.data)}`);
// 		return response.data;
// 	} catch (error: any) {
// 		console.error(`[verifySignature] Error: ${error.response?.data}`);
// 		return { success: false, result: false };
// 	}
// }
