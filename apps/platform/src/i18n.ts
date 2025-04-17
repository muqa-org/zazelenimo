import { cookies } from 'next/headers';
import { getRequestConfig as _getRequestConfig } from 'next-intl/server';

const getRequestConfig: ReturnType<typeof _getRequestConfig> = async () => {
	const cookieStore = cookies();
	const locale = cookieStore.get('lang')?.value || 'hr';

	return {
		locale,
		messages: (await import(`../messages/${locale}.json`)).default,
	};
};

export default getRequestConfig;
