import { create } from 'zustand';
import { getActiveTasks } from './api';

interface TaskStore {
  tasks: any[];
  loading: boolean;
  error: string | null;
  fetchTasks: (userId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  loading: false,
  error: null,
  fetchTasks: async (userId) => {
    set({ loading: true, error: null }); // 로딩 시작, 에러 초기화
    try {
      const data = await getActiveTasks(userId);
      set({ tasks: data.tasks, loading: false }); // 데이터 업데이트
    } catch (error) {
      set({ error: '태스크 로딩 실패', loading: false }); // 에러 상태 설정
    }
  },
}));