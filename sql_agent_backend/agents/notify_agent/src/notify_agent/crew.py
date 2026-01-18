from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
from notify_agent.tools.supabase_tools import ExecuteSQLTool, GetTableSchemaTool, ListTablesTool

@CrewBase
class NotifyAgent():
    """NotifyAgent crew"""

    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def query_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['query_agent'], # type: ignore[index]
            tools = [ExecuteSQLTool(),GetTableSchemaTool(),ListTablesTool()],
            verbose=True
        )

    @task
    def query_task(self) -> Task:
        return Task(
            config=self.tasks_config['query_task'], # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        """Creates the NotifyAgent crew"""

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            memory=True,
            tracing=True
        )
