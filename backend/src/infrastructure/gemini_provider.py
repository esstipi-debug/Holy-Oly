import os
import google.generativeai as genai
from typing import Optional

class GeminiProvider:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.flash_model = None
        self._configured = False
        
        if not self.api_key:
            print("[Warning] GOOGLE_API_KEY not set - RAG endpoints will not work")
            return
            
        try:
            genai.configure(api_key=self.api_key)
            self.flash_model = genai.GenerativeModel('gemini-2.0-flash-lite')
            self._configured = True
        except Exception as e:
            print(f"[Warning] Gemini config failed: {e}")

    def generate_flash(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self._configured:
            return "Gemini not configured - set GOOGLE_API_KEY to enable"
        
        model = self.flash_model
        if system_instruction:
            model = genai.GenerativeModel('gemini-2.0-flash-lite', system_instruction=system_instruction)
        
        response = model.generate_content(prompt)
        return response.text

    def generate_pro(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self._configured:
            return "Gemini not configured"
        return self.generate_flash(prompt, system_instruction)

gemini_provider = GeminiProvider()
