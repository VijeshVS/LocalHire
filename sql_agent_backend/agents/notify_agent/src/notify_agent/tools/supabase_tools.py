from crewai.tools import BaseTool
from typing import Type
from pydantic import BaseModel, Field
from supabase import create_client, Client
import os
import json
import re

url: str = str(os.environ.get("SUPABASE_URL"))
key: str = str(os.environ.get("SUPABASE_KEY"))
supabase: Client = create_client(url, key)

def normalize_sql(query: str) -> str:
    if not query:
        return ""

    q = query
    q = q.replace("\\n", " ")
    q = re.sub(r"[│─┌┐└┘├┤┬┴┼]", " ", q)
    q = q.replace("\\", " ")
    q = q.rstrip().rstrip(";")
    q = re.sub(r"\s+", " ", q)

    return q.strip()

class ExecuteSQLInput(BaseModel):
    query_string: str = Field(
        ...,
        description="Raw SQL query string to be executed on database"
    )

class ExecuteSQLTool(BaseTool):
    name: str = "execute_sql"
    description: str = (
        "Executes a raw SQL query on PostGISSQL using an RPC function and returns the result"
    )
    args_schema: Type[BaseModel] = ExecuteSQLInput

    def _run(self, query_string: str) -> str:
        try:
            cleaned_query = normalize_sql(query_string)
            response = (
                supabase
                .rpc("execute_sql", {"query": cleaned_query})
                .execute()
            )

            return json.dumps(response.data)

        except Exception as e:
            return f"SQL execution failed: {str(e)}"

table_to_schema_mapping = {
    "employees": """
    create table public.employees (
        id uuid not null,
        name character varying(100) not null,
        email character varying(255) not null,
        phone character varying(20) null,
        years_of_experience integer null,
        location geography null,
        language character varying(50) null,
        rating numeric(2, 1) null,
        constraint employees_pkey primary key (id),
        constraint employees_email_key unique (email),
        constraint employees_phone_key unique (phone)
    ) TABLESPACE pg_default;
    """,
    "employee_skills":"""
    create table public.employee_skills (
        employee_id uuid not null,
        skill_id uuid not null,
        constraint employee_skills_pkey primary key (employee_id, skill_id),
        constraint employee_skills_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete CASCADE,
        constraint employee_skills_skill_id_fkey foreign KEY (skill_id) references skills (id) on delete CASCADE
    ) TABLESPACE pg_default;
    """,
    "skills": """
    create table public.skills (
        id uuid not null,
        skill_name character varying(100) not null,
        constraint skills_pkey primary key (id),
        constraint skills_skill_name_key unique (skill_name)
    ) TABLESPACE pg_default;
    """
}

class GetTableSchemaArgument(BaseModel):
    table_name: str = Field(
        ...,
        description="Name of the table whose table schema should be retrieved"
    )

class GetTableSchemaTool(BaseTool):
    name: str = "get_table_schema"
    description: str = (
        "Gets the schema of the table"
    )
    args_schema: Type[BaseModel] = GetTableSchemaArgument

    def _run(self, table_name: str) -> str:
        return table_to_schema_mapping[table_name]

class ListTablesTool(BaseTool):
    name: str = "list_tables"
    description: str = (
        "Returns a list of all tables in the database"
    )

    def _run(self) -> str:
        return """
        - employees (Stores core employee details)
        - skills (Stores unique skills)
        - employee_skills (A junction table mapping employees to their skills using (employee_id, skill_id))
        """