import os
import google.generativeai as genai
from typing import Optional

class GeminiProvider:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
        
        genai.configure(api_key=api_key)
        
        # Flash Only Migration: Using 2.0 Flash Lite for best stability/cost
        self.flash_model = genai.GenerativeModel('gemini-2.0-flash-lite')

    def generate_flash(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        model = self.flash_model
        if system_instruction:
            model = genai.GenerativeModel('gemini-2.0-flash-lite', system_instruction=system_instruction)
        
        response = model.generate_content(prompt)
        return response.text

    def generate_pro(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        # Redirecting all Pro requests to Flash as per user requirement
        return self.generate_flash(prompt, system_instruction)

gemini_provider = GeminiProvider()
