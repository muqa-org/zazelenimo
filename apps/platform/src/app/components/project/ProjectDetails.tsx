'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import ProjectSidebar from '@/app/components/project/ProjectSidebar';
import ProjectMap from '@/app/components/project/ProjectMap';
import ProjectSocialIcons from '@/app/components/project/ProjectSocialIcons';

import { getProjectProgressBGColor } from '@/app/helpers/projectHelper';
import { Application, comethConfig, FundedApplication, useApplicationById } from '@allo/kit';
import { useParams } from 'next/navigation';
import { neighborhoods } from '@/app/config';
import { useRoundId } from '@/app/contexts/roundIdContext';
import dummyApplications from '@/data/sample_content/applications.json';

interface ProjectCardProps {
	className?: string;
}

const USE_DUMMY_DATA = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true';

function extendApplicationData(application: Application): FundedApplication {
	const fundedPercentage = Math.round(Math.random() * 100);
	const targetAmount = Math.round(fundedPercentage / 100 * application.contributors?.amount!);
	const fundedAmount = Math.round(fundedPercentage / 100 * targetAmount);
	return {
		...application,
		neighborhood: neighborhoods[0]!,
		fundedAmount,
		fundedPercentage,
		targetAmount,
	};
}

const useDummyApplication = (): FundedApplication => {
	const { projectId: applicationId } = useParams();
	const application = dummyApplications.find(app => app.id === applicationId);
	if (!application) {
		return extendApplicationData(dummyApplications[0] as Application);
	}
	return extendApplicationData(application as Application);
}

function useResolvedApplication(): FundedApplication | undefined {
	return USE_DUMMY_DATA
		? useDummyApplication()
		: useActualApplication();
}

function useActualApplication(): FundedApplication | undefined {
	const { roundId } = useRoundId();
	const { projectId: applicationId } = useParams();
	const { data: application } = useApplicationById(
		applicationId as string,
		{ roundId, chainId: comethConfig.chain.id },
		extendApplicationData,
	);
	return application;
}

export default function ProjectDetails({ className }: ProjectCardProps) {
	const t = useTranslations('project');

	const application = useResolvedApplication();

	if (!application) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<p className="text-xl text-grayDark">{t('applicationNotFound')}</p>
			</div>
		);
	}

	let progressColor = getProjectProgressBGColor(application?.fundedPercentage);

	return (
		<div className={`${className} flex h-full w-full flex-col flex-wrap justify-between`}>
			<h1 className='w-full border-b border-borderGrayLight pb-10 pt-10 text-[28px] font-normal leading-normal text-primaryBlack md:text-4xl'>
				{application.name}
			</h1>
			<div className='flex flex-row flex-wrap justify-between pb-8 pt-14 lg:pb-0'>
				<div className='w-full lg:w-4/6'>
					<Image
						width='1028'
						height='221'
						src={application.bannerUrl || 'https://picsum.photos/908/514'}
						alt='Project Image'
						className='w-full rounded-t-xl lg:rounded-xl'
					/>
					<div className='mb-4 h-2 w-full rounded-b bg-[#E2E2E2] lg:hidden'>
						<div
							className={`h-full rounded-b ${progressColor}`}
							style={{ width: `${application.fundedPercentage}%` }}
						></div>
					</div>
				</div>
				<div className='w-full lg:w-2/6 lg:pl-20'>
					<ProjectSidebar application={application} />
				</div>
			</div>
			<div className='w-full lg:w-4/6'>
				<ProjectMap />
			</div>
			<div className='content mt-6 w-full text-base text-grayDark lg:w-4/6'>
				{application.description}
			</div>
			<div className='mb-6 mt-14 w-full lg:w-4/6'>
				<h3>{t('supportProject')}</h3>
				<ProjectSocialIcons
					id={application.id}
					title={application.name}
				/>
			</div>
		</div>
	);
}
