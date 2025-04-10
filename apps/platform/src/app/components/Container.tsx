export default function Container({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={`${className} mx-auto px-1 xl:max-w-7xl xl:px-3 2xl:max-w-[1440px] 2xl:px-0`}
		>
			{children}
		</div>
	);
}
