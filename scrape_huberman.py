import urllib.request
from html.parser import HTMLParser
import re
import json
import time

topics = [
    "cold-plunges-and-deliberate-cooling",
    "fitness-and-workout-routines",
    "light-exposure-and-circadian-rhythm",
    "mental-health",
    "sleep-hygiene",
    "supplementation",
    "brain-and-neuroplasticity",
    "science-of-adhd",
    "goals-and-habits",
    "daily-routines",
    "female-sexual-health",
    "regulate-your-nervous-system",
    "male-sexual-health",
    "motivation-and-willpower",
    "optimizing-your-environment",
    "sauna-and-heat-exposure",
    "society-and-technology",
    "creativity",
    "aging-and-longevity",
    "alcohol-tobacco-and-cannabis",
    "diet-and-nutrition",
    "caffeine-science",
    "emotional-intelligence-and-relationships",
    "focus-and-concentration",
    "hormone-health",
    "memory-and-learning",
    "general-health",
    "nsdr-meditation-and-breathwork",
    "happiness-and-wellbeing"
]

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.capture = False
        self.valid_tags = {'h1', 'h2', 'h3', 'h4', 'p', 'li'}
        self.current_tag = None

    def handle_starttag(self, tag, attrs):
        if tag in self.valid_tags:
            self.capture = True
            self.current_tag = tag

    def handle_endtag(self, tag):
        if tag in self.valid_tags:
            self.capture = False
            self.current_tag = None

    def handle_data(self, data):
        if self.capture:
            clean = data.strip()
            if clean:
                self.text.append(clean)

def determine_gender(text):
    text_lower = text.lower()
    
    # Specific topics might just override this
    women_keywords = ['female', 'women', 'menstrual', 'pregnancy', 'pcos', 'ovary', 'estrogen', 'progesterone', 'menopause']
    men_keywords = ['male', 'men', 'testosterone', 'sperm', 'prostate', 'erectile']
    
    # Check counts
    w_count = sum(1 for k in women_keywords if k in text_lower)
    m_count = sum(1 for k in men_keywords if k in text_lower)
    
    if w_count > 0 and m_count == 0:
        return "Mujer"
    elif m_count > 0 and w_count == 0:
        return "Hombre"
    else:
        return "Ambos"

def sanitize_title(slug):
    return slug.replace("-", " ").title()

def extract_info():
    results = []
    
    for slug in topics:
        print(f"Fetching: {slug}")
        url = f"https://www.hubermanlab.com/topics/{slug}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                html = response.read().decode('utf-8')
            
            # Simple heuristic to extract main content block to avoid header/footer noise
            # We will basically find the section containing the articles
            # Or just parse everything and filter out noise
            
            parser = TextExtractor()
            parser.feed(html)
            
            # Filter noise (nav links, common footer text, etc.)
            filtered_text = []
            noise = [
                'what are you looking for?', 'explore the podcast', 'browse all episodes',
                'browse by topic', 'guest episodes', 'sponsors', 'nsdr', 'topics',
                'ask huberman lab', 'newsletter', 'book', 'about', 'premium dashboard',
                'log in', 'searchinput not valid', 'menu', 'close', 'explore all topics',
                'privacy policy', 'terms & conditions', 'california privacy rights',
                'copyright guidelines', 'disclaimer & disclosures', 'scicomm media llc',
                'huberman lab® is a registered trademark'
            ]
            
            # We want to group sentences into paragraphs about the topic
            content_blob = ""
            for t in parser.text:
                if t.lower() not in noise and len(t) > 20: 
                    content_blob += t + "\n\n"
            
            gender = "Ambos"
            if slug == "female-sexual-health":
                gender = "Mujer"
            elif slug == "male-sexual-health":
                gender = "Hombre"
            else:
                gender = determine_gender(content_blob)
            
            results.append({
                "topic": sanitize_title(slug),
                "url": url,
                "gender": gender,
                "content": content_blob.strip()
            })
            time.sleep(1) # Polite sleep
        except Exception as e:
            print(f"Error fetching {slug}: {e}")
            
    with open("cerebro_vectorial.md", "w", encoding="utf-8") as f:
        f.write("# Cerebro Vectorial: Huberman Lab Topics Extraction\n\n")
        f.write("Este documento contiene la extracción de todos los temas relevantes publicados en Huberman Lab, categorizados y etiquetados por género (Hombre, Mujer, Ambos), listo para ser utilizado como base de conocimiento vectorial.\n\n")
        
        for item in results:
            f.write(f"## {item['topic']}\n")
            f.write(f"**URL**: [{item['url']}]({item['url']})\n")
            f.write(f"**Relevancia de Género**: `{item['gender']}`\n\n")
            f.write("### Descripción y Temas Relevantes\n")
            # Limit the text or just put it all. The user wants ALL info, so we put it all.
            # But the extracted text could have weird newlines, let's keep it clean
            lines = item['content'].split('\n\n')
            
            # De-duplicate adjacent identical lines or highly similar ones that sometimes happen in scraping
            seen = set()
            clean_lines = []
            for line in lines:
                if line not in seen:
                    clean_lines.append(line)
                    seen.add(line)
                    
            for line in clean_lines:
                if len(line.split()) > 4: # Only sentences with some words
                    f.write(f"{line}\n\n")
            
            f.write("---\n\n")

    print("Success! Created cerebro_vectorial.md")

if __name__ == "__main__":
    extract_info()
