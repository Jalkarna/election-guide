import os, asyncio, time
from google.genai import types, Client

client = Client(vertexai=True)
async def f():
    start = time.time()
    stream = await client.aio.models.generate_content_stream(
        model='gemini-3-flash-preview',
        contents='How many r in strawberry?',
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(include_thoughts=True, thinking_budget=1024)
        )
    )
    async for chunk in stream:
        for p in chunk.candidates[0].content.parts:
            print(f"[{time.time()-start:.2f}s] thought={getattr(p, 'thought', False)} len={len(p.text or '')}")

asyncio.run(f())
