import api from '../../lib/api';

// getActiveTasks 함수 정의
export const getActiveTasks = async (userId: string) => {
  try {
    const response = await api.get(`/task-strategy/users/${userId}/active-tasks`);
    return response.data; // API로부터 받은 데이터 반환
  } catch (error) {
    console.error('API 호출 오류:', error);
    throw error; // 에러 발생 시 오류 던지기
  }
};