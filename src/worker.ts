import { TodoistApi } from '@doist/todoist-api-typescript';
import type { GetSectionsArgs } from '@doist/todoist-api-typescript';

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const todoistApiToken = env.TODOIST_API_TOKEN;
    if (!todoistApiToken) {
      return new Response('TODOIST_API_TOKEN is not set', { status: 500 });
    }
    const todoistApi = new TodoistApi(todoistApiToken);
    return handleRequest(request, todoistApi, env);
  },
};

// Main request handler
async function handleRequest(request: Request, todoistApi: TodoistApi, env: any): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  switch (path) {
    case '/listTasks':
      return handleListTasks(request, todoistApi);
    case '/getTask':
      return handleGetTask(request, todoistApi);
    case '/createTask':
      return handleCreateTask(request, todoistApi);
    case '/updateTask':
      return handleUpdateTask(request, todoistApi);
    case '/completeTask':
      return handleCompleteTask(request, todoistApi);
    case '/reopenTask':
      return handleReopenTask(request, todoistApi);
    case '/deleteTask':
      return handleDeleteTask(request, todoistApi);
    case '/listProjects':
      return handleListProjects(request, todoistApi);
    case '/getProject':
      return handleGetProject(request, todoistApi);
    case '/createProject':
      return handleCreateProject(request, todoistApi);
    case '/updateProject':
      return handleUpdateProject(request, todoistApi);
    case '/archiveProject':
      return handleArchiveProject(request, env);
    case '/unarchiveProject':
      return handleUnarchiveProject(request, env);
    case '/deleteProject':
      return handleDeleteProject(request, todoistApi);
    case '/getProjectCollaborators':
      return handleGetProjectCollaborators(request, todoistApi);
    case '/listSections':
      return handleListSections(request, todoistApi);
    case '/getSection':
      return handleGetSection(request, todoistApi);
    case '/createSection':
      return handleCreateSection(request, todoistApi);
    case '/updateSection':
      return handleUpdateSection(request, todoistApi);
    case '/deleteSection':
      return handleDeleteSection(request, todoistApi);
    case '/listComments':
      return handleListComments(request, todoistApi);
    case '/getComment':
      return handleGetComment(request, todoistApi);
    case '/createComment':
      return handleCreateComment(request, todoistApi);
    case '/updateComment':
      return handleUpdateComment(request, todoistApi);
    case '/deleteComment':
      return handleDeleteComment(request, todoistApi);
    case '/listLabels':
      return handleListLabels(request, todoistApi);
    case '/getLabel':
      return handleGetLabel(request, todoistApi);
    case '/createLabel':
      return handleCreateLabel(request, todoistApi);
    case '/updateLabel':
      return handleUpdateLabel(request, todoistApi);
    case '/deleteLabel':
      return handleDeleteLabel(request, todoistApi);
    case '/getSharedLabels':
      return handleGetSharedLabels(request, env);
    case '/renameSharedLabel':
      return handleRenameSharedLabel(request, env);
    case '/removeSharedLabel':
      return handleRemoveSharedLabel(request, env);

    case '/sse':
      return handleListSections(request, env);
    default:
      return new Response('Not Found', { status: 404 });
  }
}

// New SSE endpoint for MCP
async function handleSSE(request: Request, env: any): Promise<Response> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: Connected to MCP server\n\n'));
      // Add logic for periodic updates if needed
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'https://ai.playground.cloudflare.com',
    },
  });
}

