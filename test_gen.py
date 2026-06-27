import httpx, json, time, asyncio

async def test():
    start = time.time()
    async with httpx.AsyncClient(timeout=300) as c:
        r = await c.post('http://localhost:8000/api/generate', json={
            'topic': '人工智能对高等教育的积极影响',
            'keywords': ['人工智能', '高等教育'],
            'outline': '一、引言\n二、AI提升教学效率\n三、AI促进个性化学习\n四、结论',
            'paper_type': '课程论文',
            'language': '中文'
        })
        data = r.json()
        elapsed = time.time() - start
        print(f'Elapsed: {elapsed:.1f}s')
        paper_id = data.get('id', 'N/A')
        title = data.get('title', 'N/A')
        abstract = data.get('abstract', 'N/A')
        print(f'ID: {paper_id}')
        print(f'Title: {title[:100]}')
        print(f'Abstract: {abstract[:200]}...')
        print(f'Sections: {len(data.get("sections", []))}')
        print(f'References: {len(data.get("references", []))}')
        print('OK')

asyncio.run(test())
