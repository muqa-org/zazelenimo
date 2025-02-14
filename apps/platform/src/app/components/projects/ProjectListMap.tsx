'use client';

import { useCallback, useState } from 'react';
import {
	GoogleMap,
	InfoWindow,
	Marker,
	MarkerClustererF,
} from '@react-google-maps/api';

import icons from '@/app/components/common/Icons';
import ProjectMapInfoWindow from '@/app/components/project/ProjectMapInfoWindow';
import { getCustomPercentageMarkerIcon } from '@/app/helpers/projectHelper';
import { FundedApplication } from '@allo/kit';

type ProjectListProps = {
	applications: FundedApplication[];
};

export interface ICoords {
	lat: number;
	lng: number;
}

type ApplicationWithCoords = FundedApplication & {
	coords: ICoords;
	icon: { url: string };
};

export default function ProjectListMap({ applications }: ProjectListProps) {
	const [coords, setCoords] = useState<ICoords>({
		lat: 43.5081,
		lng: 16.4402,
	});

	const [selectedMarker, setSelectedMarker] = useState<ApplicationWithCoords | null>(null);

	const onSelect = useCallback((marker: ApplicationWithCoords) => {
		setSelectedMarker(marker);
	}, []);

	const onCloseClick = () => {
		setSelectedMarker(null);
	};

	const mapStyles = [
		{
			featureType: 'poi', // Points of Interest
			elementType: 'all',
			stylers: [{ visibility: 'off' }],
		},
	];

	const greenMarkerIcon = {
		url: icons.markerIcon,
	};

	const zeroMarkerIcon = {
		url: icons.markerIconZero,
	};

	// TODO: Replace this with real data
	const coordinates = [
		{ coords: { lat: 43.5191413113884, lng: 16.449105382747074 } },
		{ coords: { lat: 43.51805339852162, lng: 16.44758970940925 } },
		{ coords: { lat: 43.52046275847196, lng: 16.44811046218916 } },
	];

	const markers: ApplicationWithCoords[] = applications.map((application, index) => ({
		...application,
		...coordinates[index]!,
		icon: { url: getCustomPercentageMarkerIcon(application.fundedPercentage) },
	}));

	return (
		<div className='mt-2 flex flex-row flex-wrap'>
			<GoogleMap
				mapContainerStyle={{ width: '100%', height: '665px' }}
				center={coords}
				zoom={13}
				options={{
					draggable: true,
					disableDefaultUI: false,
					styles: mapStyles,
				}}
			>
				<MarkerClustererF>
					{clusterer => (
						<>
							{markers.map(marker => (
								<Marker
									key={marker.id}
									position={marker.coords}
									icon={marker.icon}
									clusterer={clusterer}
									onClick={() => onSelect(marker)}
								/>
							))}
						</>
					)}
				</MarkerClustererF>
				{selectedMarker && (
					<InfoWindow
						position={selectedMarker.coords}
						onCloseClick={onCloseClick}
					>
						<ProjectMapInfoWindow application={selectedMarker} />
					</InfoWindow>
				)}
			</GoogleMap>
		</div>
	);
}
