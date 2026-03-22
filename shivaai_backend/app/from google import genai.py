import requests

API_KEY = "AIzaSyBRJKSuvuWrQtecQt5mrLGD6GtYtsTuNnk"  # replace with your key
url = f"https://generativelanguage.googleapis.com/v1beta2/models?key={API_KEY}"

try:
    response = requests.get(url)
    if response.status_code == 200:
        models = response.json().get("models", [])
        print("✅ API key is valid!")
        print("Available models:")
        for model in models:
            print("-", model["name"])
    else:
        print(f"❌ API key invalid or request failed. Status code: {response.status_code}")
        print(response.json())
except Exception as e:
    print("Error:", e)
