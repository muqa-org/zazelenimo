import { generatePassword } from '@/app/helpers/appHelpers';

const apiUrl = process.env.NEXT_DISCOURSE_FORUM_URL || '';
const apiKey = process.env.NEXT_DISCOURSE_API_KEY || '';
const apiUsername = process.env.NEXT_DISCOURSE_USERNAME || '';

/**
 * Function to create a new user in Discourse.
 *
 * @param {Object} userData - The data needed to create a new user.
 * @param {string} userData.name - The full name of the user.
 * @param {string} userData.username - The desired username for the user.
 * @param {string} userData.password - The password for the user.
 * @param {string} userData.email - The email address of the user.
 *
 * @returns {Promise<Response>} - Returns the API response from Discourse. It includes status and any error information if the request fails.
 */
export const createDiscourseUser = async ({
	name,
	username,
	password,
	email,
}: {
	name: string;
	username: string;
	password: string;
	email: string;
}) => {
	const userData = {
		name: name,
		username: username,
		email: email,
		password: password,
		active: true,
		approved: true,
	};

	const response = await fetch(`${apiUrl}/users.json`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Api-Key': apiKey!,
			'Api-Username': apiUsername,
		},
		body: JSON.stringify(userData),
	});

	return response;
};

/**
 * Function to upload a file to Discourse.
 *
 * @param {File} formDataFile - The file to be uploaded.
 *
 * @returns {Promise<string|null>} - Returns the URL of the uploaded file if successful, or `null` if the upload fails.
 *
 * @throws {Error} - Throws an error if no file is provided.
 */
export async function uploadFileToDiscourse(formDataFile: any) {
	const file = formDataFile as File;
	if (!file) {
		throw new Error('No file provided.');
	}

	const uploadFormData = new FormData();
	uploadFormData.append('file', file);
	uploadFormData.append('type', 'composer');
	uploadFormData.append('synchronous', 'true');

	const response = await fetch(`${apiUrl}/uploads.json`, {
		method: 'POST',
		headers: {
			'Api-Key': apiKey,
			'Api-Username': apiUsername,
		},
		body: uploadFormData, // Sending the FormData that includes the file
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Error uploading file:', errorText);
		return null;
	}

	const data = await response.json();

	return data.url;
}

/**
 * Function to create a new topic (post) in Discourse.
 *
 * @param {Object} topicData - The data required to create the new topic.
 * @param {string} topicData.username - The username of the new topic.
 * @param {string} topicData.title - The title of the new topic.
 * @param {string} topicData.description - The content of the post for the topic.
 * @param {number} topicData.category - The ID of the category where the topic will be created.
 *
 * @returns {Promise<Response>} - Returns the API response from Discourse. It includes status and any error information if the request fails.
 */
export const createDiscourseTopic = async ({
	username,
	title,
	description,
	category,
}: {
	username: string;
	title: string;
	description: string;
	category: number;
}) => {
	const response = await fetch(`${apiUrl}/posts.json`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Api-Key': apiKey,
			'Api-Username': username,
		},
		body: JSON.stringify({
			title: title,
			raw: description,
			category: category,
		}),
	});

	return response;
};

/**
 * Function to generate a Markdown-formatted description for a project proposal.
 * The description includes project details, location information, the proposer's name,
 * and any associated images or notices. It also formats the proposal to include a 
 * "spoiler" section for additional content visibility control in the forum.
 *
 * @param {Object} params - The parameters for generating the proposal description.
 * @param {string} params.project - The name or title of the project proposal.
 * @param {string} params.location - A description of the proposal's location.
 * @param {string} params.description - A detailed description of the proposal.
 * @param {string} params.proposer - The name of the proposer (may differ from the submitter).
 * @param {string[]} params.fileUrls - An array of URLs of the uploaded files, representing images.
 * @param {string} params.notice - The last notice related to the proposal topic.
 *
 * @returns {string} - A Markdown-formatted string representing the project proposal, 
 * including images (if available), project and location details, and an invitation 
 * to join the discussion on the forum.
 */
export const generateProposalTopicDescription = ({
	project,
	location,
	description,
	proposer,
	fileUrls,
	notice,
}: {
	project: string;
	location: string;
	description: string;
	proposer: string;
	fileUrls: string[];
	notice: string;
}) => {
	const fileSection = fileUrls.length
		? fileUrls
				.map((fileUrl, index) =>
					fileUrl.trim() !== ''
						? `![Fotografija prijedloga ${index + 1}](${fileUrl})`
						: 'nemamo fotografiju :(',
				)
				.join('\n')
		: 'nemamo fotografiju :(';

	const rawDescription = `
# Prijedlog
## Status
> Ovaj prijedlog je trenutno u fazi provjere od strane našeg stručnog tima. U ovoj fazi samo članovi tima mogu komentirati. Ako bude odobren, prijedlog će biti otvoren za javnu raspravu.

## Sadržaj
> Kliknite na zamućeni tekst da vidite prijedlog.

[spoiler]
**Naziv:**  ${project}
**Predlaže:** ${proposer}

---

### Opis lokacije:
${location}

### Opis prijedloga:
${description}

**Fotografije lokacije:**
${fileSection}


[/spoiler]

## Rasprava
> Registrirajte se na Forum i zapratite ovu temu (klikom na zvono) kako biste bili obaviješteni o daljnjim koracima. Pogledajte sve prijedloge koji su trenutno na javnoj raspravi ovdje: #rasprava .
`;

	return rawDescription.trim();
};
