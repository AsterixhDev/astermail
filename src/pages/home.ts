import { readFileSync } from "fs";
import { join } from "path";
import os from "os";
import process from "process";
import { RouteEvent } from "../types/route";

/**
 * Home page that returns HTML documentation for AsterMail API
 */
export async function homePage(event: RouteEvent) {
  try {
    const routeDetailsPath = join(process.cwd(), "src/constants/routeDetails.json");
    const routeDetailsContent = readFileSync(routeDetailsPath, "utf8");
    const routeDetails = JSON.parse(routeDetailsContent);

    const serverInfo = {
      server_status: "online",
      current_time: new Date().toISOString(),
      server_url: event.req.protocol + "://" + event.req.get("host"),
      health: {
        uptime: Math.floor(process.uptime()) + " seconds",
        memory: {
          total: Math.round(os.totalmem() / (1024 * 1024)) + " MB",
          free: Math.round(os.freemem() / (1024 * 1024)) + " MB",
        },
        process: {
          pid: process.pid,
        }
      }
    };

    routeDetails.api_documentation.base_url = serverInfo.server_url;

    const sectionsHtml = (routeDetails.api_documentation.sections as any[]).map((section: any) => `
    <h2 id="${section.name.toLowerCase().replace(' ', '-')}">${section.name}</h2>
    <p>${section.description}</p>
    ${section.endpoints.map((endpoint: any) => `
    <div class="endpoint">
        <h3><span class="method">${endpoint.method}</span> ${endpoint.path}</h3>
        <p>${endpoint.description}</p>
        ${endpoint.parameters ? `
        <h4>Parameters</h4>
        <pre>${JSON.stringify(endpoint.parameters, null, 2)}</pre>
        ` : ''}
        <h4>Responses</h4>
        ${Object.entries(endpoint.responses as any).map(([code, resp]: [string, any]) => `
        <h5>${code}: ${resp.description}</h5>
        <pre>${JSON.stringify(resp.example, null, 2)}</pre>
        `).join('')}
    </div>
    `).join('')}
    `).join('');

  const sidebarLinks = (routeDetails.api_documentation.sections as any[]).map((section: any) => `
    <li><a href="#${section.name.toLowerCase().replace(' ', '-')}">${section.name}</a></li>
    `).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${routeDetails.api_documentation.title} Documentation</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <button class="toggle-sidebar" onclick="toggleSidebar()">☰ Menu</button>
    <div class="container">
        <aside class="sidebar" id="sidebar">
            <h2>Navigation</h2>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/test">Test API</a></li>
            </ul>
            <h2>Sections</h2>
            <ul>
                ${sidebarLinks}
            </ul>
        </aside>
        <main class="main-content">
            <header>
                <h1>${routeDetails.api_documentation.title}</h1>
                <p>${routeDetails.api_documentation.description}</p>
                <p><strong>Version:</strong> ${routeDetails.api_documentation.version}</p>
                <p><strong>Base URL:</strong> ${routeDetails.api_documentation.base_url}</p>
            </header>

            <section class="section server-info">
                <h2>Server Information</h2>
                <p><strong>Status:</strong> ${serverInfo.server_status}</p>
                <p><strong>Current Time:</strong> ${serverInfo.current_time}</p>
                <p><strong>Uptime:</strong> ${serverInfo.health.uptime}</p>
                <p><strong>Memory:</strong> Total ${serverInfo.health.memory.total}, Free ${serverInfo.health.memory.free}</p>
                <p><strong>Process ID:</strong> ${serverInfo.health.process.pid}</p>
            </section>

            <div class="content">
                ${sectionsHtml}
            </div>
        </main>
    </div>

    <script>
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }
    </script>
</body>
</html>
`;

    event.res.setHeader("Content-Type", "text/html; charset=utf-8");
    event.res.status(200).send(html);
  } catch (error) {
    event.res.status(500).send(`Error loading documentation: ${(error as Error).message}`);
  }
}