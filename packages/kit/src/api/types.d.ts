import { Address, Hash, WalletClient } from 'viem';

type OrderBy = 'asc' | 'desc';

type RoundOrderKeys =
  | 'created_at_block'
  | 'funded_amount_in_usd'
  | 'funded_amount'
  | 'match_amount_in_usd'
  | 'match_amount'
  | 'matching_distribution'
  | 'total_amount_donated_in_usd'
  | 'total_donations_count'
  | 'unique_donors_count';

type ProjectOrderKeys = 'name' | 'created_at_block';
type ApplicationOrderKeys =
  | 'created_at_block'
  | 'status'
  | 'status_updated_at_block'
  | 'total_donations_count'
  | 'total_amount_donated_in_usd'
  | 'unique_donors_count';
interface Query<T> {
  orderBy?: { [key: T]: OrderBy };
  skip?: number;
  take?: number;
}
export interface RoundsQuery extends Query<RoundOrderKeys> {
  where?: RoundQueryWhere;
}
export interface ProjectsQuery extends Query<ProjectOrderKeys> {
  where?: RoundQueryWhere;
}
export interface ApplicationsQuery extends Query<ApplicationOrderKeys> {
  where?: ApplicationQueryWhere;
}
export interface RolesQuery extends Query<string> {
  where?: RolesQueryWhere;
}
type Compare<T = string | number> = {
  equals?: T;
  in?: T[];
  contains?: T[];
  gte?: number;
};
type RolesQueryWhere = {
  address?: Compare<Address>;
  role?: Compare<'ADMIN' | 'MANAGER'>;
};
type ApplicationQueryWhere = {
  chainId?: Compare<number>;
  status?: Compare<ApplicationStatus>;
  roundId?: Compare<string>;
  projectId?: Compare<string>;
  createdByAddress?: Compare<Address>;
  totalDonationsCount?: Compare<number>;
  totalAmountDonatedInUsd?: Compare<number>;
};
type RoundQueryWhere = {
  id?: Compare;
  strategy?: Compare<Address>;
  strategyName?: Compare<
    | 'allov2.DirectGrantsLiteStrategy'
    | 'allov2.DonationVotingMerkleDistributionDirectTransferStrategy'
    | 'allov2.SQFSuperFluidStrategy'
  >;
  chainId?: Compare<number>;
  tags?: Compare<'allo-v1' | 'allo-v2' | 'grants-stack'>; // GrantsStack only (create a type in gs to extend)
  roundId?: Compare;
  createdAt?: Compare;
  createdBy?: Compare;
  roundStart?: Compare;
  allocateStart?: Compare;
  distributeStart?: Compare;
  roundEnd?: Compare;
  applications?: ApplicationsQuery;
  roles?: RolesQuery;
  and?: RoundQueryWhere[];
};

// For passing random data to the request in API provider (for example chainId)
export type QueryOpts = Record<string, string | number>;
export type Allocation = { id: string; amount?: number };
export type Ballot = Record<string, Allocation>;

export interface API {
  rounds: (query: RoundsQuery) => Promise<Round[]>;
  roundById: (id: string, opts?: QueryOpts) => Promise<Round | undefined>;
  createRound: (
    _data: RoundInput,
    _signer: WalletClient,
    _account?: any,
  ) => Promise<RoundCreated>;
  projects: (_query: ProjectsQuery) => Promise<Project[]>;
  projectById: (_id: string, _opts?: QueryOpts) => Promise<Project | undefined>;
  createProject: (
    _data: ProjectInput,
    _signer: WalletClient,
  ) => Promise<ProjectCreated>;
  applications: (_query: ApplicationsQuery) => Promise<Application[]>;
  applicationById: (
    _id: string,
    _opts?: QueryOpts,
  ) => Promise<Application | undefined>;
  createApplication: (
    _data: ApplicationInput,
    _signer: WalletClient,
  ) => Promise<ApplicationCreated>;
  ballot: () => Promise<Ballot>;
  addToBallot: (_ballot: Ballot) => Promise<Ballot>;
  saveBallot: (_ballot: Ballot) => Promise<Ballot>;
  allocate: (
    _tx: TransactionInput,
    _signer: WalletClient,
  ) => Promise<Address | undefined>;
  distribute: () => void;
  upload: (_data: FormData) => Promise<string>;
  sendTransaction: (
    _tx: { to: `0x${string}`; data: `0x${string}`; value: string | bigint },
    _signer: WalletClient, // TODO: Use something more generic than WalletClient?
  ) => Promise<Hash>;
}
// Transforms data from API into a common shape

export interface Transformers<TRound, TApplication, TProject> {
  round: (_round: TRound) => Round;
  application: (_application: TApplication) => Application;
  project: (_project: TProject) => Project;
}

type BaseRound = {
  token?: Address;
  strategy: Address;
  managers?: Address[];
};
export type Round = BaseRound & {
  id: string;
  name: string;
  description: string;
  bannerUrl?: string;
  chainId: number;
  applications?: { id: string }[];
  matching: { amount: bigint; token: Address };
  avatarUrl?: string;
  bannerUrl?: string;
  strategyName?: string;
  phases: {
    roundStart?: string;
    allocateStart?: string;
    distributeStart?: string;
    roundEnd?: string;
  };
};

export type RoundInput = BaseRound & {
  metadata: { protocol: bigint; pointer: string };
  initStrategyData?: Address;
  amount?: bigint;
};
export type RoundCreated = { id: string; chainId: number };

type BaseApplication = {};
export type ApplicationStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'CANCELLED'
  | 'IN_REVIEW';

export type Application = BaseApplication & {
  id: string;
  name: string;
  description?: string;
  recipient: Address;
  avatarUrl?: string;
  bannerUrl?: string;
  chainId: number;
  projectId: string;
  contributors?: {
    count?: number;
    amount?: number;
  };
  status: ApplicationStatus;
  websiteUrl?: string;
};

export type ApplicationInput = BaseApplication & {
  roundId: bigint;
  strategyData?: Address;
};

export type ApplicationCreated = { id: string; chainId: number };

type BaseProject = {
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
};
export type Project = BaseProject & {
  id: string;
  chainId: number;
};
export type ProjectInput = BaseProject & {};

export type ProjectCreated = { id: string; chainId: number };

export type AllocateInput = {
  _roundId: string;
  _data: `0x${string}`;
};

export type TransactionInput = {
  to: `0x${string}`;
  data: `0x${string}`;
  value: string | bigint;
};
