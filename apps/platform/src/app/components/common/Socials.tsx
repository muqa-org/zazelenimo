import Image from 'next/image';
import Link from 'next/link';

import icons from '@/app/components/common/Icons';
import { GitHubLink, FacebookLink } from '@/app/config';

export default function Socials() {
	return (
		<div className='items- mb-2 flex flex-col items-center gap-2 md:mb-0 md:flex-row md:gap-6'>
			<Link href={GitHubLink} className='hover:opacity-85' target='_blank'>
				<Image
					width='23'
					height='23'
					alt='GitHub logo'
					src={icons.GithubLogo}
				/>
			</Link>
			<Link href={FacebookLink} className='hover:opacity-85' target='_blank'>
				<Image
					width='20'
					height='20'
					alt='Facebook logo'
					src={icons.FacebookLogoDark}
				/>
			</Link>
		</div>
	);
}
