'use client';

import React, { ReactNode } from 'react';

const CryptoElementsContext = React.createContext<{ onramp: any } | null>(null);

interface CryptoElementsProps {
	stripeOnramp: any;
	children: ReactNode;
}

export const CryptoElements: React.FC<CryptoElementsProps> = ({
	stripeOnramp,
	children,
}) => {
	const [ctx, setContext] = React.useState(() => ({ onramp: null }));

	React.useEffect(() => {
		let isMounted = true;

		Promise.resolve(stripeOnramp).then(onramp => {
			if (onramp && isMounted) {
				setContext(ctx => (ctx.onramp ? ctx : { onramp }));
			}
		});

		return () => {
			isMounted = false;
		};
	}, [stripeOnramp]);

	return (
		<CryptoElementsContext.Provider value={ctx}>
			{children}
		</CryptoElementsContext.Provider>
	);
};

// React hook to get StripeOnramp from context
export const useStripeOnramp = () => {
	const context = React.useContext(CryptoElementsContext);
	return context?.onramp;
};

// React element to render Onramp UI
interface OnrampElementProps {
	clientSecret: string;
	appearance: any; // Replace 'any' with the appropriate type if known
	[key: string]: any;
}

export const OnrampElement: React.FC<OnrampElementProps> = ({
	clientSecret,
	appearance,
	...props
}) => {
	const stripeOnramp = useStripeOnramp();
	const onrampElementRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const containerRef = onrampElementRef.current;
		if (containerRef) {
			containerRef.innerHTML = '';

			if (clientSecret && stripeOnramp) {
				stripeOnramp
					.createSession({
						clientSecret,
						appearance,
					})
					.mount(containerRef);
			}
		}
	}, [clientSecret, stripeOnramp]);

	return <div {...props} ref={onrampElementRef}></div>;
};
