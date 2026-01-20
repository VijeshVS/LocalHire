from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import subprocess
import os
import json
import asyncio
import time
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) # type: ignore

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


AGENTS_DIR = os.path.abspath("./agents")

SQL_BASE_DIR = os.path.join(AGENTS_DIR, "notify_agent")
SQL_INPUT_FILE = os.path.join(SQL_BASE_DIR, "input.json")
SQL_OUTPUT_FILE = os.path.join(SQL_BASE_DIR, "output.txt")

# SSE clients list
clients: List[asyncio.Queue] = []

class CompleteRequest(BaseModel):
    input: str
    user_id: str

@app.post("/complete")
def complete(req: CompleteRequest):
    try:    
        # for now static, it must be dynamic
        user_id = req.user_id

        print(user_id)

        query = f"""
            SELECT
            ST_Y(location::geometry)::numeric AS lat,
            ST_X(location::geometry)::numeric AS long
            FROM employers
            WHERE id = '{user_id}';
        """

        print(query)

        response = (
            supabase
            .rpc("get_employer_location", {"uid": user_id})
            .execute()
        )

        print(response)

        lat, long = response.data['lat'], response.data['lng'] # type: ignore
        print(lat,long)
        with open(SQL_INPUT_FILE, "w") as f:
            json.dump({
                "input": req.input,
                "lat": lat,
                "long": long
            }, f)
    except Exception as e:
        print("hello")
        print(e)
        raise HTTPException(500, f"Failed to write input.json: {e}")

    try:
        print(f"🚀 Running SQL agent with prompt: {req.input}")
        subprocess.run(
            ["crewai", "run"],
            cwd=SQL_BASE_DIR,
            check=True,
            text=True,
            timeout=300
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(500, f"CrewAI failed: {e.stderr}")
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "CrewAI execution timed out")

    if not os.path.exists(SQL_OUTPUT_FILE):
        raise HTTPException(500, "output.txt not found")

    with open(SQL_OUTPUT_FILE, "r") as f:
        content = f.read()
        return {"result": content if content != "null" else [] }


@app.get("/events")
async def events(request: Request):
    """SSE endpoint for real-time event streaming"""
    queue = asyncio.Queue()
    clients.append(queue)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    print("❌ Client disconnected")
                    break

                event = await queue.get()

                payload = f"data: {json.dumps(event)}\n\n"

                # ✅ LOG EXACTLY WHEN YOU SEND
                print(f"📤 [{time.strftime('%H:%M:%S')}] Sent event → {event}", flush=True)

                yield payload

        finally:
            clients.remove(queue)
            print("🧹 Client queue removed", flush=True)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


@app.post("/emit")
async def emit(event: dict):
    """Emit event to all connected SSE clients"""
    for queue in clients:
        await queue.put(event)

    return {"status": "ok"}