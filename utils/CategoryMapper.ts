export const CATEGORIES = {
    FAMILY: { en: "Family", tr: "Aile" },
    FOOD: { en: "Food & Drink", tr: "Yiyecek & İçecek" },
    TIME: { en: "Time", tr: "Zaman" },
    ANIMALS: { en: "Animals", tr: "Hayvanlar" },
    CLOTHING: { en: "Clothing", tr: "Giyim" },
    BODY: { en: "Body", tr: "Vücut" },
    WORK_SCHOOL: { en: "Education & Work", tr: "Eğitim & İş" },
    PLACES: { en: "Places", tr: "Yer & Mekan" },
    TRANSPORT: { en: "Transport", tr: "Ulaşım" },
    COLORS: { en: "Colors", tr: "Renkler" },
    NUMBERS: { en: "Numbers", tr: "Sayılar" },
    DAILY: { en: "Daily Life", tr: "Günlük Yaşam" },
    ADJECTIVES: { en: "Adjectives", tr: "Sıfatlar" },
    NATURE: { en: "Nature", tr: "Doğa" },
};

const KEYWORD_MAP: Record<string, string[]> = {
    [CATEGORIES.FAMILY.en]: ["aunt", "baby", "brother", "dad", "daughter", "family", "father", "grandfather", "grandmother", "grandparent", "husband", "mother", "mum", "parent", "sister", "son", "uncle", "wife", "child", "children", "boy", "girl", "man", "woman", "person", "people", "friend", "neighbour", "guest"],
    [CATEGORIES.FOOD.en]: ["apple", "banana", "beer", "biscuit", "bread", "breakfast", "butter", "cake", "carrot", "cheese", "chicken", "chocolate", "coffee", "cook", "cream", "dinner", "drink", "eat", "egg", "fish", "food", "fruit", "juice", "lunch", "meal", "meat", "milk", "onion", "orange", "pepper", "potato", "rice", "salad", "salt", "sandwich", "soup", "sugar", "tea", "tomato", "water", "wine", "glass", "cup", "bottle", "plate", "fork", "knife", "spoon", "restaurant", "cafe", "menu", "waiter"],
    [CATEGORIES.TIME.en]: ["afternoon", "april", "august", "autumn", "birthday", "century", "clock", "date", "day", "december", "evening", "february", "friday", "hour", "january", "july", "june", "march", "may", "midnight", "minute", "moment", "monday", "month", "morning", "night", "november", "october", "past", "saturday", "second", "september", "spring", "summer", "sunday", "thursday", "time", "today", "tomorrow", "tonight", "tuesday", "wednesday", "week", "weekend", "winter", "year", "yesterday", "now", "later", "soon", "early", "late"],
    [CATEGORIES.ANIMALS.en]: ["animal", "bear", "bird", "cat", "cow", "dog", "elephant", "fish", "horse", "lion", "mouse", "pig", "sheep", "snake", "tiger", "rabbit", "monkey", "pet", "farm", "zoo"],
    [CATEGORIES.CLOTHING.en]: ["bag", "boot", "clothes", "coat", "dress", "hat", "jacket", "jeans", "shirt", "shoe", "skirt", "suit", "sweater", "trousers", "t-shirt", "watch", "wear", "pocket", "glasses", "ring", "umbrella"],
    [CATEGORIES.BODY.en]: ["arm", "back", "body", "ear", "eye", "face", "foot", "hair", "hand", "head", "leg", "mouth", "nose", "tooth", "teeth", "neck", "shoulder", "finger", "toe", "heart", "stomach", "blood"],
    [CATEGORIES.WORK_SCHOOL.en]: ["book", "class", "classroom", "computer", "course", "desk", "dictionary", "exam", "homework", "job", "learn", "lesson", "library", "note", "pen", "pencil", "student", "study", "teacher", "test", "work", "office", "business", "company", "manager", "staff", "meeting", "internet", "email", "paper", "page", "project", "university", "college", "school"],
    [CATEGORIES.PLACES.en]: ["airport", "apartment", "bank", "beach", "bedroom", "building", "cafe", "centre", "cinema", "city", "country", "flat", "garden", "home", "hospital", "hotel", "house", "kitchen", "library", "market", "museum", "office", "park", "place", "police", "post", "restaurant", "room", "school", "shop", "station", "street", "supermarket", "theatre", "toilet", "town", "university", "village", "bathroom", "living", "hall", "gym", "zoo", "factory", "farm", "castle"],
    [CATEGORIES.TRANSPORT.en]: ["bicycle", "bike", "boat", "bus", "car", "drive", "driver", "flight", "fly", "plane", "ride", "road", "taxi", "train", "travel", "ticket", "station", "stop", "tourist", "visit", "wheel", "engine", "machine"],
    [CATEGORIES.COLORS.en]: ["black", "blue", "brown", "colour", "green", "grey", "orange", "pink", "purple", "red", "white", "yellow", "dark", "light", "bright"],
    [CATEGORIES.NUMBERS.en]: ["eight", "eighteen", "eighty", "eleven", "fifteen", "fifty", "first", "five", "forty", "four", "fourteen", "hundred", "million", "nine", "nineteen", "ninety", "one", "seven", "seventeen", "seventy", "six", "sixteen", "sixty", "ten", "third", "thirteen", "thirty", "thousand", "three", "twelve", "twenty", "two", "second", "zero", "number"],
    [CATEGORIES.NATURE.en]: ["air", "beach", "cloud", "fire", "flower", "forest", "grass", "hill", "ice", "island", "lake", "moon", "mountain", "nature", "plant", "rain", "river", "sea", "sky", "snow", "star", "sun", "tree", "water", "weather", "wind", "wood", "world", "space"],
    [CATEGORIES.ADJECTIVES.en]: ["afraid", "angry", "bad", "beautiful", "big", "bored", "boring", "busy", "cheap", "clean", "cold", "dangerous", "dark", "difficult", "dirty", "easy", "empty", "excited", "exciting", "expensive", "famous", "fast", "fat", "favorite", "full", "funny", "good", "great", "happy", "hard", "heavy", "high", "hot", "hungry", "important", "interesting", "large", "late", "light", "little", "long", "low", "modern", "near", "new", "nice", "old", "poor", "popular", "quiet", "ready", "rich", "right", "sad", "short", "sick", "slow", "small", "strong", "tall", "terrible", "thirsty", "tired", "useful", "warm", "weak", "wrong", "young", "same", "different"],
};

export const getCategoryForWord = (word: string): { name: string, name_tr: string } | null => {
    const lowerWord = word.toLowerCase().trim();

    // Direct matching
    for (const [catName, keywords] of Object.entries(KEYWORD_MAP)) {
        if (keywords.includes(lowerWord)) {
            // Find the category object to get TR translation
            const catEntry = Object.values(CATEGORIES).find(c => c.en === catName);
            if (catEntry) {
                return { name: catEntry.en, name_tr: catEntry.tr };
            }
            return { name: catName, name_tr: catName };
        }
    }

    return null;
};
