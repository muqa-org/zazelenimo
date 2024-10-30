import Container from '@/app/components/Container';
import Socials from '@/app/components/common/Socials';
import FooterLinks from '@/app/components/footer/FooterLinks';

export default function Footer() {
	return (
		<footer className='bg-[#F6F6F6] py-4 lg:py-12'>
			<Container className='mx-auto flex flex-col-reverse items-center justify-between px-3 py-2 md:px-5 md:py-5 md:flex-row gap-2 md:gap-0'>
				<Socials />
				<FooterLinks />
			</Container>
		</footer>
	);
}
