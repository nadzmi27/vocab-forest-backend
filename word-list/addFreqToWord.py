from wordfreq import word_frequency

# Read the words from common.txt
with open("common.txt", "r") as f:
    words = [line.strip() for line in f if line.strip()]

# Add frequency to each word in common.txt, put in 
with open("common_with_freq.csv", "w") as out:
    out.write("word,frequency\n")

    SINGLE_WORD_BOOST = 10 # Boost frequency for single word
    PHRASE_PENALTY = 0.1 # Penalise multi word

    for word in words:
        freq = word_frequency(word, "en")
        if " " in word or "-" in word:
            freq *= PHRASE_PENALTY  # Push phrases way down
        else:
            freq *= SINGLE_WORD_BOOST  # Boost single words up
        out.write(f"{word},{freq}\n")

print("Done!")