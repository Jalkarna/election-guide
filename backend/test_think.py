import os, asyncio
from google.genai import types, Client

client = Client(vertexai=True)
async def f():
    r = await client.aio.models.generate_content(
        model='gemini-3-flash-preview',
        contents='How many r in strawberry?',
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(include_thoughts=True, thinking_budget=1024)
        )
    )
    print("Full response:", r)
    for p in r.candidates[0].content.parts:
        print(f"thought={getattr(p, 'thought', False)} text_len={len(p.text or '')}")

asyncio.run(f())
