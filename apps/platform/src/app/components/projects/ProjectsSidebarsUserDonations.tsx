export default function ProjectsSidebarsUserDonations() {
	return (
		<div className='mt-10 rounded-lg border border-lightGray p-5 pb-10 shadow-[0_8px_18px_rgba(0,0,0,0.08),0_0px_1px_rgba(0,0,0,0.05)]'>
			<h3 className='mb-4 text-[32px] font-normal uppercase text-primaryBlack'>
				Moje donacije
			</h3>
			<div>
				<h4 className='mb-2 w-full text-left text-base uppercase text-gray'>
					Odabrani projekti
				</h4>
				<div className='text-2xl font-bold uppercase text-gray'>
					<span className='text-primaryBlack'>0</span> <span>OD 22</span>
				</div>
			</div>
			<div className='mt-4 space-y-2 border-t border-borderGray pt-5'>
				<h4 className='mb-2 w-full text-left text-base uppercase text-gray'>
					Donirano
				</h4>
				<div className='text-2xl font-bold uppercase text-primaryBlack'>
					0 EUR
				</div>
			</div>
		</div>
	);
}
