import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { WalletStatus } from './WalletStatus';
import { AlloKitProviders, MuqaSessionProvider } from './providers';
import Header from '@/app/Header';
import NotificationBar from '@/app/components/NotificationBar';
import Footer from '@/app/components/footer/Footer';
import { CartProvider } from '@/lib/util/context/cart.context';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });

export const metadata: Metadata = {
	title: 'Zazelenimo Split',
	description: 'Zazelenimo Split',
};

export default async function RootLayout({
	children,
	session,
}: Readonly<{
	children: React.ReactNode;
	session: any;
}>) {
	const locale = await getLocale();

	// Providing all messages to the client
	const messages = await getMessages();

	return (
		<html lang={locale}>
			<body className={`${dmSans.className} bg-[#FBFBFB] flex flex-col min-h-screen`}>
				<NextIntlClientProvider messages={messages}>
					<MuqaSessionProvider session={session}>
						<AlloKitProviders>
							<CartProvider>
								<NotificationBar message='notification' />
								<Header />
								<WalletStatus />
								<main className="flex-grow">{children}</main>
								<Footer />
							</CartProvider>
						</AlloKitProviders>
					</MuqaSessionProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
