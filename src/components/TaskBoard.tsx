import { useState } from 'react';
import { Plus, CheckSquare, Clock, AlertCircle, Trash2, User } from 'lucide-react';
import { Task, Project, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TaskBoardProps {
  tasks: Task[];
  projects: Project[];
  onCreateTask: () => void;
  onRefresh: () => void;
}

const statusConfig = {
  todo: { label: 'To Do', color: 'bg-slate-100 text-slate-700', icon: CheckSquare },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckSquare },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-blue-100 text-blue-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', color: 'bg-red-100 text-red-700' },
};

export function TaskBoard({ tasks, projects, onCreateTask, onRefresh }: TaskBoardProps) {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<Task['status'] | 'all'>('all');

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || 'Unknown';
  };

  const getProjectColor = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.color || '#3b82f6';
  };

  const filteredTasks = selectedStatus === 'all' ? tasks : tasks.filter((t) => t.status === selectedStatus);

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    completed: tasks.filter((t) => t.status === 'completed'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Tasks</h2>
          <p className="text-slate-600 mt-1">Manage and track your work items</p>
        </div>
        <button
          onClick={onCreateTask}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            selectedStatus === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status as Task['status'])}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedStatus === status
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {config.label} ({tasksByStatus[status as keyof typeof tasksByStatus].length})
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No tasks yet</h3>
          <p className="text-slate-600 mb-6">Create your first task to get started</p>
          <button
            onClick={onCreateTask}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const statusTasks = tasksByStatus[status as keyof typeof tasksByStatus];

            return (
              <div key={status} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{config.label}</h3>
                  <span className="ml-auto text-sm text-slate-600">{statusTasks.length}</span>
                </div>

                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-1 h-full rounded-full flex-shrink-0"
                          style={{ backgroundColor: getProjectColor(task.project_id) }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 mb-1">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded font-medium">
                              {getProjectName(task.project_id)}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium ${
                                priorityConfig[task.priority].color
                              }`}
                            >
                              {priorityConfig[task.priority].label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                          className="flex-1 text-xs px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
