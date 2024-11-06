import type { Flow } from './types.d';
import type { UserProfile } from './types.d';
import { profileFields } from './types.d';

function getMissingFlowFields(user: UserProfile, flow: Flow) {
  return profileFields[flow].filter(field => !user[field]);
}

export { getMissingFlowFields };
