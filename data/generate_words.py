import urllib.request
import json
import re

# Descarga lista limpia de palabras comunes en ingles (sin groserias ni siglas raras)
url = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt"
response = urllib.request.urlopen(url)
raw_words = response.read().decode("utf-8").splitlines()

# Filtra estrictamente palabras de 4 letras alfabeticas en mayuscula
words_4 = sorted(list(set(
    w.strip().upper() for w in raw_words
    if len(w.strip()) == 4 and re.match("^[A-Z]{4}$", w.strip().upper())
)))

print(f"Total de palabras de 4 letras encontradas: {len(words_4)}")

# Exporta a formato JSON compacto (~25 KB)
with open("words4.json", "w") as f:
    json.dump(words_4, f)