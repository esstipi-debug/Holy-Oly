import os

try:
    from mistralai import Mistral
except ImportError:
    try:
        from mistralai.client import MistralClient as Mistral
    except ImportError:
        Mistral = None


class MistralProvider:
    def __init__(self):
        self.api_key = os.getenv("MISTRAL_API_KEY")
        self.client = None
        self._configured = False

        if not self.api_key:
            print("[Warning] MISTRAL_API_KEY not set - Mistral endpoints will not work")
            return

        if Mistral is None:
            print("[Warning] Mistral package not installed correctly")
            return

        try:
            self.client = Mistral(api_key=self.api_key)
            self._configured = True
        except Exception as e:
            print(f"[Warning] Mistral config failed: {e}")

    def generate(self, prompt: str, model: str = "mistral-small-latest", system_instruction: str = None) -> str:
        if not self._configured:
            return "Mistral not configured - set MISTRAL_API_KEY to enable"

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        try:
            response = self.client.chat.complete(model=model, messages=messages)
            return response.choices[0].message.content
        except Exception as e:
            return f"Mistral error: {e}"


mistral_provider = MistralProvider()
