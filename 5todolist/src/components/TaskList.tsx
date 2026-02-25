import { useEffect } from 'react';
import { useTaskStore } from '../features/tasks/store';

const TaskList = ({ userId }: { userId: string }) => {
  const { tasks, loading, error, fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks(userId); // 컴포넌트가 마운트될 때 태스크 데이터 가져오기
  }, [userId]);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h3>활성 태스크</h3>
      {tasks.length === 0 ? (
        <div>활성 태스크가 없습니다.</div>
      ) : (
        <ul>
          {tasks.map((task: any) => (
            <li key={task.id}>{task.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;