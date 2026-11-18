import urllib.request
import json
import re

# Descarga el diccionario lexico completo en ingles (370k palabras base)
url = "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt"
response = urllib.request.urlopen(url)
raw_words = response.read().decode("utf-8").splitlines()

# Filtra estrictamente palabras de 4 letras alfabeticas (A-Z)
words_4 = sorted(list(set(
    w.strip().upper() for w in raw_words
    if len(w.strip()) == 4 and re.match("^[A-Z]{4}$", w.strip().upper())
)))

print(f"Total de palabras de 4 letras en el nuevo diccionario: {len(words_4)}")

# Verifica que las palabras que mencionaste esten incluidas
for test in ["BANE", "FEST", "STAN"]:
    print(f"{test}: {'INCLUIDA' if test in words_4 else 'FALTA'}")

# Guarda el archivo listo para reemplazar data/words4.json
with open("words4.json", "w") as f:
    json.dump(words_4, f)