#!/usr/bin/env python
from logging import info
import warnings

from voice.crew import Voice, FindSkillKeyword, LocationFinderCrew
import json
from deep_translator import GoogleTranslator
from voice.db.config import supabase
import re
import uuid

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")
translator = GoogleTranslator(source="auto", target="en")

# Regex: allows English letters, numbers, spaces, and common punctuation
ENGLISH_ONLY_REGEX = re.compile(r'^[A-Za-z0-9\s.,\-_/()]+$')

def is_english(text: str) -> bool:
    return bool(ENGLISH_ONLY_REGEX.match(text))

def work_translate():
    def translate_value(value):
        if isinstance(value, str):
            # Skip translation if already English
            if is_english(value):
                return value
            return translator.translate(value)

        elif isinstance(value, dict):
            return {k: translate_value(v) for k, v in value.items()}

        elif isinstance(value, list):
            return [translate_value(v) for v in value]

        else:
            return value  # numbers, booleans, null

    with open("info.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    translated_data = translate_value(data)

    with open("info_english.json", "w", encoding="utf-8") as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=2)

    print("Translation complete.")

def save_db(language: str, skills_id: list):
    user_id = uuid.uuid4()
    with open("info_english.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        name = data["name"]
        years_of_experience = data["years_of_experience"]

    with open("precise_location.json", "r", encoding="utf-8") as f:
        location_data = json.load(f)
        lat = location_data["latitude"]
        lon = location_data["longitude"]
        region = location_data["region"]
        city = location_data["city"]
    
    location_sql = (
        f"ST_GeogFromText('POINT({lon} {lat})')"
        if lat is not None and lon is not None
        else "NULL"
    )

    SQL_QUERY = f"""
    INSERT INTO public.employees (
        id,
        name,
        email,
        password_hash,
        years_of_experience,
        location,
        address,
        language,
        status,
        user_type
    )
    VALUES (
        '{user_id}',
        '{name}',
        '{user_id}',
        '{user_id}',
        {years_of_experience},
        {location_sql},
        '{region}, {city}',
        '{language}',
        'active',
        'non-smartphone'
    );
    """

    response = (
        supabase.rpc("run_sql", {"query": SQL_QUERY}).execute()
    )

    for skill_id in skills_id:
        supabase.table("employee_skills").insert(
            {
                "employee_id": str(user_id),
                "skill_id": skill_id
            }
        ).execute()

    print("User and skills saved to database:", response)


def find_skill_keywords():
    with open("info_english.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        skill = data["expertise"]

        response = (
            supabase.table("skills")
            .select("*")
            .execute()
        )   

        skills = [item['skill_name'] for item in response.data] # type: ignore

        inputs = {
            "skills": skills,
            "skill": skill
        }

        FindSkillKeyword().crew().kickoff(inputs=inputs)

        with open("skills.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            skills_id = [item['id'] for item in response.data if item['skill_name'] in data] # type: ignore
            return skills_id

def run():
    """
    Run the crew.
    """

    language_choices = {"1": "English", "2": "Kannada", "3": "Hindi", "4": "Telugu", "5": "Tamil"}
    choice = input("Enter 1 for English, 2 for Kannada, or 3 for Hindi or 4 for Telugu or 5 for Tamil: ").strip()
    inputs = {"language": language_choices.get(choice, "English")}

    try:
        Voice().crew().kickoff(inputs=inputs)
        work_translate()
        skills_data = find_skill_keywords()
        print("Extracted Skills:", skills_data)

        with open("info_english.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            location_inputs = {}

            location_inputs["region"] = data["location"]["region"]
            location_inputs["city"] = data["location"]["city"]
        
        LocationFinderCrew().crew().kickoff(inputs=location_inputs)
        save_db(inputs["language"],skills_data)
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")