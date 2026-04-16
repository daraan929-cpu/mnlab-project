import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://mnlab-project.onrender.com/api/v1/settings"

# 1. Fetch current settings
req = urllib.request.Request(url)
with urllib.request.urlopen(req, context=ctx) as response:
    current_settings = json.loads(response.read().decode())

# 2. Add materials
current_settings["materials"] = [
    {
        "name": "PLA", 
        "description": "حمض البولي لاكتيك. مادة صديقة للبيئة، تعطي تفاصيل جمالية ودقيقة، ممتازة للنماذج الديكورية والمجسمات الأولية السريعة."
    },
    {
        "name": "ABS", 
        "description": "مادة شديدة الصلابة ومقاومة للحرارة والصدمات. خيارك الأمثل للقطع الميكانيكية وإكسسوارات وقطع غيار السيارات الاحترافية."
    },
    {
        "name": "PETG", 
        "description": "مزيج رائع يجمع بين متانة ABS وسهولة طباعة PLA. مقاوم للمواد الكيميائية وللماء، ممتاز للأغطية والعلب والقطع الخارجية."
    }
]

# 3. Post back
data = json.dumps(current_settings).encode('utf-8')
headers = {
    'Content-Type': 'application/json',
    'X-Admin-Password': 'admin123'
}

req_post = urllib.request.Request(url, data=data, headers=headers, method='POST')
try:
    with urllib.request.urlopen(req_post, context=ctx) as response:
        print("Success:", response.read().decode())
except urllib.error.HTTPError as e:
    print("Failed:", e.code, e.read().decode())
