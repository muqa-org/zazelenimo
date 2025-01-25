'use server';

import { ForumLink, ForumLinkDiscussion } from '@/app/config';
import {
	createDiscourseTopic,
	generateProposalTopicDescription,
	uploadFileToDiscourse,
} from '@/app/helpers/discourseHelpers';
import { sendMail } from '@/app/helpers/mailHelpers';
import { getTranslations } from 'next-intl/server';

type MessageType = {
	key: string;
	notice: string;
};

export async function createProjectAction(
	prevState: { status: boolean; message: MessageType[] | string[] },
	formData: FormData,
) {
	const t = await getTranslations('proposalForm');
	const tMail = await getTranslations('proposalMail');

	const apiUsername = process.env.NEXT_DISCOURSE_USERNAME || '';

	const project = formData.get('project')?.toString().trim() ?? '';
	const proposer = formData.get('proposer')?.toString().trim() ?? '';
	const location = formData.get('location')?.toString().trim() ?? '';
	const description = formData.get('description')?.toString().trim() ?? '';
	const firstName = formData.get('firstName')?.toString().trim() ?? '';
	const lastName = formData.get('lastName')?.toString().trim() ?? '';
	const email = formData.get('email')?.toString().trim() ?? '';
	const mobile = formData.get('mobile')?.toString().trim() ?? '';
	const accept = formData.get('accept')?.toString().trim() ?? '';

	// Validate each field and accumulate errors
	const errors: MessageType[] = [];

	if (!project || project.length < 10) {
		errors.push({ key: 'project', notice: t('projectError') });
	}

		if (!proposer) {
			errors.push({ key: 'proposer', notice: t('proposerError') });
		}

	if (!location || location.length < 15) {
		errors.push({ key: 'location', notice: t('locationError') });
	}

	if (!description || description.length < 50) {
		errors.push({ key: 'description', notice: t('descriptionError') });
	}

	if (!firstName || firstName.length < 2) {
		errors.push({ key: 'firstName', notice: t('nameError') });
	}

	if (!lastName || lastName.length < 2) {
		errors.push({ key: 'lastName', notice: t('nameError') });
	}

	if (!email || !email.includes('@')) {
		errors.push({ key: 'email', notice: t('emailError') });
	}

	if (!mobile || mobile.length < 6) {
		errors.push({ key: 'mobile', notice: t('mobileError') });
	}

	if (!accept) {
		errors.push({ key: 'accept', notice: t('acceptError') });
	}

	// If there are any errors, return them
	if (errors.length > 0) {
		return {
			status: false,
			message: errors,
		};
	}

	// Upload file(s) to Discourse if it exist
	const files = formData.getAll('photo') as File[];
	let fileUrls = [];
	if (files.length > 0) {
		for (const file of files) {
			if (file) {
				const url = await uploadFileToDiscourse(file);
				if (url) {
					fileUrls.push(url);
				}
			}
		}
	}

	const topicData = {
		username: apiUsername,
		title: 'Prijedlog: ' + project,
		description: generateProposalTopicDescription({
			project,
			location,
			description,
			proposer,
			fileUrls,
			notice: t('proposalLastData'),
		}),
		category: 9,
	};

	const responseTopic = await createDiscourseTopic(topicData);

	if (!responseTopic.ok) {
		const errorText = await responseTopic.text();
		console.error('Error creating topic:', errorText);
		return {
			status: false,
			message: [
				{
					key: 'topicCreation',
					notice: `Failed to create topic: ${responseTopic.statusText}`,
				},
			],
		};
	} else {
		const data = await responseTopic.json();

		const topicLink = `${ForumLink}/t/${data.topic_slug}/${data.topic_id}`;

		// Send email to the proposer
		if (data) {
			const messagePart10 = tMail.rich('messagePart10', {
				link: chunks =>
					`<a href='${ForumLinkDiscussion}' target='_blank' class='underline hover:text-blue'>${chunks}</a>`,
			});

			const images = fileUrls
				.map(url => `<img src="${url}" alt="Image" />`)
				.join('');

			const sendMailData = sendMail({
				from: 'Zazelenimo <postmaster@forum.zazelenimo.com>',
				to: email,
				subject: tMail('subject'),
				html: `
				<p>${tMail('messagePart1', { name: `${firstName} ${lastName}` })}</p>
				<p>${tMail('messagePart2')}</p>
				<p><strong>${tMail('messagePart3')}</strong></p>
				<hr />
				<p><strong>${tMail('messagePart4')}</strong> ${project}</p>
				<p><strong>${tMail('messagePart5')}</strong> ${proposer}</p>
				<p><strong>${tMail('messagePart6')}</strong></p>
				<p>${location}</p>
				<p><strong>${tMail('messagePart7')}</strong></p>
				<p>${description}</p>
				<p><strong>${tMail('messagePart8')}</strong></p>
				<p>${images}</p>
				<p><strong>${tMail('messagePart9')}</strong> <a href="${topicLink}" target="_blank">${topicLink}</a></p>
				<p>${messagePart10}</p>
				<p>${tMail('messagePart11')}<br />${tMail('messagePart12')}</p>
				`,
			});
		}

		// Send mail to the admin
		if (process.env.MAILGUN_RECEIVER_EMAIL) {
			const messagePart10 = tMail.rich('messagePart10', {
				link: chunks =>
					`<a href='${ForumLinkDiscussion}' target='_blank' class='underline hover:text-blue'>${chunks}</a>`,
			});

			const images = fileUrls
				.map(url => `<img src="${url}" alt="Image" />`)
				.join('');

			const sendMailData = sendMail({
				from: 'Zazelenimo <postmaster@forum.zazelenimo.com>',
				to: process.env.MAILGUN_RECEIVER_EMAIL!,
				subject: 'Novi prijedlog je predan',
				html: `
					<p>${tMail('messagePart2')}</p>
					<p><strong>${tMail('messagePart3')}</strong></p>
					<hr />
					<p><strong>${tMail('messagePart4')}</strong> ${project}</p>
					<p><strong>${tMail('messagePart5')}</strong> ${proposer}</p>
					<p><strong>${tMail('messagePart13')}</strong> ${firstName} ${lastName}</p>
					<p><strong>${tMail('messagePart14')}</strong> ${email}</p>
					<p><strong>${tMail('messagePart15')}</strong> ${mobile}</p>
					<p><strong>${tMail('messagePart16')}</strong> ${accept && accept.trim() === 'on' ? tMail('messagePart17') : tMail('messagePart17')}</p>
					<p><strong>${tMail('messagePart6')}</strong></p>
					<p>${location}</p>
					<p><strong>${tMail('messagePart7')}</strong></p>
					<p>${description}</p>
					<p><strong>${tMail('messagePart8')}</strong></p>
					<p>${images}</p>
					<p><strong>${tMail('messagePart9')}</strong> <a href="${topicLink}" target="_blank">${topicLink}</a></p>
					<p>${messagePart10}</p>
					<p>${tMail('messagePart11')}<br />${tMail('messagePart12')}</p>
					`,
			});
		}

		return {
			status: true,
			message: [
				{
					key: 'success',
					notice: topicLink,
				},
			],
		};
	}
}
