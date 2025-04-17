'use client';

import { ApplicationCard } from './card.jsx';
import type { ApplicationCardProps } from './card.jsx';
import { ApplicationsQuery } from '../api/types.js';
import { useApplications } from '../hooks/useApplications.js';
import { Grid, GridProps } from '../ui/grid.jsx';

export function DiscoverApplications({
  query,
  ...props
}: GridProps<ApplicationCardProps> & { query?: ApplicationsQuery }) {
  const applications = useApplications(query!);
  return (
    <Grid
      component={ApplicationCard}
      keys={['projectId']}
      {...applications}
      {...props}
    />
  );
}
