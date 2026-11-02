export type AuthMembership = {
  id: string;
  roleId: string;
  roleName: string;
  centerId: string | null;
  centerSlug: string | null;
  centerName: string | null;
};

export type AuthUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  roles: string[];
  permissions: string[];
  memberships: AuthMembership[];
};
