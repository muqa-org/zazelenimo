import Image from 'next/image';
import { useState } from 'react';

import icons from '@/app/components/common/Icons';

export default function ProjectListSeachFilter() {
	const [searchTerm, setSearchTerm] = useState('');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	};

	const toggleDropdown = () => {
		setIsDropdownOpen(prevValue => !prevValue);
	};

	const handleFilterClick = (option: string) => {
		console.log(`Filter option selected: ${option}`);

		setIsDropdownOpen(false);
	};

	return (
		<div className='flex w-2/4 items-center justify-between'>
			<div className='relative mr-4 flex w-full'>
				<Image
					width='24'
					height='24'
					alt='Search Icon'
					src={icons.searchIcon}
					className='absolute left-3 top-3 h-6 w-6'
				/>
				<input
					type='text'
					placeholder='PRETRAŽI PROJEKTE'
					value={searchTerm}
					onChange={handleSearchChange}
					className='focus:border-indigo-500 w-full rounded-md border border-borderGray py-3 pl-14 pr-4 text-sm focus:outline-none'
				/>
			</div>
			<div className='relative'>
				<button
					onClick={toggleDropdown}
					className='rounded-md border border-borderGray bg-white px-4 py-3 text-sm uppercase text-gray hover:bg-gray-100 focus:outline-none'
					style={{
						backgroundImage: `url(${icons.arrowDownIcon})`,
						backgroundRepeat: 'no-repeat',
						backgroundPosition: '93% center',
						paddingRight: '30px',
					}}
				>
					Fitriraj
				</button>
				{isDropdownOpen && (
					<div className='absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-md border border-borderGray bg-white shadow-lg'>
						<ul>
							<li
								onClick={() => handleFilterClick('Option 1')}
								className='cursor-pointer px-4 py-2 hover:bg-gray-100'
							>
								Najnoviji
							</li>
							<li
								onClick={() => handleFilterClick('Option 2')}
								className='cursor-pointer px-4 py-2 hover:bg-gray-100'
							>
								Najstariji
							</li>
							<li
								onClick={() => handleFilterClick('Option 3')}
								className='cursor-pointer px-4 py-2 hover:bg-gray-100'
							>
								Najviše donacija
							</li>
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
