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

# 2. Add content
if "content" not in current_settings:
    current_settings["content"] = {}

current_settings["content"]["hero_title"] = "حول أفكارك إلى واقع ملموس"
current_settings["content"]["hero_subtitle"] = "نقدم في MNLAB أفضل خدمات الطباعة ثلاثية الأبعاد بجودة احترافية ودقة عالية للنماذج الأولية والمنتجات النهائية."

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
