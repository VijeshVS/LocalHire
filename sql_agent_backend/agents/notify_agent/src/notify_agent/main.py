#!/usr/bin/env python
import sys
import warnings
from datetime import datetime
from notify_agent.crew import NotifyAgent
import json
from pathlib import Path
import re
from notify_agent.tools.supabase_tools import supabase
from notify_agent.listeners.custom import MyCustomListener
import requests

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

SSE_BACKEND = "http://localhost:8000/emit"

listener = MyCustomListener()

ROOT_DIR = Path(__file__).resolve().parents[2]  # project root
INPUT_FILE = ROOT_DIR / "input.json"
QUERY_FILE = ROOT_DIR / "query.txt"
OUTPUT_FILE = ROOT_DIR / "output.txt"

def execute_sql_without_limit(input_path: str, output_path: str, supabase):

    with open(input_path, "r") as f:
        query = f.read().strip()

    cleaned_query = re.sub(
        r"\s+LIMIT\s+\d+(\s*,\s*\d+)?;?",
        "",
        query,
        flags=re.IGNORECASE
    )

    cleaned_query = cleaned_query.strip()
    cleaned_query = cleaned_query.rstrip(";") + ";"

    print(f"Query: {cleaned_query}")

    # Send SQL execution start event
    payload = {
        "type": "sql_execution",
        "action": "start",
        "query": cleaned_query
    }
    try:
        requests.post(SSE_BACKEND, json=payload, timeout=2)
    except:
        pass

    response = (
        supabase
        .rpc("execute_sql", {"query": cleaned_query})
        .execute()
    )

    # Send SQL execution complete event
    payload = {
        "type": "sql_execution",
        "action": "complete",
        "query": cleaned_query,
    }
    try:
        requests.post(SSE_BACKEND, json=payload, timeout=2)
    except:
        pass

    with open(output_path, "w") as f:
        f.write(json.dumps(response.data, indent=2))

    with open(QUERY_FILE, "w") as f:
        f.write(cleaned_query)
    
    print("Executed the sql query successfully !!")

def run():
    """
    Run the crew.
    """
    
    with open(INPUT_FILE, "r") as f:
        inputs = f.read() 

    inputs = json.loads(inputs)

    try:
        crew = NotifyAgent().crew()
        crew.kickoff(inputs=inputs)

        execute_sql_without_limit(str(OUTPUT_FILE),str(OUTPUT_FILE),supabase)
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")