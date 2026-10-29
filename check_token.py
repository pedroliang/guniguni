import os
import http.client
import json

token = os.environ["SUPABASE_ACCESS_TOKEN"]
conn = http.client.HTTPSConnection("api.supabase.com")
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}
conn.request("GET", "/v1/projects", "", headers)
res = conn.getresponse()
data = res.read()
print(f"Status: {res.status}")
print(data.decode("utf-8"))
