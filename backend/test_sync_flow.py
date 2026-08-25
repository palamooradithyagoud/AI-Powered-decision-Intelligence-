import urllib.request
import json

# 1. Fetch active projects
res = urllib.request.urlopen("http://localhost:8000/api/projects")
projects = json.loads(res.read())
print(f"Total projects: {len(projects)}")

if projects:
    target_project = projects[0]
    p_id = target_project["id"]
    print(f"Testing allocation on project: {target_project['name']} (ID: {p_id})")
    
    # 2. Trigger AI task allocation
    req = urllib.request.Request(
        f"http://localhost:8000/api/projects/{p_id}/ai-allocate-tasks",
        data=b"{}",
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    alloc_res = urllib.request.urlopen(req)
    alloc_data = json.loads(alloc_res.read())
    print(f"Allocation status: {alloc_data.get('status')}")
    print(f"Allocated tasks count: {len(alloc_data.get('allocated_tasks', []))}")

    # 3. Check tasks table
    tasks_res = urllib.request.urlopen("http://localhost:8000/api/tasks")
    tasks = json.loads(tasks_res.read())
    print(f"Total tasks now in database: {len(tasks)}")
    if tasks:
        sample = tasks[0]
        print(f"Sample task: {sample.get('title')} -> Assigned to {sample.get('assigned_to')} ({sample.get('assigned_emp_id')}) | Status: {sample.get('status')}")
        
        # 4. Test updating task status to Completed
        task_id = sample["id"]
        update_req = urllib.request.Request(
            f"http://localhost:8000/api/tasks/{task_id}/status",
            data=json.dumps({"status": "Completed"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="PUT"
        )
        up_res = urllib.request.urlopen(update_req)
        up_data = json.loads(up_res.read())
        print(f"Updated task status: {up_data.get('status')} -> {up_data.get('task', {}).get('status')}")
