import { createContext, useContext } from "react";
import type { Group, Task, User, WorkLog } from "../types";

export interface AppContextType {
    user: User;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    groups: Group[];
    setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    workLogs: WorkLog[];
    setWorkLogs: React.Dispatch<React.SetStateAction<WorkLog[]>>;
}

export const AppContext = createContext<AppContextType | null>(null);

export const useApp = (): AppContextType => {
    const ctx = useContext(AppContext);
    if (!ctx) {
        throw new Error("useApp must be used inside AppContext.Provider");
    }
    return ctx;
};
