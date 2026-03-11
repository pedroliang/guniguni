import http.client
import json

token = "sbp_9cb3069a3601ac183118513ed68481d9741d571a"
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
