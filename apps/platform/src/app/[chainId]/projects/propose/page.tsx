'use client';

import { useFormState } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { createProjectAction } from './actions';

import Container from '@/app/components/Container';
import ProjectProposalFormButton from '@/app/components/project/ProjectProposalFormButton';
import icons from '@/app/components/common/Icons';

type FileWithPreview = {
	file: File;
	url: string;
};

type MessageType = {
	key: string;
	notice: string;
};

const getErrorMessage = (
	messages: MessageType[] | string[],
	key: string,
): string | null => {
	const message = (messages as MessageType[]).find(msg => msg.key === key);
	return message ? message.notice : null;
};

export default function CreateProjectPage() {
	const t = useTranslations('proposalForm');

	const [isChecked, setIsChecked] = useState(false);

	const handleCheckboxChange = () => {
		setIsChecked(prevState => !prevState);
	};

	const [state, formAction] = useFormState(createProjectAction, {
		message: [],
		status: false,
	});

	const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files: File[] = event.target.files
			? Array.from(event.target.files)
			: [];

		// Map through files and create a preview URL for each file
		const filePreviews: FileWithPreview[] = files.map(file => ({
			file,
			url: URL.createObjectURL(file),
		}));

		setSelectedFiles(prevFiles => [...prevFiles, ...filePreviews]);
	};

	const handleButtonClick = () => {
		if (inputRef.current) {
			inputRef.current.click();
		}
	};

	const removeFile = (index: number) => {
		const updatedFiles = selectedFiles.filter((_, i) => i !== index);
		setSelectedFiles(updatedFiles);

		// Create a new FileList based on updatedFiles
		const dataTransfer = new DataTransfer();
		updatedFiles.forEach(filePreview => {
			dataTransfer.items.add(filePreview.file);
		});

		// Update the inputRef to reflect the new FileList
		if (inputRef.current) {
			inputRef.current.files = dataTransfer.files;
		}
	};

	const handleSubmit = (formData: FormData) => {
		selectedFiles.forEach(({ file }) => {
			formData.append('photo', file);
		});
	};

	useEffect(() => {
		if (state.status && getErrorMessage(state.message, 'success')) {
			const timer = setTimeout(() => {
				if (state.message[0]) {
					window.location.href = state.message[0].notice;
				}
			}, 15000);

			return () => clearTimeout(timer);
		}
	}, [state.status, state.message]);

	if (state.status && getErrorMessage(state.message, 'success')) {
		return (
			<div className='mx-auto mb-10 mt-10 flex h-[calc(100vh-395px)] w-11/12 flex-col items-center justify-center md:w-6/12'>
				<h1 className='mb-6 text-center text-2xl font-bold'>{t('success')}</h1>
				<p className='text-center text-lg'>{t('successDesc')}</p>
			</div>
		);
	}

	return (
		<section className='md:py-4'>
			<Container className='mx-auto mb-6 flex flex-wrap justify-between gap-10 px-5 py-5'>
				<div className='flex h-full w-full flex-col flex-wrap justify-between'>
					<h1 className='w-full border-b border-borderGrayLight pb-10 pt-4 text-center text-[28px] font-normal leading-normal text-primaryBlack md:pb-14 md:text-left md:text-4xl'>
						{t('title')}
					</h1>
				</div>
				<div className='w-full'>
					<form
						id='proposal-form'
						action={formAction}
						className='mx-auto py-4 md:p-4'
					>
						<div className='flex flex-row flex-wrap'>
							<div className='w-full md:w-1/2 md:pr-16'>
								<h2 className='mb-2 text-[28px] text-primaryBlack'>
									{t('details')}
								</h2>
								<div className='mb-6 text-base text-black'>
									{t('description')}
								</div>
								<div className='mb-6'>
									<label
										htmlFor='project'
										className='text-softBlack mb-2 block text-sm font-bold'
									>
										{t('projectTitle')}&nbsp;
										<span className='font-normal'>
											({t('projectTitleSuffix')})
										</span>
									</label>
									<div className='text-grayMiddle mb-2 text-xs'>
										{t('projectDesc')}
									</div>
									<input
										type='text'
										id='project'
										name='project'
										className={`mb-2 mt-1 block w-full rounded-md text-base ${
											getErrorMessage(state.message, 'project') !== null
												? 'border-borderRed bg-softRedBG'
												: 'border-borderGray bg-white'
										} border p-2 shadow-sm`}
									/>
									{getErrorMessage(state.message, 'project') && (
										<div className='text-darkRed mx-auto mt-1 inline-flex max-w-2xl items-start text-xs font-bold md:text-sm'>
											<Image
												src={icons.errorIcon}
												alt='Warning'
												width={15}
												height={15}
												className='mr-2 mt-0 inline-block md:mt-[2px]'
											/>
											{getErrorMessage(state.message, 'project')}
										</div>
									)}
								</div>
								<div className='mb-6'>
									<label
										htmlFor='proposer'
										className='text-softBlack mb-2 block text-sm font-bold'
									>
										{t('proposerTitle')}
									</label>
									<div className='text-grayMiddle mb-2 text-xs'>
										{t('proposerDesc')}
									</div>
									<input
										type='text'
										id='proposer'
										name='proposer'
										className={`mb-2 mt-1 block w-full rounded-md text-base ${
											getErrorMessage(state.message, 'proposer') !== null
												? 'border-borderRed bg-softRedBG'
												: 'border-borderGray bg-white'
										} border p-2 shadow-sm`}
									/>
									{getErrorMessage(state.message, 'proposer') && (
										<div className='text-darkRed mx-auto mt-1 inline-flex max-w-2xl items-start text-xs font-bold md:text-sm'>
											<Image
												src={icons.errorIcon}
												alt='Warning'
												width={15}
												height={15}
												className='mr-2 mt-0 inline-block md:mt-[2px]'
											/>
											{getErrorMessage(state.message, 'proposer')}
										</div>
									)}
								</div>

								<div className='mb-6'>
									<label
										htmlFor='location'
										className='text-softBlack mb-2 block text-sm font-bold'
									>
										{t('locationTitle')}
									</label>
									<div className='text-grayMiddle mb-2 text-xs'>
										{t('locationDesc')}
									</div>
									<textarea
										id='location'
										name='location'
										className={`mb-2 mt-1 block h-60 w-full rounded-md text-base ${
											getErrorMessage(state.message, 'location') !== null
												? 'border-borderRed bg-softRedBG'
												: 'border-borderGray bg-white'
										} border p-2 shadow-sm`}
										placeholder={t('locationPlaceholder')}
									/>
									{getErrorMessage(state.message, 'location') && (
										<div className='text-darkRed mx-auto mt-1 inline-flex max-w-2xl items-start text-xs font-bold md:text-sm'>
											<Image
												src={icons.errorIcon}
												alt='Warning'
												width={15}
												height={15}
												className='mr-2 mt-0 inline-block md:mt-[2px]'
											/>
											{getErrorMessage(state.message, 'location')}
										</div>
									)}
								</div>

								<div className='mb-6'>
									<label
										htmlFor='description'
										className='text-softBlack mb-2 block text-sm font-bold'
									>
										{t('descriptionTitle')}
									</label>
									<div className='text-grayMiddle mb-2 text-xs'>
										{t('descriptionDesc')}
									</div>
									<textarea
										id='description'
										name='description'
										className={`mb-2 mt-1 block h-60 w-full rounded-md text-base ${
											getErrorMessage(state.message, 'description') !== null
												? 'border-borderRed bg-softRedBG'
												: 'border-borderGray bg-white'
										} border p-2 shadow-sm`}
										placeholder={t('descriptionPlaceholder')}
									/>
									{getErrorMessage(state.message, 'description') && (
										<div className='text-darkRed mx-auto mt-1 inline-flex max-w-2xl items-start text-xs font-bold md:text-sm'>
											<Image
												src={icons.errorIcon}
												alt='Warning'
												width={15}
												height={15}
												className='mr-2 mt-0 inline-block md:mt-[2px]'
											/>
											{getErrorMessage(state.message, 'description')}
										</div>
									)}
								</div>

								<div className='mb-10'>
									<label
										htmlFor='photo'
										className='text-softBlack mb-2 block text-sm font-bold'
									>
										{t('fotoTitle')}
									</label>
									<div className='text-grayMiddle mb-2 text-xs'>
										{t('fotoDesc')}
									</div>
									<input
										type='file'
										id='photo'
										name='photo'
										multiple
										ref={inputRef}
										onChange={handleFileChange}
										accept='image/png, image/gif, image/jpeg, image/webp'
										className='focus:border-indigo-500 border-grayLight mb-1 mt-1 hidden w-full rounded-md border p-2 shadow-sm'
									/>

									{selectedFiles.length > 0 && (
										<div className='mb-5 mt-4 flex flex-wrap gap-4'>
											{selectedFiles.map((fileData, index) => (
												<div
													key={index}
													className='border-gray-300 group relative h-24 w-[47%] rounded border-borderGreen md:w-36'
												>
													<img
														src={fileData.url}
														alt={`preview-${index}`}
														className='h-full w-full rounded object-cover'
													/>
													{/* "X" button */}
													<button
														onClick={() => removeFile(index)}
														className='absolute right-[10px] top-[10px] flex h-5 w-5 items-center justify-center rounded-md bg-white text-xs text-gray-600 hover:opacity-85'
													>
														<Image
															src={icons.deleteIcon}
															alt='Delete icon'
															width={10}
															height={11}
														/>
													</button>
												</div>
											))}
										</div>
									)}

									<button
										type='button'
										onClick={handleButtonClick}
										className='my-2 rounded-lg bg-green px-4 py-2 text-white hover:opacity-70'
									>
										{t('fotoButton')}
									</button>
								</div>
							</div>
							<div className='w-full md:w-1/2 md:pl-16'>
								<h2 className='mb-2 text-[28px] text-primaryBlack'>
									{t('contact')}
								</h2>
								<div className='mb-6 text-base text-black'>
									{t('contactDescription')}
								</div>

								<div className='mb-6'>
									<label
										htmlFor='name'
										className='text-softBlack mb-2 block text-sm font-bold'
									>
										{t('nameTitle')}
									</label>
									<input
										type='text'
										id='name'
										name='name'
										className={`mb-2 mt-1 block w-full rounded-md text-base md:w-3/6 ${
											getErrorMessage(state.message, 'name') !== null
												? 'border-borderRed bg-softRedBG'
												: 'border-borderGray bg-white'
										} border p-2 shadow-sm`}
									/>
									{getErrorMessage(state.message, 'name') && (
										<div className='text-darkRed mx-auto mt-1 inline-flex max-w-2xl items-start text-xs font-bold md:text-sm'>
											<Image
												src={icons.errorIcon}
												alt='Warning'
												width={15}
												height={15}
												className='mr-2 mt-0 inline-block md:mt-[2px]'
											/>
											{getErrorMessage(state.message, 'name')}
										</div>
									)}
								</div>

								<div className='mb-6'>
									<label
										htmlFor='email'
										className='text-softBlack mb-2 block text-sm font-bold'
									>
										{t('emailTitle')}
									</label>
									<input
										type='email'
										id='email'
										name='email'
										className={`mb-2 mt-1 block w-full rounded-md text-base md:w-3/6 ${
											getErrorMessage(state.message, 'email') !== null
												? 'border-borderRed bg-softRedBG'
												: 'border-borderGray bg-white'
										} border p-2 shadow-sm`}
									/>
									{getErrorMessage(state.message, 'email') && (
										<div className='text-darkRed mx-auto mt-1 inline-flex max-w-2xl items-start text-xs font-bold md:text-sm'>
											<Image
												src={icons.errorIcon}
												alt='Warning'
												width={15}
												height={15}
												className='mr-2 mt-0 inline-block md:mt-[2px]'
											/>
											{getErrorMessage(state.message, 'email')}
										</div>
									)}
								</div>

								<div className='mb-6'>
									<label
										htmlFor='mobile'
										className='text-softBlack mb-2 block text-sm font-bold'
									>
										{t('mobileTitle')}
									</label>
									<input
										type='text'
										id='mobile'
										name='mobile'
										className={`mb-2 mt-1 block w-full rounded-md text-base md:w-3/6 ${
											getErrorMessage(state.message, 'mobile') !== null
												? 'border-borderRed bg-softRedBG'
												: 'border-borderGray bg-white'
										} border p-2 shadow-sm`}
									/>
									{getErrorMessage(state.message, 'mobile') && (
										<div className='text-darkRed mx-auto mt-1 inline-flex max-w-2xl items-start text-xs font-bold md:text-sm'>
											<Image
												src={icons.errorIcon}
												alt='Warning'
												width={15}
												height={15}
												className='mr-2 mt-0 inline-block md:mt-[2px]'
											/>
											{getErrorMessage(state.message, 'mobile')}
										</div>
									)}
								</div>

								<div className='mb-6'>
									<label
										key='accept'
										htmlFor='accept'
										className='flex cursor-pointer items-start text-base font-normal text-[#5A5A5A]'
										onClick={handleCheckboxChange}
									>
										<input
											name='accept'
											type='checkbox'
											className='peer hidden'
											checked={isChecked}
											onChange={handleCheckboxChange}
										/>
										<span className='mr-2 flex h-5 w-5 items-center justify-center rounded-md border border-borderGrayMedium bg-[#EFEFEF] peer-checked:border-borderGrayMedium peer-checked:bg-green peer-focus:ring-2 peer-focus:ring-green'>
											{isChecked && (
												<Image
													src={icons.checkedIcon}
													alt='Add to cart'
													width={10}
													height={8}
													className='m-0 p-0'
												/>
											)}
										</span>
										<span className='m-0 p-0'>
											{t.rich('accept', {
												link1: chunks => (
													<a
														href='https://forum.zazelenimo.com/t/uvjeti-koristenja/9'
														target='_blank'
														className='text-green underline hover:opacity-70'
													>
														{chunks}
													</a>
												),
												link2: chunks => (
													<a
														href='https://forum.zazelenimo.com/t/izjava-o-privatnosti/10'
														target='_blank'
														className='text-green underline hover:opacity-70'
													>
														{chunks}
													</a>
												),
											})}
										</span>
									</label>
									{getErrorMessage(state.message, 'accept') && (
										<div className='text-darkRed mx-auto mt-1 inline-flex max-w-2xl items-start text-xs font-bold md:text-sm'>
											<Image
												src={icons.errorIcon}
												alt='Warning'
												width={15}
												height={15}
												className='mr-2 mt-0 inline-block md:mt-[2px]'
											/>
											{getErrorMessage(state.message, 'accept')}
										</div>
									)}
								</div>

								<div className='flex flex-row items-start'>
									<div className='w-auto'>
										<ProjectProposalFormButton />
									</div>
									{!state.status && state.message.length > 0 && (
										<div className='text-darkRed mx-auto mt-1 inline-flex w-auto items-start pl-6 text-xs font-bold md:pl-0 md:text-sm'>
											<Image
												src={icons.errorIcon}
												alt='Warning'
												width={15}
												height={15}
												className='mr-2 mt-0 inline-block md:mt-[2px]'
											/>
											{t('notification')}
										</div>
									)}
								</div>
							</div>
						</div>
					</form>
				</div>
			</Container>
		</section>
	);
}
