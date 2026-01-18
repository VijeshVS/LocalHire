from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
from crewai_tools import TavilySearchTool
from voice.tools import user_input

tavily_tool = TavilySearchTool()

@CrewBase
class Voice():
    """Voice crew"""

    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def support_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['support_agent'], # type: ignore[index]
            verbose=True,
            tools=[user_input.TakeUserInputTool()]
        )

    @agent
    def skill_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['skill_agent'], # type: ignore[index]
            verbose=True,
        )

    @agent
    def location_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['location_agent'], # type: ignore[index]
            verbose=True,
            tools=[tavily_tool],
        )

    @task
    def extract_info_task(self) -> Task:
        return Task(
            config=self.tasks_config['extract_info'], # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Voice crew"""

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
        )

@CrewBase
class FindSkillKeyword():
    """Find Skill Keyword crew"""

    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def skill_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['skill_agent'], # type: ignore[index]
            verbose=True,
        )

    @agent
    def support_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['support_agent'], # type: ignore[index]
            verbose=True,
            tools=[user_input.TakeUserInputTool()]
        )
    
    @agent
    def location_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['location_agent'], # type: ignore[index]
            verbose=True,
            tools=[tavily_tool],
        )

    @task
    def find_skill_task(self) -> Task:
        return Task(
            config=self.tasks_config['find_skill'], # type: ignore[index]
        )
        

    @crew
    def crew(self) -> Crew:
        """Creates the Find Skill Keyword crew"""

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
        )
    

# Crew for location_finder and location_agent
@CrewBase
class LocationFinderCrew():
    """Location Finder Crew"""

    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def location_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['location_agent'], # type: ignore[index]
            verbose=True,
            tools=[tavily_tool],
        )
    
    @agent
    def support_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['support_agent'], # type: ignore[index]
            verbose=True,
            tools=[user_input.TakeUserInputTool()]
        )
    
    @agent
    def skill_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['skill_agent'], # type: ignore[index]
            verbose=True,
        )

    @task
    def location_finder_task(self) -> Task:
        return Task(
            config=self.tasks_config['location_finder'], # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Location Finder crew"""

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
        )