// Task Handlers
async function handleListTasks(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const projectId = params.get('projectId') || undefined;
  const label = params.get('label') || undefined;

  try {
    const tasks = await todoistApi.getTasks({ projectId, label });
    return new Response(JSON.stringify({ tasks }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch tasks', { status: 500 });
  }
}

async function handleGetTask(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const taskId = params.get('taskId');
  if (!taskId) return new Response('taskId is required', { status: 400 });

  try {
    const task = await todoistApi.getTask(taskId);
    return new Response(JSON.stringify({ task }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch task', { status: 500 });
  }
}

async function handleCreateTask(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const body = await request.json() as any;
  try {
    const task = await todoistApi.addTask({
      content: body.content,
      projectId: body.projectId,
      dueString: body.dueString,
      priority: body.priority,
      labels: body.labels,
      description: body.description,
      order: body.order,
      parentId: body.parentId,
      sectionId: body.sectionId,
      assigneeId: body.assigneeId,
      dueLang: body.dueLang,
      dueDate: body.dueDate,
      dueDatetime: body.dueDatetime,
    });
    return new Response(JSON.stringify({ task }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to create task', { status: 500 });
  }
}

async function handleUpdateTask(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const body = await request.json() as any;
  const { taskId, ...updateParams } = body;
  if (!taskId) return new Response('taskId is required', { status: 400 });

  try {
    const success = await todoistApi.updateTask(taskId, updateParams);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to update task', { status: 500 });
  }
}

async function handleCompleteTask(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const taskId = params.get('taskId');
  if (!taskId) return new Response('taskId is required', { status: 400 });

  try {
    const success = await todoistApi.closeTask(taskId);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to complete task', { status: 500 });
  }
}

async function handleReopenTask(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const taskId = params.get('taskId');
  if (!taskId) return new Response('taskId is required', { status: 400 });

  try {
    const success = await todoistApi.reopenTask(taskId);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to reopen task', { status: 500 });
  }
}

async function handleDeleteTask(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const taskId = params.get('taskId');
  if (!taskId) return new Response('taskId is required', { status: 400 });

  try {
    const success = await todoistApi.deleteTask(taskId);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to delete task', { status: 500 });
  }
}

// Project Handlers
async function handleListProjects(request: Request, todoistApi: TodoistApi): Promise<Response> {
  try {
    const projects = await todoistApi.getProjects();
    return new Response(JSON.stringify({ projects }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch projects', { status: 500 });
  }
}

async function handleGetProject(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const projectId = params.get('projectId');
  if (!projectId) return new Response('projectId is required', { status: 400 });

  try {
    const project = await todoistApi.getProject(projectId);
    return new Response(JSON.stringify({ project }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch project', { status: 500 });
  }
}

async function handleCreateProject(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const body = await request.json() as any;
  try {
    const project = await todoistApi.addProject(body);
    return new Response(JSON.stringify({ project }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to create project', { status: 500 });
  }
}

async function handleUpdateProject(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const body = await request.json() as any;
  const { projectId, ...updateParams } = body;
  if (!projectId) return new Response('projectId is required', { status: 400 });

  try {
    const success = await todoistApi.updateProject(projectId, updateParams);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to update project', { status: 500 });
  }
}

async function handleArchiveProject(request: Request, env: any): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const projectId = params.get('projectId');
  if (!projectId) return new Response('projectId is required', { status: 400 });

  try {
    const response = await fetch(`https://api.todoist.com/rest/v2/projects/${projectId}/archive`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.TODOIST_API_TOKEN}` },
    });
    if (!response.ok) throw new Error('Failed to archive project');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to archive project', { status: 500 });
  }
}

async function handleUnarchiveProject(request: Request, env: any): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const projectId = params.get('projectId');
  if (!projectId) return new Response('projectId is required', { status: 400 });

  try {
    const response = await fetch(`https://api.todoist.com/rest/v2/projects/${projectId}/unarchive`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.TODOIST_API_TOKEN}` },
    });
    if (!response.ok) throw new Error('Failed to unarchive project');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to unarchive project', { status: 500 });
  }
}

async function handleDeleteProject(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const projectId = params.get('projectId');
  if (!projectId) return new Response('projectId is required', { status: 400 });

  try {
    const success = await todoistApi.deleteProject(projectId);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to delete project', { status: 500 });
  }
}

async function handleGetProjectCollaborators(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const projectId = params.get('projectId');
  if (!projectId) return new Response('projectId is required', { status: 400 });

  try {
    const collaborators = await todoistApi.getProjectCollaborators(projectId);
    return new Response(JSON.stringify({ collaborators }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch collaborators', { status: 500 });
  }
}

// Section Handlers
async function handleListSections(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const projectId = params.get('projectId');

  try {
    const sections = projectId ? await todoistApi.getSections({ projectId } as GetSectionsArgs) : [];
    return new Response(JSON.stringify({ sections }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch sections', { status: 500 });
  }
}

async function handleGetSection(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const sectionId = params.get('sectionId');
  if (!sectionId) return new Response('sectionId is required', { status: 400 });

  try {
    const section = await todoistApi.getSection(sectionId);
    return new Response(JSON.stringify({ section }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch section', { status: 500 });
  }
}

async function handleCreateSection(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const body = await request.json() as any;
  try {
    const section = await todoistApi.addSection(body);
    return new Response(JSON.stringify({ section }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to create section', { status: 500 });
  }
}

async function handleUpdateSection(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const body = await request.json() as any;
  const { sectionId, ...updateParams } = body;
  if (!sectionId) return new Response('sectionId is required', { status: 400 });

  try {
    const success = await todoistApi.updateSection(sectionId, updateParams);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to update section', { status: 500 });
  }
}

async function handleDeleteSection(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const sectionId = params.get('sectionId');
  if (!sectionId) return new Response('sectionId is required', { status: 400 });

  try {
    const success = await todoistApi.deleteSection(sectionId);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to delete section', { status: 500 });
  }
}

// Comment Handlers
async function handleListComments(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const taskId = params.get('taskId');
  const projectId = params.get('projectId');

  try {
    let comments;
    if (taskId) {
      comments = await todoistApi.getComments({ taskId }); // Only pass taskId, do not include projectId
    } else if (projectId) {
      comments = await todoistApi.getComments({ projectId }); // Only pass projectId, do not include taskId
    } else {
      return new Response('taskId or projectId is required', { status: 400 });
    }
    return new Response(JSON.stringify({ comments }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch comments', { status: 500 });
  }
}

async function handleGetComment(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const commentId = params.get('commentId');
  if (!commentId) return new Response('commentId is required', { status: 400 });

  try {
    const comment = await todoistApi.getComment(commentId);
    return new Response(JSON.stringify({ comment }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch comment', { status: 500 });
  }
}

async function handleCreateComment(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const body = await request.json() as any;
  if (!body.taskId && !body.projectId) return new Response('taskId or projectId is required', { status: 400 });

  try {
    const comment = await todoistApi.addComment(body);
    return new Response(JSON.stringify({ comment }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to create comment', { status: 500 });
  }
}

async function handleUpdateComment(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const body = await request.json() as any;
  const { commentId, ...updateParams } = body;
  if (!commentId) return new Response('commentId is required', { status: 400 });

  try {
    const success = await todoistApi.updateComment(commentId, updateParams);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to update comment', { status: 500 });
  }
}

async function handleDeleteComment(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const commentId = params.get('commentId');
  if (!commentId) return new Response('commentId is required', { status: 400 });

  try {
    const success = await todoistApi.deleteComment(commentId);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to delete comment', { status: 500 });
  }
}

// Label Handlers
async function handleListLabels(request: Request, todoistApi: TodoistApi): Promise<Response> {
  try {
    const labels = await todoistApi.getLabels();
    return new Response(JSON.stringify({ labels }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch labels', { status: 500 });
  }
}

async function handleGetLabel(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const labelId = params.get('labelId');
  if (!labelId) return new Response('labelId is required', { status: 400 });

  try {
    const label = await todoistApi.getLabel(labelId);
    return new Response(JSON.stringify({ label }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to fetch label', { status: 500 });
  }
}

async function handleCreateLabel(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const body = await request.json() as any;
  try {
    const label = await todoistApi.addLabel(body);
    return new Response(JSON.stringify({ label }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to create label', { status: 500 });
  }
}

async function handleUpdateLabel(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const body = await request.json() as any;
  const { labelId, ...updateParams } = body;
  if (!labelId) return new Response('labelId is required', { status: 400 });

  try {
    const success = await todoistApi.updateLabel(labelId, updateParams);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to update label', { status: 500 });
  }
}

async function handleDeleteLabel(request: Request, todoistApi: TodoistApi): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const labelId = params.get('labelId');
  if (!labelId) return new Response('labelId is required', { status: 400 });

  try {
    const success = await todoistApi.deleteLabel(labelId);
    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to delete label', { status: 500 });
  }
}

// Shared Label Handlers
async function handleGetSharedLabels(request: Request, env: any): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const omitPersonal = params.get('omitPersonal') === 'true';

  try {
    const url = new URL('https://api.todoist.com/rest/v2/labels/shared');
    if (omitPersonal) url.searchParams.append('omit_personal', 'true');
    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${env.TODOIST_API_TOKEN}` },
    });
    if (!response.ok) throw new Error('Failed to get shared labels');
    const labels = await response.json();
    return new Response(JSON.stringify({ labels }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to get shared labels', { status: 500 });
  }
}

async function handleRenameSharedLabel(request: Request, env: any): Promise<Response> {
  const body = await request.json() as any;
  try {
    const response = await fetch('https://api.todoist.com/rest/v2/labels/shared/rename', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.TODOIST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: body.name, new_name: body.newName }),
    });
    if (!response.ok) throw new Error('Failed to rename shared label');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to rename shared label', { status: 500 });
  }
}

async function handleRemoveSharedLabel(request: Request, env: any): Promise<Response> {
  const body = await request.json() as any;
  try {
    const response = await fetch('https://api.todoist.com/rest/v2/labels/shared/remove', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.TODOIST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: body.name }),
    });
    if (!response.ok) throw new Error('Failed to remove shared label');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Failed to remove shared label', { status: 500 });
  }
}