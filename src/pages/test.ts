import { RouteEvent } from "../types/route";

/**
 * Test page that returns HTML with forms for API testing
 */
export async function testPage(event: RouteEvent) {
  const baseUrl = event.req.protocol + "://" + event.req.get("host");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AsterMail API Test</title>
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
        </aside>
        <main class="main-content">
            <header>
                <h1>AsterMail API Test</h1>
                <p>Base URL: <strong>${baseUrl}</strong></p>
            </header>

            <section class="section">
                <h2>Send Email</h2>
                <form id="testForm">
                    <h3>SMTP Configuration</h3>
                    <label>Host: <input type="text" name="config.host" required></label>
                    <label>Port: <input type="number" name="config.port" required></label>
                    <label>Secure: <input type="checkbox" name="config.secure"></label>
                    <label>User: <input type="email" name="config.auth.user" required></label>
                    <label>Password: <input type="password" name="config.auth.pass" required></label>

                    <h3>Email Data</h3>
                    <label>To: <input type="email" name="data.to" required></label>
                    <label>Subject: <input type="text" name="data.subject" required></label>
                    <label>HTML: <textarea name="data.html" rows="5" required><p>Test email content</p></textarea></label>
                    <label>Autoresponse Enabled: <input type="checkbox" name="data.autoresponse.enabled"></label>
                    <label>Autoresponse Content: <textarea name="data.autoresponse.content" rows="3"></textarea></label>

                    <button type="submit">Send Email</button>
                </form>

                <div id="response"></div>
            </section>
        </main>
    </div>

    <script>
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }

        document.getElementById('testForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {};
            for (let [key, value] of formData.entries()) {
                const keys = key.split('.');
                let current = data;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) current[keys[i]] = {};
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value === 'on' ? true : value;
            }
            data.config.secure = formData.get('config.secure') === 'on';
            data.data.autoresponse = {
                enabled: formData.get('data.autoresponse.enabled') === 'on',
                content: formData.get('data.autoresponse.content')
            };
            try {
                const response = await fetch('${baseUrl}/api/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                document.getElementById('response').textContent = JSON.stringify(result, null, 2);
            } catch (error) {
                document.getElementById('response').textContent = 'Error: ' + error.message;
            }
        });
    </script>
</body>
</html>
`;

  event.res.setHeader("Content-Type", "text/html; charset=utf-8");
  event.res.status(200).send(html);
}