import os
import sys
import re
import time
import httpx
from bs4 import BeautifulSoup
from pathlib import Path
from dotenv import load_dotenv

# Roots
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

# Load ENV before imports
load_dotenv(ROOT_DIR / ".env")

from infrastructure.vector_store import VectorStore
from ingestion.chunker import Chunker

class CatalystScraper:
    BASE_URL = "https://www.catalystathletics.com/articles/"
    
    def __init__(self):
        self.vs = VectorStore()
        self.chunker = Chunker()
        self.client = httpx.Client(timeout=20.0)

    def scrape_articles_list(self, num_articles: int = 5):
        print(f"Scraping Catalyst Athletics articles (target: {num_articles})...")
        response = self.client.get(self.BASE_URL)
        if response.status_code != 200:
            print(f"Error accessing Catalyst: {response.status_code}")
            return
            
        soup = BeautifulSoup(response.text, 'lxml')
        # Find all links that look like articles
        links = soup.find_all('a', href=re.compile(r'/article/\d+/'))
        
        count = 0
        visited_urls = set()
        for link in links:
            if count >= num_articles:
                break
            
            href = link['href']
            article_url = href if href.startswith('http') else "https://www.catalystathletics.com" + href
            
            if article_url in visited_urls:
                continue
            
            visited_urls.add(article_url)
            self.process_article(article_url)
            count += 1
            time.sleep(2) # Rate limit

    def process_article(self, url: str):
        print(f"Processing article: {url}")
        res = self.client.get(url)
        if res.status_code != 200:
            return
            
        soup = BeautifulSoup(res.text, 'lxml')
        title = soup.find('h1').get_text(strip=True) if soup.find('h1') else "Untitled"
        content_div = soup.find('div', class_='article-content') or soup.find('div', class_='content')
        
        if not content_div:
            return
            
        # Basic cleanup: remove ads, etc.
        text = content_div.get_text(separator='\n\n', strip=True)
        
        chunks = self.chunker.split_by_markdown_headers(f"# {title}\n\n{text}", 512, 80)
        
        brand = "holy_oly"
        sport = "weightlifting"
        
        for i, chunk in enumerate(chunks):
            if len(chunk.split()) < 30:
                continue
                
            chunk_id = self.chunker.generate_deterministic_id(brand, url, i)
            metadata = self.chunker.generate_metadata(
                brand=brand,
                sport=sport,
                topic="technique",
                source=url,
                section=title,
                text=chunk
            )
            
            self.vs.upsert(chunk_id, chunk, metadata, source=url)
            
        print(f"Finished {title}: {len(chunks)} chunks.")

if __name__ == "__main__":
    scraper = CatalystScraper()
    # Start with 5 articles to populating knowledge
    scraper.scrape_articles_list(num_articles=5)
