import Link from 'next/link';

interface itemCard {
	Participant: string;
	Funding: string;
	Title: string;
	shortDescription: string;
	imageLink: string;
}

const SampleGrandCard = ({ item }: { item: itemCard }) => {
	console.log({ item });

	return (
		<div>
			<Link href=''>
				<div className='bg-card text-card-foreground relative overflow-hidden rounded-3xl border shadow-xl'>
					<div
						className='h-32 bg-gray-100 bg-cover bg-center'
						style={{
							backgroundImage: `url(${item.imageLink})`,
						}}
					></div>
					<div className='space-y-2 p-4'>
						<h3 className='truncate text-xl font-semibold text-gray-800'>
							{item.Title}
						</h3>
						<p className='line-clamp-3 h-[70px] text-xs leading-6'>
							{item.shortDescription}
						</p>
						<div className='flex justify-between'>{item.Participant}</div>
					</div>
				</div>
			</Link>
		</div>
	);
};

export default SampleGrandCard;
