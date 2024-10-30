import Container from '@/app/components/Container';
import Socials from '@/app/components/common/Socials';
import FooterLinks from '@/app/components/footer/FooterLinks';
import FooterRoundId from './FooterRoundId';

export default function Footer() {
	const allowRoundInput = process.env.NEXT_PUBLIC_ALLOW_ROUND_INPUT === 'true';

	return (
		<footer className='bg-[#F6F6F6] py-4 lg:py-12'>
			<Container className='mx-auto flex flex-col-reverse items-center justify-between px-3 py-2 md:px-5 md:py-5 md:flex-row gap-2 md:gap-0'>
				{allowRoundInput && <FooterRoundId />}
				<Socials />
				<FooterLinks />
			</Container>
		</footer>
	);
}
