export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { owner, repo, branch, files, commitMessage } = body;
        const token = context.env.GITHUB_TOKEN;

        if (!token) return new Response(JSON.stringify({ error: "Нет токена" }), { status: 500 });

        for (const file of files) {
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`;
            // Получаем SHA (если файл существует)
            let sha = null;
            const getRes = await fetch(`${url}?ref=${branch}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'CF' }
            });
            if (getRes.ok) sha = (await getRes.json()).sha;

            // Отправляем файл
            const payload = { message: commitMessage, content: file.content, branch: branch };
            if (sha) payload.sha = sha;

            const putRes = await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'CF' },
                body: JSON.stringify(payload)
            });
            if (!putRes.ok) throw new Error((await putRes.json()).message);
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}