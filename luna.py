

from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
from datetime import datetime
import pytz
import math


# User input


print("=== BIRTH CHART CALCULATOR ===\n")

name = input("Enter your name: ")
birth_date_str = input("Enter your birth date (DD/MM/YYYY): ")
birth_time_str = input("Enter your birth time (HH:MM, 24h format): ")
birth_place = input("Enter your birth city and country (e.g. Rome, Italy): ")

# Parse date and time
day, month, year = [int(x) for x in birth_date_str.split("/")]
hour, minute = [int(x) for x in birth_time_str.split(":")]

print(f"\nLooking up coordinates for: {birth_place}...")


# Get coordinates


geolocator = Nominatim(user_agent="birth_chart_app")
location = geolocator.geocode(birth_place)

if location is None:
    print("Could not find location. Please check the city name.")
    exit()

latitude = location.latitude
longitude = location.longitude
print(f"Coordinates: Latitude = {latitude:.4f}, Longitude = {longitude:.4f}")

# Get timezone from coordinates
tf = TimezoneFinder()
timezone_str = tf.timezone_at(lat=latitude, lng=longitude)
tz = pytz.timezone(timezone_str)

# Build a naive datetime and localize it
local_dt = datetime(year, month, day, hour, minute)
local_dt = tz.localize(local_dt)

# Convert to UTC
utc_dt = local_dt.astimezone(pytz.utc)
ut_hour = utc_dt.hour + utc_dt.minute / 60.0  # Universal Time as decimal

print(f"Timezone: {timezone_str}")
print(f"UTC time: {utc_dt.strftime('%H:%M')} | UT decimal: {ut_hour:.4f}")


#  JULIAN DAY NUMBER (JDN) CALCULATION

# Formula: standard astronomical Julian Day Number

Y = utc_dt.year
M = utc_dt.month
D = utc_dt.day

if M <= 2:
    Y -= 1
    M += 12

A = int(Y / 100)
B = 2 - A + int(A / 4)

JDN = int(365.25 * (Y + 4716)) + int(30.6001 * (M + 1)) + D + B - 1524.5
JDN += ut_hour / 24.0  # Add fractional day for time

print(f"\nJulian Day Number (JDN): {JDN:.6f}")


# CALCULATE SUN LONGITUDE (Approximate)

# Source: Jean Meeus "Astronomical Algorithms" simplified

T = (JDN - 2451545.0) / 36525.0  # Julian centuries from J2000.0

# Mean longitude of the Sun (degrees)
L0 = 280.46646 + 36000.76983 * T
L0 = L0 % 360

# Mean anomaly of the Sun (degrees)
M_sun = 357.52911 + 35999.05029 * T - 0.0001537 * T**2
M_sun = M_sun % 360
M_sun_rad = math.radians(M_sun)

# Equation of center (degrees)
C = (1.914602 - 0.004817 * T - 0.000014 * T**2) * math.sin(M_sun_rad)
C += (0.019993 - 0.000101 * T) * math.sin(2 * M_sun_rad)
C += 0.000289 * math.sin(3 * M_sun_rad)

# Sun's true longitude
sun_longitude = (L0 + C) % 360

print(f"\n--- Sun Position Math ---")
print(f"T (Julian centuries from J2000): {T:.6f}")
print(f"Mean Longitude L0: {L0:.4f}°")
print(f"Mean Anomaly M: {M_sun:.4f}°")
print(f"Equation of Center C: {C:.4f}°")
print(f"Sun True Longitude: {sun_longitude:.4f}°")


#  CALCULATE MOON LONGITUDE (Approximate)


# Moon's mean longitude
Lm = 218.3165 + 481267.8813 * T
Lm = Lm % 360

# Moon's mean anomaly
Mm = 134.9634 + 477198.8676 * T
Mm = Mm % 360

# Sun's mean anomaly (reused)
Ms = M_sun

# Moon's argument of latitude
F = 93.2721 + 483202.0175 * T
F = F % 360

# Simplified perturbation corrections (degrees)
delta_L = (6.289 * math.sin(math.radians(Mm))
           - 1.274 * math.sin(math.radians(2 * F - Mm))
           + 0.658 * math.sin(math.radians(2 * F))
           - 0.214 * math.sin(math.radians(2 * Mm))
           - 0.186 * math.sin(math.radians(Ms))
           - 0.114 * math.sin(math.radians(2 * F)))

moon_longitude = (Lm + delta_L) % 360

