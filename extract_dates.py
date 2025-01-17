import spacy
from datetime import datetime
import json
import sys

nlp = spacy.load("en_core_web_sm")

def extract_dates_with_context(text):
    doc = nlp(text)
    important_dates = []

    # Iterate over named entities
    for ent in doc.ents:
        if ent.label_ == "DATE":
            # Get context around the date
            start = max(ent.start - 5, 0)
            end = min(ent.end + 5, len(doc))
            context = doc[start:end].text

            # Check if the context contains important keywords
            important_keywords = [
                "deadline", "submission", "due", "event", "meeting", "milestone"
            ]
            if any(keyword in context.lower() for keyword in important_keywords):
                important_dates.append({
                    "date": ent.text,
                    "context": context
                })

    return important_dates

# Main function to process input and return JSON
if __name__ == "__main__":
    input_text = sys.stdin.read()  # Read input from Node.js
    results = extract_dates_with_context(input_text)
    print(json.dumps(results))  # Return results as JSON

