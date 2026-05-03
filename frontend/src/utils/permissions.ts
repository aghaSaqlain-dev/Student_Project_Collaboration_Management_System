import type { Role } from "../types";

export const PERMISSIONS: Record<Role, string[]> = {
    student: ["view_groups", "join_group", "create_group", "view_tasks", "update_own_task", "view_own_profile"],
    supervisor: ["view_groups", "approve_group", "view_tasks", "view_all_profiles", "manage_group_status"],
    admin: ["view_groups", "view_tasks", "view_all_profiles", "manage_users", "delete_user", "assign_roles"],
};

export const can = (role: Role, permission: string): boolean =>
    PERMISSIONS[role]?.includes(permission) ?? false;