print(f"\n--- Moon Position Math ---")
print(f"Moon Mean Longitude Lm: {Lm:.4f}°")
print(f"Moon Mean Anomaly Mm: {Mm:.4f}°")
print(f"Perturbation ΔL: {delta_L:.4f}°")
print(f"Moon True Longitude: {moon_longitude:.4f}°")


#  CALCULATE ASCENDANT (Rising Sign)

# Obliquity of the ecliptic
epsilon = 23.439291 - 0.013004 * T
epsilon_rad = math.radians(epsilon)

# Local Sidereal Time (LST)
GMST = 280.46061837 + 360.98564736629 * (JDN - 2451545.0)
GMST = GMST % 360
LST = (GMST + longitude) % 360  # Add geographic longitude

print(f"\n--- Ascendant Math ---")
print(f"Obliquity ε: {epsilon:.4f}°")
print(f"GMST: {GMST:.4f}°")
print(f"LST (Local Sidereal Time): {LST:.4f}°")

# Ascendant formula
LST_rad = math.radians(LST)
lat_rad = math.radians(latitude)

numerator = math.cos(LST_rad)
denominator = -(math.sin(LST_rad) * math.cos(epsilon_rad)
                + math.tan(lat_rad) * math.sin(epsilon_rad))

ascendant = math.degrees(math.atan2(numerator, denominator)) % 360

print(f"Ascendant Longitude: {ascendant:.4f}°")

#  DETERMINE ZODIAC SIGNS


zodiac_signs = [
    (0,   "Aries"),
    (30,  "Taurus"),
    (60,  "Gemini"),
    (90,  "Cancer"),
    (120, "Leo"),
    (150, "Virgo"),
    (180, "Libra"),
    (210, "Scorpio"),
    (240, "Sagittarius"),
    (270, "Capricorn"),
    (300, "Aquarius"),
    (330, "Pisces"),
]

def get_sign(longitude_deg):
    for i in range(len(zodiac_signs)):
        start = zodiac_signs[i][0]
        end = zodiac_signs[(i + 1) % 12][0]
        if i == 11:
            end = 360
        if start <= longitude_deg < end:
            return zodiac_signs[i][1]
    return "Unknown"

sun_sign    = get_sign(sun_longitude)
moon_sign   = get_sign(moon_longitude)
rising_sign = get_sign(ascendant)


# DETERMINE ELEMENT & MODALITY


elements = {
    "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
    "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
    "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
    "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water",
}

modalities = {
    "Aries": "Cardinal", "Cancer": "Cardinal", "Libra": "Cardinal", "Capricorn": "Cardinal",
    "Taurus": "Fixed", "Leo": "Fixed", "Scorpio": "Fixed", "Aquarius": "Fixed",
    "Gemini": "Mutable", "Virgo": "Mutable", "Sagittarius": "Mutable", "Pisces": "Mutable",
}

sun_element    = elements[sun_sign]
moon_element   = elements[moon_sign]
rising_element = elements[rising_sign]
sun_modality   = modalities[sun_sign]


# DETERMINE DOMINANT ELEMENT


element_counts = {"Fire": 0, "Earth": 0, "Air": 0, "Water": 0}
for el in [sun_element, moon_element, rising_element]:
    element_counts[el] += 1

dominant_element = max(element_counts, key=element_counts.get)


# PRINT BIRTH CHART


print(f"\n{'='*45}")
print(f"  BIRTH CHART FOR: {name.upper()}")
print(f"{'='*45}")
print(f"  Birth Date  : {birth_date_str}")
print(f"  Birth Time  : {birth_time_str} ({birth_place})")
print(f"  Sun Sign    : {sun_sign} ({sun_longitude:.2f}°) — {sun_element}")
print(f"  Moon Sign   : {moon_sign} ({moon_longitude:.2f}°) — {moon_element}")
print(f"  Rising Sign : {rising_sign} ({ascendant:.2f}°) — {rising_element}")
print(f"  Modality    : {sun_modality}")
print(f"  Dominant    : {dominant_element}")
print(f"{'='*45}")


#  PERSONALITY + CAREER TRAITS


