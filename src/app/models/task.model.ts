export interface Team {
  id: string;
  name: string;
  members_count: number;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  team_id: string;
  description?: string;
  status?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'done'; 
  priority: 'low' | 'medium' | 'high';
  project_id: string;
  assignee_id?: string;
  due_date?: string;
  order_index?: number;
}

export interface CreateTeamData {
  name: string;
}

export interface CreateProjectData {
  name: string;
  teamId: string;
  description?: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  assigneeId?: string;
  dueDate?: string;
  orderIndex?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'backlog' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  assignee_id?: string;
  due_date?: string;
  order_index?: number;
}

export interface Comment {
  id: string;
  body: string;
  task_id: string;
  user_id: string;
  author_name?: string;
  created_at: string;
}

export interface CreateCommentData {
  body: string;
  taskId: string;
}

export interface AddMemberData {
  userId: string;
  role: 'member' | 'admin';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}