import Image from 'next/image';
import Link from 'next/link';

import icons from '@/app/components/common/Icons';

interface PaginationProps {
	baseLink: string;
	totalPages: number;
	currentPage: number;
	maxVisiblePages: number;
}

export default function Pagination({
	currentPage,
	totalPages,
	baseLink,
	maxVisiblePages = 5,
}: PaginationProps) {
	const generatePageNumbers = () => {
		const pages = [];
		const half = Math.floor(maxVisiblePages / 2);
		let start = Math.max(1, currentPage - half);
		let end = Math.min(totalPages, currentPage + half);

		if (currentPage - half < 1) {
			end = Math.min(totalPages, end + (half - currentPage + 1));
		}

		if (currentPage + half > totalPages) {
			start = Math.max(1, start - (currentPage + half - totalPages));
		}

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		return pages;
	};

	const pages = generatePageNumbers();

	return (
		<div className='my-12 flex items-center justify-center space-x-2'>
			{currentPage > 1 && (
				<Link href={`${baseLink}${currentPage - 1}`}>
					<Image
						width='24'
						height='24'
						alt='Previous'
						src={icons.arrowLeftIcon}
					/>
				</Link>
			)}
			{pages.map(page => (
				<Link
					key={page}
					href={`${baseLink}${page}`}
					className={`rounded px-2 py-1 ${page === currentPage ? 'text-sm font-normal text-black' : 'text-sm font-normal text-gray hover:text-gray-600'}`}
				>
					{page}
				</Link>
			))}
			{pages[pages.length - 1] ||
				(0 < totalPages && (
					<>
						<span className='px-2 py-1 text-sm font-normal text-gray'>...</span>
						<Link
							href={`${baseLink}${totalPages}`}
							className='rounded px-2 py-1 text-sm font-normal text-gray hover:text-gray-600'
						>
							{totalPages}
						</Link>
					</>
				))}
			{currentPage < totalPages && (
				<Link href={`${baseLink}${currentPage + 1}`}>
					<Image width='24' height='24' alt='Next' src={icons.arrowRightIcon} />
				</Link>
			)}
		</div>
	);
}
