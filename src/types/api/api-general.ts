export type ErrorApiResponse = {
  code: number;
  status: "error";
  message: string;
  errors?: { [key: string]: string };
};

export type SuccessApiResponse<T = unknown> = {
  code: number;
  status: "success";
  message: string;
  meta?: {
    page: number;
    limit: number;
    total_pages: number;
    total_results: number;
  };
  data: T;
};

export type BaseApiResponse<T = unknown> =
  | ErrorApiResponse
  | SuccessApiResponse<T>;

export type LogoutResponse = BaseApiResponse;

export type GetMeResponse = BaseApiResponse<UserWithRoles>;

export type Client = {
  id: number;
  name: string;
  alias: string;
  created_at: string;
  updated_at: string;
};

export type Permission = {
  id: number;
  name: string;
  action: string;
  client: Omit<Client, "created_at" | "updated_at">;
  created_at: string;
  updated_at: string;
};

export type Role = {
  id: number;
  key: string;
  name: string;
  client: Omit<Client, "created_at" | "updated_at">;
  created_at: string;
  updated_at: string;
};

export type RoleWithPermissions = Omit<Role, "created_at" | "updated_at"> & {
  permissions: Omit<Permission, "created_at" | "updated_at">[];
};

export type User = {
  id: number;
  email: string;
  npk: string;
  name: string;
  image?: string | null;
  created_at: string;
  updated_at: string;
};

export type UserWithRoles = User & {
  roles: RoleWithPermissions[];
};

export type CreatedUser = {
  id: number;
  id_user: number;
  email: string;
  name: string;
};

export type BaseMetadata = {
  created_user: CreatedUser;
  created_at: string;
  updated_at: string;
};

export type Override<BaseType, Overrides> = Omit<BaseType, keyof Overrides> &
  Overrides;

export type flags =
  | "PAKAN"
  | "OBAT"
  | "VITAMIN"
  | "KIMIA"
  | "EKSPEDISI"
  | "IS_ACTIVE"
  | "DOC"
  | "PRE-STARTER"
  | "STARTER"
  | "FINISHER"
  | "OVK";

export type BaseApproval = {
  id?: number;
  step_number: number;
  step_name: string;
  action: string;
  notes?: string | null;
  action_by: CreatedUser;
  action_at: string;
};

export type BaseGroupedApproval = {
  step_number: number;
  step_name: string;
  approvals: BaseApproval[];
};

export type Approvals = BaseApiResponse<BaseApproval>;

export type GroupedApprovals = BaseApiResponse<BaseGroupedApproval[]>;
