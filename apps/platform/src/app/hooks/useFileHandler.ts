import { useState, useRef } from 'react';

export type FileWithPreview = {
	file: File;
	url: string;
};

export default function useFileHandler() {
	const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Handle file input change
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files: File[] = event.target.files
			? Array.from(event.target.files)
			: [];

		// Map files to include a preview URL
		const filePreviews: FileWithPreview[] = files.map(file => ({
			file,
			url: URL.createObjectURL(file),
		}));

		setSelectedFiles(prevFiles => [...prevFiles, ...filePreviews]);
	};

	// Open file picker dialog
	const openFilePicker = () => {
		if (inputRef.current) {
			inputRef.current.click();
		}
	};

	// Remove file from selected files
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

	return {
		selectedFiles,
		handleFileChange,
		openFilePicker,
		removeFile,
		inputRef,
	};
}
