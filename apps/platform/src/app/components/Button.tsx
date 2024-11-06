import * as React from 'react';
import { twMerge } from 'tailwind-merge'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>  {
	variant?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({
		children,
		className,
		variant,
		...props
	}: ButtonProps,
	ref,
	) => {
			let buttonBg = variant === 'blue' ? 'bg-blue' : 'bg-primaryBlack';
			buttonBg = variant === 'green' ? 'bg-green' : buttonBg;
			buttonBg = variant === 'link' ? 'bg-transparent' : buttonBg;

			const buttonText = variant === 'link' ? 'text-gray' : 'text-white';

			const classes = `${buttonBg} ${buttonText} flex items-center rounded-lg px-5 py-2 text-base font-normal leading-6 hover:opacity-85 focus:outline-none`;
			return (
				<button
					ref={ref}
					className={twMerge(classes, className)}
					{...props}
				>
					{children}
				</button>
			);
		}
	);
