"""
Employee Dataset - Loaded from EMPLOYEE_ID.xlsx
Contains all 40 employees with full roles, skills, workload, and login credentials.
"""
from typing import Dict, List, Any, Optional

# Raw mapping with string and integer key lookups
_RAW_DATA: Dict[str, Dict[str, Any]] = {
    "1": {
        "id": "emp_01",
        "serial_no": 1,
        "name": "Arjun Reddy",
        "email": "emp_01@company.ai",
        "designation": "Project Manager",
        "role": "manager",
        "skills": [
            "Project Management",
            "Agile",
            "Scrum",
            "Risk Management"
        ],
        "experience": "7 Years",
        "experience_years": 7.0,
        "workload": 85,
        "availability_status": "Partial",
        "availability": "Partial (15% bandwidth)",
        "prev_projects": [
            "Digital Banking Platform",
            "ERP Modernization"
        ],
        "avatar_color": "bg-indigo-600",
        "password": "emp_01"
    },
    "2": {
        "id": "emp_02",
        "serial_no": 2,
        "name": "Priya Sharma",
        "email": "emp_02@company.ai",
        "designation": "Business Analyst",
        "role": "employee",
        "skills": [
            "Requirements Analysis",
            "UML",
            "SQL",
            "Documentation"
        ],
        "experience": "5 Years",
        "experience_years": 5.0,
        "workload": 62,
        "availability_status": "Available",
        "availability": "Available (38% bandwidth)",
        "prev_projects": [
            "Healthcare Management System",
            "E-Commerce Portal"
        ],
        "avatar_color": "bg-purple-600",
        "password": "emp_02"
    },
    "3": {
        "id": "emp_03",
        "serial_no": 3,
        "name": "Rahul Kumar",
        "email": "emp_03@company.ai",
        "designation": "Frontend Developer",
        "role": "employee",
        "skills": [
            "React",
            "JavaScript",
            "TypeScript",
            "HTML",
            "CSS"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 78,
        "availability_status": "Partial",
        "availability": "Partial (22% bandwidth)",
        "prev_projects": [
            "E-Commerce Portal",
            "Employee Management System"
        ],
        "avatar_color": "bg-emerald-600",
        "password": "emp_03"
    },
    "4": {
        "id": "emp_04",
        "serial_no": 4,
        "name": "Sneha Patel",
        "email": "emp_04@company.ai",
        "designation": "Backend Developer",
        "role": "employee",
        "skills": [
            "Python",
            "FastAPI",
            "REST API",
            "PostgreSQL"
        ],
        "experience": "5 Years",
        "experience_years": 5.0,
        "workload": 55,
        "availability_status": "Available",
        "availability": "Available (45% bandwidth)",
        "prev_projects": [
            "FinTech API Platform",
            "Inventory Management System"
        ],
        "avatar_color": "bg-blue-600",
        "password": "emp_04"
    },
    "5": {
        "id": "emp_05",
        "serial_no": 5,
        "name": "Vikram Singh",
        "email": "emp_05@company.ai",
        "designation": "Full Stack Developer",
        "role": "employee",
        "skills": [
            "React",
            "Node.js",
            "Express",
            "MongoDB",
            "REST API"
        ],
        "experience": "6 Years",
        "experience_years": 6.0,
        "workload": 91,
        "availability_status": "Partial",
        "availability": "Partial (9% bandwidth)",
        "prev_projects": [
            "Learning Management System",
            "CRM Platform"
        ],
        "avatar_color": "bg-teal-600",
        "password": "emp_05"
    },
    "6": {
        "id": "emp_06",
        "serial_no": 6,
        "name": "Ananya Rao",
        "email": "emp_06@company.ai",
        "designation": "UI/UX Designer",
        "role": "employee",
        "skills": [
            "Figma",
            "Wireframing",
            "Prototyping",
            "User Research"
        ],
        "experience": "3 Years",
        "experience_years": 3.0,
        "workload": 35,
        "availability_status": "Available",
        "availability": "Available (65% bandwidth)",
        "prev_projects": [
            "Mobile Banking App",
            "Food Delivery Platform"
        ],
        "avatar_color": "bg-cyan-600",
        "password": "emp_06"
    },
    "7": {
        "id": "emp_07",
        "serial_no": 7,
        "name": "Karthik Nair",
        "email": "emp_07@company.ai",
        "designation": "DevOps Engineer",
        "role": "employee",
        "skills": [
            "Docker",
            "Kubernetes",
            "Jenkins",
            "AWS",
            "CI/CD"
        ],
        "experience": "6 Years",
        "experience_years": 6.0,
        "workload": 96,
        "availability_status": "Not Available",
        "availability": "Busy (Fully Allocated)",
        "prev_projects": [
            "Cloud Migration Project",
            "Microservices Platform"
        ],
        "avatar_color": "bg-sky-600",
        "password": "emp_07"
    },
    "8": {
        "id": "emp_08",
        "serial_no": 8,
        "name": "Meera Iyer",
        "email": "emp_08@company.ai",
        "designation": "QA Engineer",
        "role": "employee",
        "skills": [
            "Manual Testing",
            "Selenium",
            "API Testing",
            "PyTest"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 82,
        "availability_status": "Partial",
        "availability": "Partial (18% bandwidth)",
        "prev_projects": [
            "Banking Application",
            "E-Commerce Platform"
        ],
        "avatar_color": "bg-pink-600",
        "password": "emp_08"
    },
    "9": {
        "id": "emp_09",
        "serial_no": 9,
        "name": "Rohit Verma",
        "email": "emp_09@company.ai",
        "designation": "Data Engineer",
        "role": "employee",
        "skills": [
            "Python",
            "SQL",
            "ETL",
            "Apache Spark",
            "Airflow"
        ],
        "experience": "5 Years",
        "experience_years": 5.0,
        "workload": 58,
        "availability_status": "Available",
        "availability": "Available (42% bandwidth)",
        "prev_projects": [
            "Customer Analytics Platform",
            "Data Warehouse"
        ],
        "avatar_color": "bg-rose-600",
        "password": "emp_09"
    },
    "10": {
        "id": "emp_10",
        "serial_no": 10,
        "name": "Divya Menon",
        "email": "emp_10@company.ai",
        "designation": "Machine Learning Engineer",
        "role": "employee",
        "skills": [
            "Python",
            "Scikit-learn",
            "TensorFlow",
            "ML",
            "Pandas"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 32,
        "availability_status": "Available",
        "availability": "Available (68% bandwidth)",
        "prev_projects": [
            "Fraud Detection System",
            "Recommendation Engine"
        ],
        "avatar_color": "bg-amber-600",
        "password": "emp_10"
    },
    "11": {
        "id": "emp_11",
        "serial_no": 11,
        "name": "Sanjay Gupta",
        "email": "emp_11@company.ai",
        "designation": "Cloud Engineer",
        "role": "employee",
        "skills": [
            "AWS",
            "Azure",
            "Terraform",
            "Networking",
            "Linux"
        ],
        "experience": "7 Years",
        "experience_years": 7.0,
        "workload": 94,
        "availability_status": "Not Available",
        "availability": "Busy (Fully Allocated)",
        "prev_projects": [
            "Cloud Infrastructure Migration",
            "Disaster Recovery System"
        ],
        "avatar_color": "bg-orange-600",
        "password": "emp_11"
    },
    "12": {
        "id": "emp_12",
        "serial_no": 12,
        "name": "Pooja Shah",
        "email": "emp_12@company.ai",
        "designation": "Database Administrator",
        "role": "employee",
        "skills": [
            "PostgreSQL",
            "MySQL",
            "Oracle",
            "Database Tuning",
            "Backup"
        ],
        "experience": "6 Years",
        "experience_years": 6.0,
        "workload": 64,
        "availability_status": "Available",
        "availability": "Available (36% bandwidth)",
        "prev_projects": [
            "Banking Database Migration",
            "ERP Database Upgrade"
        ],
        "avatar_color": "bg-violet-600",
        "password": "emp_12"
    },
    "13": {
        "id": "emp_13",
        "serial_no": 13,
        "name": "Manish Yadav",
        "email": "emp_13@company.ai",
        "designation": "Mobile App Developer",
        "role": "employee",
        "skills": [
            "Flutter",
            "Dart",
            "Android",
            "REST API",
            "Firebase"
        ],
        "experience": "3 Years",
        "experience_years": 3.0,
        "workload": 41,
        "availability_status": "Available",
        "availability": "Available (59% bandwidth)",
        "prev_projects": [
            "Healthcare Mobile App",
            "Campus Companion App"
        ],
        "avatar_color": "bg-indigo-600",
        "password": "emp_13"
    },
    "14": {
        "id": "emp_14",
        "serial_no": 14,
        "name": "Lakshmi Devi",
        "email": "emp_14@company.ai",
        "designation": "Cybersecurity Engineer",
        "role": "employee",
        "skills": [
            "Network Security",
            "OWASP",
            "SIEM",
            "Vulnerability Assessment"
        ],
        "experience": "5 Years",
        "experience_years": 5.0,
        "workload": 57,
        "availability_status": "Available",
        "availability": "Available (43% bandwidth)",
        "prev_projects": [
            "Secure Banking Portal",
            "Security Audit Platform"
        ],
        "avatar_color": "bg-purple-600",
        "password": "emp_14"
    },
    "15": {
        "id": "emp_15",
        "serial_no": 15,
        "name": "Aditya Joshi",
        "email": "emp_15@company.ai",
        "designation": "Software Architect",
        "role": "project_lead",
        "skills": [
            "System Design",
            "Microservices",
            "Java",
            "Cloud Architecture"
        ],
        "experience": "9 Years",
        "experience_years": 9.0,
        "workload": 98,
        "availability_status": "Not Available",
        "availability": "Busy (Fully Allocated)",
        "prev_projects": [
            "Enterprise CRM",
            "Distributed Payment Platform"
        ],
        "avatar_color": "bg-emerald-600",
        "password": "emp_15"
    },
    "16": {
        "id": "emp_16",
        "serial_no": 16,
        "name": "Nisha Kapoor",
        "email": "emp_16@company.ai",
        "designation": "Technical Writer",
        "role": "employee",
        "skills": [
            "Technical Documentation",
            "API Documentation",
            "Markdown",
            "Git"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 28,
        "availability_status": "Available",
        "availability": "Available (72% bandwidth)",
        "prev_projects": [
            "Developer Portal",
            "API Documentation Project"
        ],
        "avatar_color": "bg-blue-600",
        "password": "emp_16"
    },
    "17": {
        "id": "emp_17",
        "serial_no": 17,
        "name": "Varun Reddy",
        "email": "emp_17@company.ai",
        "designation": "Site Reliability Engineer",
        "role": "employee",
        "skills": [
            "Linux",
            "Kubernetes",
            "Monitoring",
            "Prometheus",
            "Grafana"
        ],
        "experience": "5 Years",
        "experience_years": 5.0,
        "workload": 61,
        "availability_status": "Available",
        "availability": "Available (39% bandwidth)",
        "prev_projects": [
            "Cloud Reliability Platform",
            "Production Monitoring System"
        ],
        "avatar_color": "bg-teal-600",
        "password": "emp_17"
    },
    "18": {
        "id": "emp_18",
        "serial_no": 18,
        "name": "Ishita Rao",
        "email": "emp_18@company.ai",
        "designation": "Product Manager",
        "role": "project_lead",
        "skills": [
            "Product Strategy",
            "Roadmapping",
            "Agile",
            "Market Research"
        ],
        "experience": "6 Years",
        "experience_years": 6.0,
        "workload": 88,
        "availability_status": "Partial",
        "availability": "Partial (12% bandwidth)",
        "prev_projects": [
            "SaaS Product Launch",
            "Customer Experience Platform"
        ],
        "avatar_color": "bg-cyan-600",
        "password": "emp_18"
    },
    "19": {
        "id": "emp_19",
        "serial_no": 19,
        "name": "Abhishek Das",
        "email": "emp_19@company.ai",
        "designation": "AI Engineer",
        "role": "employee",
        "skills": [
            "Python",
            "LLMs",
            "RAG",
            "LangChain",
            "Vector Databases"
        ],
        "experience": "3 Years",
        "experience_years": 3.0,
        "workload": 38,
        "availability_status": "Available",
        "availability": "Available (62% bandwidth)",
        "prev_projects": [
            "AI Customer Support Bot",
            "Document Intelligence System"
        ],
        "avatar_color": "bg-sky-600",
        "password": "emp_19"
    },
    "20": {
        "id": "emp_20",
        "serial_no": 20,
        "name": "Neha Rani",
        "email": "emp_20@company.ai",
        "designation": "Integration Engineer",
        "role": "employee",
        "skills": [
            "REST API",
            "Webhooks",
            "OAuth",
            "Postman",
            "JSON"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 52,
        "availability_status": "Available",
        "availability": "Available (48% bandwidth)",
        "prev_projects": [
            "Payment Gateway Integration",
            "Government Services Portal"
        ],
        "avatar_color": "bg-pink-600",
        "password": "emp_20"
    },
    "21": {
        "id": "emp_21",
        "serial_no": 21,
        "name": "Suresh Kumar",
        "email": "emp_21@company.ai",
        "designation": "Frontend Developer",
        "role": "employee",
        "skills": [
            "React",
            "JavaScript",
            "TypeScript",
            "Next.js",
            "CSS"
        ],
        "experience": "3 Years",
        "experience_years": 3.0,
        "workload": 100,
        "availability_status": "Not Available",
        "availability": "Busy (Fully Allocated)",
        "prev_projects": [
            "Travel Booking Portal",
            "Retail Dashboard"
        ],
        "avatar_color": "bg-rose-600",
        "password": "emp_21"
    },
    "22": {
        "id": "emp_22",
        "serial_no": 22,
        "name": "Kavya Reddy",
        "email": "emp_22@company.ai",
        "designation": "Backend Developer",
        "role": "employee",
        "skills": [
            "Java",
            "Spring Boot",
            "REST API",
            "MySQL",
            "Redis"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 73,
        "availability_status": "Partial",
        "availability": "Partial (27% bandwidth)",
        "prev_projects": [
            "Insurance Management System",
            "Payment API"
        ],
        "avatar_color": "bg-amber-600",
        "password": "emp_22"
    },
    "23": {
        "id": "emp_23",
        "serial_no": 23,
        "name": "Mohammed Faisal",
        "email": "emp_23@company.ai",
        "designation": "QA Engineer",
        "role": "employee",
        "skills": [
            "Selenium",
            "Cypress",
            "API Testing",
            "JMeter",
            "SQL"
        ],
        "experience": "5 Years",
        "experience_years": 5.0,
        "workload": 86,
        "availability_status": "Available",
        "availability": "Available (14% bandwidth)",
        "prev_projects": [
            "Telecom Portal",
            "Banking Application"
        ],
        "avatar_color": "bg-orange-600",
        "password": "emp_23"
    },
    "24": {
        "id": "emp_24",
        "serial_no": 24,
        "name": "Aditi Sharma",
        "email": "emp_24@company.ai",
        "designation": "Full Stack Developer",
        "role": "employee",
        "skills": [
            "React",
            "Node.js",
            "Python",
            "PostgreSQL",
            "Docker"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 93,
        "availability_status": "Not Available",
        "availability": "Busy (Fully Allocated)",
        "prev_projects": [
            "Healthcare Portal",
            "E-Commerce Platform"
        ],
        "avatar_color": "bg-violet-600",
        "password": "emp_24"
    },
    "25": {
        "id": "emp_25",
        "serial_no": 25,
        "name": "Ramesh Babu",
        "email": "emp_25@company.ai",
        "designation": "Data Engineer",
        "role": "employee",
        "skills": [
            "Python",
            "SQL",
            "ETL",
            "Spark",
            "Kafka"
        ],
        "experience": "6 Years",
        "experience_years": 6.0,
        "workload": 79,
        "availability_status": "Partial",
        "availability": "Partial (21% bandwidth)",
        "prev_projects": [
            "Real-Time Analytics Platform",
            "Data Lake"
        ],
        "avatar_color": "bg-indigo-600",
        "password": "emp_25"
    },
    "26": {
        "id": "emp_26",
        "serial_no": 26,
        "name": "Swathi Nair",
        "email": "emp_26@company.ai",
        "designation": "Machine Learning Engineer",
        "role": "employee",
        "skills": [
            "Python",
            "PyTorch",
            "TensorFlow",
            "NLP",
            "Pandas"
        ],
        "experience": "5 Years",
        "experience_years": 5.0,
        "workload": 47,
        "availability_status": "Available",
        "availability": "Available (53% bandwidth)",
        "prev_projects": [
            "NLP Classification System",
            "Predictive Analytics"
        ],
        "avatar_color": "bg-purple-600",
        "password": "emp_26"
    },
    "27": {
        "id": "emp_27",
        "serial_no": 27,
        "name": "Deepak Rao",
        "email": "emp_27@company.ai",
        "designation": "DevOps Engineer",
        "role": "employee",
        "skills": [
            "AWS",
            "Docker",
            "Kubernetes",
            "GitHub Actions",
            "Terraform"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 68,
        "availability_status": "Available",
        "availability": "Available (32% bandwidth)",
        "prev_projects": [
            "Cloud Deployment Platform",
            "CI/CD Migration"
        ],
        "avatar_color": "bg-emerald-600",
        "password": "emp_27"
    },
    "28": {
        "id": "emp_28",
        "serial_no": 28,
        "name": "Harini Gupta",
        "email": "emp_28@company.ai",
        "designation": "UI/UX Designer",
        "role": "employee",
        "skills": [
            "Figma",
            "UX Research",
            "Prototyping",
            "Design Systems"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 44,
        "availability_status": "Available",
        "availability": "Available (56% bandwidth)",
        "prev_projects": [
            "Education App",
            "Healthcare Dashboard"
        ],
        "avatar_color": "bg-blue-600",
        "password": "emp_28"
    },
    "29": {
        "id": "emp_29",
        "serial_no": 29,
        "name": "Ajay Singh",
        "email": "emp_29@company.ai",
        "designation": "Cloud Engineer",
        "role": "employee",
        "skills": [
            "AWS",
            "Azure",
            "Linux",
            "Terraform",
            "Cloud Security"
        ],
        "experience": "5 Years",
        "experience_years": 5.0,
        "workload": 97,
        "availability_status": "Not Available",
        "availability": "Busy (Fully Allocated)",
        "prev_projects": [
            "Cloud Migration",
            "Serverless Application"
        ],
        "avatar_color": "bg-teal-600",
        "password": "emp_29"
    },
    "30": {
        "id": "emp_30",
        "serial_no": 30,
        "name": "Sneha Reddy",
        "email": "emp_30@company.ai",
        "designation": "Database Administrator",
        "role": "employee",
        "skills": [
            "MySQL",
            "PostgreSQL",
            "Oracle",
            "SQL Optimization",
            "Backup"
        ],
        "experience": "7 Years",
        "experience_years": 7.0,
        "workload": 71,
        "availability_status": "Partial",
        "availability": "Partial (29% bandwidth)",
        "prev_projects": [
            "ERP Database Migration",
            "Financial Reporting System"
        ],
        "avatar_color": "bg-cyan-600",
        "password": "emp_30"
    },
    "31": {
        "id": "emp_31",
        "serial_no": 31,
        "name": "Ravi Teja",
        "email": "emp_31@company.ai",
        "designation": "Mobile App Developer",
        "role": "employee",
        "skills": [
            "Flutter",
            "Dart",
            "Android",
            "Firebase",
            "REST API"
        ],
        "experience": "3 Years",
        "experience_years": 3.0,
        "workload": 36,
        "availability_status": "Available",
        "availability": "Available (64% bandwidth)",
        "prev_projects": [
            "Delivery Tracking App",
            "Student App"
        ],
        "avatar_color": "bg-sky-600",
        "password": "emp_31"
    },
    "32": {
        "id": "emp_32",
        "serial_no": 32,
        "name": "Madhavi Rao",
        "email": "emp_32@company.ai",
        "designation": "Cybersecurity Engineer",
        "role": "employee",
        "skills": [
            "Penetration Testing",
            "OWASP",
            "SIEM",
            "Network Security"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 89,
        "availability_status": "Not Available",
        "availability": "Busy (Fully Allocated)",
        "prev_projects": [
            "Cybersecurity Assessment",
            "Secure API Gateway"
        ],
        "avatar_color": "bg-pink-600",
        "password": "emp_32"
    },
    "33": {
        "id": "emp_33",
        "serial_no": 33,
        "name": "Naveen Kumar",
        "email": "emp_33@company.ai",
        "designation": "Software Architect",
        "role": "project_lead",
        "skills": [
            "System Design",
            "Microservices",
            "Java",
            "AWS",
            "Kubernetes"
        ],
        "experience": "8 Years",
        "experience_years": 8.0,
        "workload": 95,
        "availability_status": "Not Available",
        "availability": "Busy (Fully Allocated)",
        "prev_projects": [
            "Enterprise Banking Platform",
            "Microservices Migration"
        ],
        "avatar_color": "bg-rose-600",
        "password": "emp_33"
    },
    "34": {
        "id": "emp_34",
        "serial_no": 34,
        "name": "Pallavi Joshi",
        "email": "emp_34@company.ai",
        "designation": "Technical Writer",
        "role": "employee",
        "skills": [
            "API Documentation",
            "Technical Writing",
            "Git",
            "Markdown"
        ],
        "experience": "3 Years",
        "experience_years": 3.0,
        "workload": 25,
        "availability_status": "Available",
        "availability": "Available (75% bandwidth)",
        "prev_projects": [
            "Developer Documentation Portal",
            "Product Knowledge Base"
        ],
        "avatar_color": "bg-amber-600",
        "password": "emp_34"
    },
    "35": {
        "id": "emp_35",
        "serial_no": 35,
        "name": "Chandra Sekhar",
        "email": "emp_35@company.ai",
        "designation": "Site Reliability Engineer",
        "role": "employee",
        "skills": [
            "Kubernetes",
            "Linux",
            "Prometheus",
            "Grafana",
            "Incident Management"
        ],
        "experience": "6 Years",
        "experience_years": 6.0,
        "workload": 92,
        "availability_status": "Not Available",
        "availability": "Busy (Fully Allocated)",
        "prev_projects": [
            "Production Monitoring",
            "Cloud Reliability Platform"
        ],
        "avatar_color": "bg-orange-600",
        "password": "emp_35"
    },
    "36": {
        "id": "emp_36",
        "serial_no": 36,
        "name": "Keerthi Menon",
        "email": "emp_36@company.ai",
        "designation": "Product Manager",
        "role": "project_lead",
        "skills": [
            "Product Strategy",
            "Agile",
            "Roadmapping",
            "Analytics"
        ],
        "experience": "5 Years",
        "experience_years": 5.0,
        "workload": 63,
        "availability_status": "Available",
        "availability": "Available (37% bandwidth)",
        "prev_projects": [
            "SaaS Platform",
            "Digital Marketplace"
        ],
        "avatar_color": "bg-violet-600",
        "password": "emp_36"
    },
    "37": {
        "id": "emp_37",
        "serial_no": 37,
        "name": "Tarun Das",
        "email": "emp_37@company.ai",
        "designation": "AI Engineer",
        "role": "employee",
        "skills": [
            "Python",
            "LLMs",
            "RAG",
            "LangChain",
            "Vector Databases"
        ],
        "experience": "4 Years",
        "experience_years": 4.0,
        "workload": 84,
        "availability_status": "Partial",
        "availability": "Partial (16% bandwidth)",
        "prev_projects": [
            "AI Knowledge Assistant",
            "Intelligent Document Search"
        ],
        "avatar_color": "bg-indigo-600",
        "password": "emp_37"
    },
    "38": {
        "id": "emp_38",
        "serial_no": 38,
        "name": "Divya Rao",
        "email": "emp_38@company.ai",
        "designation": "Integration Engineer",
        "role": "employee",
        "skills": [
            "REST API",
            "OAuth",
            "Webhooks",
            "JSON",
            "Postman"
        ],
        "experience": "3 Years",
        "experience_years": 3.0,
        "workload": 59,
        "availability_status": "Available",
        "availability": "Available (41% bandwidth)",
        "prev_projects": [
            "Payment Integration",
            "CRM Integration"
        ],
        "avatar_color": "bg-purple-600",
        "password": "emp_38"
    },
    "39": {
        "id": "emp_39",
        "serial_no": 39,
        "name": "Gautham Reddy",
        "email": "emp_39@company.ai",
        "designation": "Backend Developer",
        "role": "employee",
        "skills": [
            "Python",
            "Django",
            "REST API",
            "PostgreSQL",
            "Redis"
        ],
        "experience": "6 Years",
        "experience_years": 6.0,
        "workload": 99,
        "availability_status": "Not Available",
        "availability": "Busy (Fully Allocated)",
        "prev_projects": [
            "Hospital Management System",
            "Logistics API"
        ],
        "avatar_color": "bg-emerald-600",
        "password": "emp_39"
    },
    "40": {
        "id": "emp_40",
        "serial_no": 40,
        "name": "Sowmya Patel",
        "email": "emp_40@company.ai",
        "designation": "QA Engineer",
        "role": "employee",
        "skills": [
            "Manual Testing",
            "Selenium",
            "Cypress",
            "API Testing"
        ],
        "experience": "3 Years",
        "experience_years": 3.0,
        "workload": 67,
        "availability_status": "Available",
        "availability": "Available (33% bandwidth)",
        "prev_projects": [
            "Mobile Banking App",
            "Online Shopping Platform"
        ],
        "avatar_color": "bg-blue-600",
        "password": "emp_40"
    }
}

EMPLOYEES_DATA: Dict[int, Dict[str, Any]] = {
    int(k): v for k, v in _RAW_DATA.items()
}

def get_all_employees() -> List[Dict[str, Any]]:
    """Return list of all 40 employee records sorted by serial number."""
    return sorted(list(EMPLOYEES_DATA.values()), key=lambda x: x["serial_no"])

def get_employee_by_num(num: int) -> Optional[Dict[str, Any]]:
    """Retrieve an employee profile by their serial number (1-40)."""
    try:
        n = int(num)
        return EMPLOYEES_DATA.get(n)
    except (ValueError, TypeError):
        return None

def get_employee_by_id(emp_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve an employee profile by employee ID (e.g. emp_01, emp_02, emp_1)."""
    if not emp_id:
        return None
    clean = str(emp_id).strip().lower()
    if clean.isdigit():
        return get_employee_by_num(int(clean))
    
    # Try exact match
    for emp in EMPLOYEES_DATA.values():
        if emp["id"].lower() == clean:
            return emp
            
    # Try normalized emp_XX match (e.g. emp_1 -> emp_01)
    if clean.startswith("emp_"):
        suffix = clean.split("_")[1]
        if suffix.isdigit():
            return get_employee_by_num(int(suffix))
            
    return None

def get_employee_by_email_or_name(query: str) -> Optional[Dict[str, Any]]:
    """Find employee by email, ID, or full name (case-insensitive)."""
    if not query:
        return None
    q = str(query).strip().lower()
    
    # Direct ID check
    by_id = get_employee_by_id(q)
    if by_id:
        return by_id
        
    # Email or name check
    for emp in EMPLOYEES_DATA.values():
        if emp["email"].lower() == q or emp["name"].lower() == q:
            return emp
        if q in emp["email"].lower() or q in emp["name"].lower():
            return emp
            
    return None

def authenticate_employee(identifier: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticate employee credentials.
    Identifier can be employee ID (emp_01), email (emp_01@company.ai), or name.
    Password can be their employee ID (emp_01), or standard default passwords.
    """
    if not identifier or not password:
        return None
        
    emp = get_employee_by_email_or_name(identifier)
    if not emp:
        return None
        
    pwd_clean = str(password).strip().lower()
    valid_passwords = {
        emp["id"].lower(),
        f"emp_{emp['serial_no']}",
        f"emp_{emp['serial_no']:02d}",
        "password123",
        "password",
        "admin",
        "kuiper123"
    }
    
    if pwd_clean in valid_passwords:
        return emp
        
    return None
