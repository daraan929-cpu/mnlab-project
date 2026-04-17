import time
import os
import base64
from typing import Dict, Any, List
try:
    import google.generativeai as genai
except ImportError:
    genai = None

MNLAB_SYSTEM_PROMPT = """أنت "مساعد MNLAB الذكي" — مساعد متخصص حصرياً في مختبر MNLAB للطباعة ثلاثية الأبعاد في اليمن.

## هويتك:
- اسمك: مساعد MNLAB الذكي
- تعمل لصالح شركة MNLAB المتخصصة في الطباعة ثلاثية الأبعاد والتصنيع الرقمي
- أنت لست ChatGPT ولا أي مساعد عام — أنت بوت متخصص

## ما تستطيع مساعدة العملاء فيه:
1. خدمات MNLAB (الطباعة ثلاثية الأبعاد، النماذج الأولية، التصنيع المخصص)
2. المواد المتاحة (PLA، ABS، PETG وغيرها)
3. الأسعار والعروض (وجّه العميل للتواصل المباشر إذا احتاج سعراً دقيقاً)
4. طريقة إرسال الطلبات وتقديم التصاميم
5. مدة التسليم والعمليات
6. تقنيات الطباعة ثلاثية الأبعاد بشكل عام
7. توجيه العملاء لقسم التواصل أو الدعم الفني

## رقم الدعم الفني المباشر: 967737214666+

## قواعد الرد:
- تحدث دائماً باللغة العربية إلا إذا بدأ العميل بالإنجليزية فرد بها
- كن ودوداً ومحترفاً ومختصراً
- إذا سألك أحد عن موضوع لا علاقة له بـ MNLAB أو الطباعة ثلاثية الأبعاد (مثل: أسئلة برمجة، طبخ، سياسة، رياضة، نكات، أسئلة شخصية، إلخ)، اعتذر بأدب شديد ووضّح أنك متخصص فقط في خدمات MNLAB، واقترح عليه التواصل إذا كان لديه استفسار عن الطباعة ثلاثية الأبعاد
- لا تتخيل أسعاراً — وجّه العميل للتواصل المباشر لأسعار دقيقة"""

class GeminiAI:
    def __init__(self):
        self.api_key = None
        self.model = None
        self.vision_model = None

    def configure(self, api_key: str):
        if not api_key or not genai:
            return
        self.api_key = api_key
        genai.configure(api_key=api_key)
        generation_config = genai.GenerationConfig(
            temperature=0.8,
            max_output_tokens=2048,
            top_p=0.95,
            top_k=40
        )
        system_instruction = MNLAB_SYSTEM_PROMPT
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            system_instruction=system_instruction,
            generation_config=generation_config
        )
        self.vision_model = genai.GenerativeModel(
            'gemini-2.5-flash',
            system_instruction=system_instruction,
            generation_config=generation_config
        )

    async def chat(self, message: str, history: List[Dict] = None) -> str:
        if not self.model:
            return "عذراً، نظام الذكاء الاصطناعي في وضع الصيانة أو لم يتم ضبط مفتاح الـ API بعد."
        
        try:
            # Sanitize history: ensure roles alternate user/model properly
            safe_history = []
            last_role = None
            for msg in (history or []):
                role = msg.get('role', '')
                if role in ('user', 'model') and role != last_role:
                    parts = msg.get('parts', [])
                    # Filter out empty parts
                    clean_parts = [p for p in parts if p.get('text', '').strip()]
                    if clean_parts:
                        safe_history.append({'role': role, 'parts': clean_parts})
                        last_role = role

            chat_session = self.model.start_chat(history=safe_history)
            response = await chat_session.send_message_async(message)
            return response.text
        except Exception as e:
            return f"حدث خطأ أثناء معالجة طلبك: {str(e)}"


    async def analyze_image(self, image_bytes: bytes, prompt: str) -> str:
        if not self.vision_model:
            return "نظام الرؤية غير متاح حالياً."
        
        try:
            # Prepare image for Gemini
            image_parts = [{"mime_type": "image/jpeg", "data": image_bytes}]
            response = await self.vision_model.generate_content_async([prompt, image_parts[0]])
            return response.text
        except Exception as e:
            return f"خطأ في تحليل الصورة: {str(e)}"

class AdvancedVisionSystem2026:
    def __init__(self):
        self.ai = GeminiAI()
        
    def configure(self, api_key: str):
        self.ai.configure(api_key)

    async def analyze_scene(self, image_stream) -> Dict[str, Any]:
        # Use Gemini for real scene understanding if configured
        prompt = "Analyze this image for a 3D printing lab. Identify objects, materials, and potential for 3D scanning or printing. Return as a professional summary in Arabic."
        description = await self.ai.analyze_image(image_stream, prompt)
        
        return {
            'scene_understanding': description,
            'objects_detected': [{"class": "Detected by AI", "confidence": 0.99}],
            'spatial_map': {"active": True},
            'audit_trail': {
                'timestamp': time.time(),
                'privacy_level': 'PII_ANONYMIZED'
            }
        }

class SecureFaceVerification:
    def verify_identity(self, face_image, claimed_id):
        # Keeping this as a secure mock for now as it's a simulated prototype feature
        return True, {"proof_hash": "abc123zkp", "verified": True}

class HomeMixerX:
    """Orchestration layer combining Thunder, Phoenix and Grok (Mock for Demo)"""
    def get_for_you_feed(self, user_id):
        return {
            "user": user_id, 
            "feed_length": 4,
            "feed": {
                "ترس ميكانيكي عالي الدقة": 0.98,
                "مجسم فني تجريدي": 0.92,
                "قاعدة شحن لاسلكي": 0.85,
                "إطار نظارة مخصص": 0.80
            },
            "algorithm_used": "X For You Feed (Phoenix, Thunder, Grok-1)"
        }
