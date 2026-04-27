import os, asyncio
from google.genai import types, Client

client = Client(vertexai=True)
async def f():
    stream = await client.aio.models.generate_content_stream(
        model='gemini-3-flash-preview',
        contents='How many r in strawberry?',
    )
    parts = []
    async for chunk in stream:
        for p in chunk.candidates[0].content.parts:
            parts.append(p.text)
            print("CHUNK:", repr(p.text))
    print("TOTAL:", "".join(parts))

asyncio.run(f())
