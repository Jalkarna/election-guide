import requests
import json

try:
    response = requests.post(
        "http://localhost:8000/api/chat/sessions",
    )
    print("New session response:", response.status_code, response.text)
    session_id = response.json().get("id")
    
    if session_id:
        print("Sending message...")
        res = requests.post(
            f"http://localhost:8000/api/chat/sessions/{session_id}/stream",
            json={"message": "hello"},
            stream=True
        )
        print("Stream response status:", res.status_code)
        for line in res.iter_lines():
            if line:
                print(line.decode('utf-8'))
except Exception as e:
    print("Error:", e)
