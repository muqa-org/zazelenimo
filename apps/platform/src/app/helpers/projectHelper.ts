import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '@/../tailwind.config'

const { theme } = resolveConfig(tailwindConfig);
const colors = theme.colors as any;
/**
 * Determines the base color for a project's progress based on the given percentage.
 *
 * @param {number} progress - The current progress of the project as a percentage (from 0 to 100).
 * @returns {`#${string}`} - A string representing the hex color value for the progress.
 *
 * - Returns `colors.progressLow` for progress between 1% and 33%.
 * - Returns `colors.progressMedium` for progress between 34% and 66%.
 * - Returns `colors.progressHigh` for progress between 67% and 100%.
 * - Returns `colors.gray` if progress is 0% or any other value outside the 1-100 range.
 */
const getBaseProgressColor = (progress: number): `#${string}` => {
	if (progress > 0 && progress <= 33) {
		return colors.progressLow.DEFAULT;
	} else if (progress > 33 && progress <= 66) {
		return colors.progressMedium.DEFAULT;
	} else if (progress > 66 && progress <= 100) {
		return colors.progressHigh.DEFAULT;
	}
	return colors.gray;
};
/**
 * Determines the background color class for a project's progress bar
 * based on the given progress percentage.
 *
 * @param {number} progress - The current progress of the project as a percentage (from 0 to 100).
 * @returns {string} - A string representing the CSS class name for the background color.
 *
 * - Returns `'bg-progressLow'` for progress between 1% and 33%.
 * - Returns `'bg-progressMedium'` for progress between 34% and 66%.
 * - Returns `'bg-progressHigh'` for progress between 67% and 100%.
 * - Returns `'bg-green'` if progress is 0% or any other value outside the 1-100 range.
 */
export const getProjectProgressBGColor = (
	progress = 0,
): string => {
	let progressColor = 'bg-green';
	if (progress > 0 && progress <= 33) {
		progressColor = 'bg-progressLow';
	} else if (progress > 33 && progress <= 66) {
		progressColor = 'bg-progressMedium';
	} else if (progress > 66 && progress <= 100) {
		progressColor = 'bg-progressHigh';
	}
	return progressColor;
};

export const getCustomPercentageMarkerIcon = (percentage: number): string => {
	const fill = getBaseProgressColor(percentage);
	const svgMarker = `
			<svg width="94" height="86" viewBox="0 0 94 86" fill="none" xmlns="http://www.w3.org/2000/svg">
				<g filter="url(#filter0_f_274_2813)">
						<path d="M73.6635 56.3125C72.547 60.6875 47.534 66 47.534 66C47.534 66 21.907 60.2188 20.3995 56.3125C18.892 52.4063 20.3995 46 47.534 46C74.6685 46 74.78 51.9375 73.6635 56.3125Z" fill="black" fill-opacity="0.5"/>
				</g>
				<path d="M75.3976 33C74.2866 47 49.3975 64 49.3975 64C49.3975 64 23.8976 45.5 22.3975 33C20.8975 20.5 22.3975 0 49.3975 0C76.3975 0 76.5085 19 75.3976 33Z" fill="${fill}"/>
				<text x="52%" y="32%" fill="white" font-size="20" font-family="Arial" font-weight="bold" text-anchor="middle" dy=".3em">${percentage}%</text>
				<defs>
						<filter id="filter0_f_274_2813" x="0" y="26" width="94" height="60" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
								<feFlood flood-opacity="0" result="BackgroundImageFix"/>
								<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
								<feGaussianBlur stdDeviation="10" result="effect1_foregroundBlur_274_2813"/>
						</filter>
				</defs>
		</svg>
	`;

	const encoded = encodeURIComponent(svgMarker);
	const iconUrl = `data:image/svg+xml,${encoded}`;

	return iconUrl;
};
