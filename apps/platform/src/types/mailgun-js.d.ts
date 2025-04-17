// types/mailgun-js.d.ts
declare module 'mailgun-js' {
	export interface MailgunOptions {
		apiKey: string;
		domain: string;
		host: string;
	}

	export interface MessageData {
		from: string;
		to: string;
		subject: string;
		html: string;
	}

	export interface Messages {
		send: (data: MessageData) => Promise<any>;
	}

	export interface MailgunInstance {
		messages: () => Messages;
	}

	export default function (options: MailgunOptions): MailgunInstance;
}