sign_traits = {
    "Aries":       "bold, competitive, quick to act, natural leader",
    "Taurus":      "patient, persistent, practical, values stability",
    "Gemini":      "curious, communicative, adaptable, loves variety",
    "Cancer":      "intuitive, empathetic, protective, emotionally deep",
    "Leo":         "confident, creative, warm, driven by recognition",
    "Virgo":       "analytical, precise, detail-oriented, service-minded",
    "Libra":       "balanced, diplomatic, aesthetically minded, fair",
    "Scorpio":     "intense, perceptive, strategic, drawn to the hidden",
    "Sagittarius": "philosophical, optimistic, freedom-loving, big-picture thinker",
    "Capricorn":   "disciplined, ambitious, structured, long-term planner",
    "Aquarius":    "innovative, independent, humanitarian, systems thinker",
    "Pisces":      "imaginative, empathetic, intuitive, spiritually aware",
}

math_fields = {
    "Fire":  "Probability & Statistics, Game Theory, Dynamical Systems",
    "Earth": "Applied Mathematics, Numerical Analysis, Financial Mathematics",
    "Air":   "Logic & Set Theory, Discrete Mathematics, Combinatorics",
    "Water": "Topology, Complex Analysis, Mathematical Physics",
}

career_fields = {
    "Aries":       "Entrepreneurship, Military Strategy, Sports Science, Surgery",
    "Taurus":      "Architecture, Finance, Agriculture, Engineering",
    "Gemini":      "Journalism, Software Development, Teaching, Marketing",
    "Cancer":      "Psychology, Nursing, Social Work, Marine Biology",
    "Leo":         "Entertainment, Politics, UX Design, Executive Leadership",
    "Virgo":       "Data Science, Medicine, Accounting, Research",
    "Libra":       "Law, Diplomacy, Art Direction, Human Resources",
    "Scorpio":     "Forensics, Intelligence Agencies, Psychotherapy, Security",
    "Sagittarius": "Academia, Philosophy, Travel Industry, Publishing",
    "Capricorn":   "Government, Civil Engineering, Corporate Management, Banking",
    "Aquarius":    "Technology, Aerospace, Social Reform, AI Research",
    "Pisces":      "Arts, Music, Oceanography, Spiritual Counseling",
}

modality_note = {
    "Cardinal": "You initiate — you are a natural starter and leader of new ideas.",
    "Fixed":    "You persevere — once committed, you see things through with iron will.",
    "Mutable":  "You adapt — you excel at transitions, learning, and flexible thinking.",
}

print(f"\n--- CHARACTERISTICS ---\n")

sun_desc   = sign_traits[sun_sign]
moon_desc  = sign_traits[moon_sign]
rise_desc  = sign_traits[rising_sign]

print(f"Your Sun in {sun_sign} gives you a core nature that is: {sun_desc}.")
print(f"Your Moon in {moon_sign} means emotionally you tend to be: {moon_desc}.")
print(f"Your Rising in {rising_sign} is how others first see you: {rise_desc}.")
print(f"\n{modality_note[sun_modality]}")

# Count how many key signs share the dominant element
fire_signs  = [s for s in [sun_sign, moon_sign, rising_sign] if elements[s] == "Fire"]
earth_signs = [s for s in [sun_sign, moon_sign, rising_sign] if elements[s] == "Earth"]
air_signs   = [s for s in [sun_sign, moon_sign, rising_sign] if elements[s] == "Air"]
water_signs = [s for s in [sun_sign, moon_sign, rising_sign] if elements[s] == "Water"]

if dominant_element == "Fire":
    print(f"\nWith {len(fire_signs)}/3 key placements in Fire, you are driven by passion and action.")
elif dominant_element == "Earth":
    print(f"\nWith {len(earth_signs)}/3 key placements in Earth, you are grounded and pragmatic.")
elif dominant_element == "Air":
    print(f"\nWith {len(air_signs)}/3 key placements in Air, you are a thinker and communicator.")
elif dominant_element == "Water":
    print(f"\nWith {len(water_signs)}/3 key placements in Water, you are deeply intuitive and emotionally intelligent.")

print(f"\n--- SUITED MATHEMATICS FIELDS ---\n")
print(f"Based on your dominant element ({dominant_element}):")
print(f"  → {math_fields[dominant_element]}")

print(f"\n--- SUITED CAREER FIELDS ---\n")
print(f"Based on your Sun sign ({sun_sign}):")
print(f"  → {career_fields[sun_sign]}")

# Extra insight if rising and sun share the same career vibe
if sun_sign != rising_sign:
    print(f"\nYour Rising sign ({rising_sign}) also pulls you toward:")
    print(f"  → {career_fields[rising_sign]}")

print(f"\n{'='*45}")
print("End of birth chart reading.")
print(f"{'='*45}\n")
